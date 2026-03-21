import { Prisma, EnrichmentRunKind, EnrichmentRunStatus } from "@/generated/prisma/client";
import { enrichVocabularyCatalogWithAI, type CatalogEnrichmentProgressEvent } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import {
  enrichImportedWordsWithItwewinaPages,
  type ItwewinaImportProgressEvent
} from "@/lib/itwewina";

export type EnrichmentMode = "ai" | "itwewina";

export type EnrichmentRunProgressState = {
  stage: ItwewinaImportProgressEvent["stage"];
  completed: number;
  total: number;
  term?: string;
  status: string;
  unitLabel?: string;
};

export type PersistedEnrichmentRun = {
  id: string;
  mode: EnrichmentMode;
  status: "queued" | "running" | "completed" | "failed";
  progress: EnrichmentRunProgressState;
  warnings: string[];
  error?: string;
  summary?: Awaited<ReturnType<typeof enrichVocabularyCatalogWithAI>>;
  processedCount?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
};

type EnrichmentRunRecord = Awaited<ReturnType<typeof getEnrichmentRunById>>;

type StoredRunResult =
  | Awaited<ReturnType<typeof enrichVocabularyCatalogWithAI>>
  | {
      processedCount: number;
    };

declare global {
  // eslint-disable-next-line no-var
  var enrichmentRunTasks: Map<string, Promise<void>> | undefined;
}

const ACTIVE_RUN_STATUSES = [EnrichmentRunStatus.queued, EnrichmentRunStatus.running] as const;
const STOPPED_ENRICHMENT_MESSAGE = "Enrichment stopped from dashboard.";
const VALID_PROGRESS_STAGES = new Set<ItwewinaImportProgressEvent["stage"]>([
  "starting",
  "waiting",
  "searching",
  "retrying",
  "enriching",
  "finalizing",
  "complete",
  "skipped"
]);
const enrichmentRunTasks = globalThis.enrichmentRunTasks ?? new Map<string, Promise<void>>();

if (process.env.NODE_ENV !== "production") {
  globalThis.enrichmentRunTasks = enrichmentRunTasks;
}

class EnrichmentRunStoppedError extends Error {
  constructor(message = STOPPED_ENRICHMENT_MESSAGE) {
    super(message);
    this.name = "EnrichmentRunStoppedError";
  }
}

function modeToKind(mode: EnrichmentMode) {
  return mode === "ai" ? EnrichmentRunKind.ai : EnrichmentRunKind.itwewina;
}

function kindToMode(kind: EnrichmentRunKind): EnrichmentMode {
  return kind === EnrichmentRunKind.ai ? "ai" : "itwewina";
}

function isActiveRunStatus(status: EnrichmentRunStatus) {
  return status === EnrichmentRunStatus.queued || status === EnrichmentRunStatus.running;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toJsonOrNull(value: Prisma.InputJsonValue | string[] | null | undefined) {
  return value && (Array.isArray(value) ? value.length > 0 : true) ? value : Prisma.JsonNull;
}

function readWarnings(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readResult(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as StoredRunResult) : undefined;
}

function normalizeStage(
  stage: string | null,
  status: EnrichmentRunStatus
): ItwewinaImportProgressEvent["stage"] {
  if (stage && VALID_PROGRESS_STAGES.has(stage as ItwewinaImportProgressEvent["stage"])) {
    return stage as ItwewinaImportProgressEvent["stage"];
  }

  switch (status) {
    case EnrichmentRunStatus.completed:
      return "complete";
    case EnrichmentRunStatus.failed:
      return "complete";
    default:
      return "starting";
  }
}

function buildDefaultStatusMessage(run: NonNullable<EnrichmentRunRecord>) {
  if (run.status === EnrichmentRunStatus.failed) {
    return run.error ?? "Enrichment failed.";
  }

  if (run.status === EnrichmentRunStatus.completed) {
    return run.kind === EnrichmentRunKind.ai ? "AI enrichment complete." : "Itwewina page enrichment complete.";
  }

  if (run.kind === EnrichmentRunKind.ai) {
    return "Preparing AI enrichment.";
  }

  return "Preparing Itwewina page enrichment.";
}

function serializeRun(run: NonNullable<EnrichmentRunRecord>): PersistedEnrichmentRun {
  const result = readResult(run.result);

  return {
    id: run.id,
    mode: kindToMode(run.kind),
    status: run.status,
    progress: {
      stage: normalizeStage(run.stage, run.status),
      completed: run.completed,
      total: run.total,
      term: run.term ?? undefined,
      status: run.statusMessage ?? buildDefaultStatusMessage(run),
      unitLabel: run.unitLabel ?? undefined
    },
    warnings: readWarnings(run.warnings),
    error: run.error ?? undefined,
    summary:
      run.kind === EnrichmentRunKind.ai && result && "processedWords" in result
        ? result
        : undefined,
    processedCount:
      run.kind === EnrichmentRunKind.itwewina && result && "processedCount" in result
        ? result.processedCount
        : undefined,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    startedAt: run.startedAt?.toISOString(),
    finishedAt: run.finishedAt?.toISOString()
  };
}

async function getEnrichmentRunById(runId: string) {
  return prisma.enrichmentRun.findUnique({
    where: { id: runId }
  });
}

async function assertRunIsActive(runId: string) {
  const run = await prisma.enrichmentRun.findUnique({
    where: { id: runId },
    select: {
      status: true
    }
  });

  if (!run || !isActiveRunStatus(run.status)) {
    throw new EnrichmentRunStoppedError();
  }
}

async function updateRunProgress(runId: string, progress: EnrichmentRunProgressState) {
  const result = await prisma.enrichmentRun.updateMany({
    where: {
      id: runId,
      status: {
        in: [...ACTIVE_RUN_STATUSES]
      }
    },
    data: {
      status: EnrichmentRunStatus.running,
      stage: progress.stage,
      completed: progress.completed,
      total: progress.total,
      term: progress.term ?? null,
      statusMessage: progress.status,
      unitLabel: progress.unitLabel ?? null,
      error: null,
      finishedAt: null
    }
  });

  if (result.count === 0) {
    throw new EnrichmentRunStoppedError();
  }
}

async function completeAiRun(runId: string) {
  await updateRunProgress(runId, {
    stage: "starting",
    completed: 0,
    total: 0,
    status: "Preparing AI enrichment.",
    unitLabel: "AI batches"
  });

  const warnings: string[] = [];
  const summary = await enrichVocabularyCatalogWithAI({
    onProgress(event: CatalogEnrichmentProgressEvent) {
      return updateRunProgress(runId, {
        stage: event.completed >= event.total && event.total > 0 ? "finalizing" : "enriching",
        completed: event.completed,
        total: event.total,
        status: event.status,
        unitLabel: "AI batches"
      });
    },
    shouldContinue() {
      return assertRunIsActive(runId);
    }
  });

  if (summary.warning) {
    warnings.push(summary.warning);
  }

  const result = await prisma.enrichmentRun.updateMany({
    where: {
      id: runId,
      status: {
        in: [...ACTIVE_RUN_STATUSES]
      }
    },
    data: {
      status: EnrichmentRunStatus.completed,
      stage: summary.skipped ? "skipped" : "complete",
      completed: summary.processedWords,
      total: summary.processedWords,
      term: null,
      statusMessage: summary.skipped ? "AI enrichment was skipped." : "AI enrichment complete.",
      unitLabel: "words",
      warnings: toJsonOrNull(warnings),
      result: toJsonValue(summary),
      error: null,
      finishedAt: new Date()
    }
  });

  if (result.count === 0) {
    throw new EnrichmentRunStoppedError();
  }
}

async function completeItwewinaRun(runId: string) {
  await updateRunProgress(runId, {
    stage: "starting",
    completed: 0,
    total: 0,
    status: "Preparing Itwewina page enrichment.",
    unitLabel: "imported records"
  });

  const result = await enrichImportedWordsWithItwewinaPages({
    onProgress(event) {
      return updateRunProgress(runId, {
        stage: event.stage,
        completed: event.completed,
        total: event.total,
        term: event.term,
        status: event.status,
        unitLabel: event.unitLabel
      });
    },
    shouldContinue() {
      return assertRunIsActive(runId);
    }
  });

  const updateResult = await prisma.enrichmentRun.updateMany({
    where: {
      id: runId,
      status: {
        in: [...ACTIVE_RUN_STATUSES]
      }
    },
    data: {
      status: EnrichmentRunStatus.completed,
      stage: "complete",
      completed: result.processedCount,
      total: result.processedCount,
      term: null,
      statusMessage: "Itwewina page enrichment complete.",
      unitLabel: "imported records",
      warnings: toJsonOrNull(result.warnings),
      result: toJsonValue({ processedCount: result.processedCount }),
      error: null,
      finishedAt: new Date()
    }
  });

  if (updateResult.count === 0) {
    throw new EnrichmentRunStoppedError();
  }
}

async function runEnrichmentTask(runId: string) {
  const run = await getEnrichmentRunById(runId);

  if (!run || !isActiveRunStatus(run.status)) {
    return;
  }

  const startResult = await prisma.enrichmentRun.updateMany({
    where: {
      id: runId,
      status: {
        in: [...ACTIVE_RUN_STATUSES]
      }
    },
    data: {
      status: EnrichmentRunStatus.running,
      startedAt: run.startedAt ?? new Date(),
      finishedAt: null,
      error: null
    }
  });

  if (startResult.count === 0) {
    return;
  }

  try {
    if (run.kind === EnrichmentRunKind.ai) {
      await completeAiRun(runId);
    } else {
      await completeItwewinaRun(runId);
    }
  } catch (error) {
    if (error instanceof EnrichmentRunStoppedError) {
      return;
    }

    await prisma.enrichmentRun.update({
      where: { id: runId },
      data: {
        status: EnrichmentRunStatus.failed,
        statusMessage: "Enrichment failed.",
        error: error instanceof Error ? error.message : "Enrichment failed.",
        finishedAt: new Date()
      }
    });
  }
}

function scheduleRun(runId: string) {
  if (enrichmentRunTasks.has(runId)) {
    return;
  }

  const task = new Promise<void>((resolve) => {
    setTimeout(() => {
      void runEnrichmentTask(runId)
        .catch(() => {
          // Errors are persisted on the run record so the poller can surface them.
        })
        .finally(resolve);
    }, 0);
  }).finally(() => {
    enrichmentRunTasks.delete(runId);
  });

  enrichmentRunTasks.set(runId, task);
}

function maybeScheduleRun(run: EnrichmentRunRecord) {
  if (!run || !isActiveRunStatus(run.status)) {
    return;
  }

  scheduleRun(run.id);
}

async function findActiveRun() {
  return prisma.enrichmentRun.findFirst({
    where: {
      status: {
        in: [...ACTIVE_RUN_STATUSES]
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getLatestEnrichmentRun() {
  const activeRun = await findActiveRun();

  if (activeRun) {
    maybeScheduleRun(activeRun);
    return serializeRun(activeRun);
  }

  const latestRun = await prisma.enrichmentRun.findFirst({
    orderBy: [{ createdAt: "desc" }]
  });

  return latestRun ? serializeRun(latestRun) : null;
}

export async function stopActiveEnrichmentRun() {
  const activeRun = await findActiveRun();

  if (!activeRun) {
    const latestRun = await prisma.enrichmentRun.findFirst({
      orderBy: [{ createdAt: "desc" }]
    });

    return {
      run: latestRun ? serializeRun(latestRun) : null,
      stopped: false,
      notice: "No enrichment run is currently in progress."
    };
  }

  const finishedAt = new Date();

  await prisma.enrichmentRun.update({
    where: { id: activeRun.id },
    data: {
      status: EnrichmentRunStatus.failed,
      stage: "complete",
      term: null,
      statusMessage: STOPPED_ENRICHMENT_MESSAGE,
      error: STOPPED_ENRICHMENT_MESSAGE,
      finishedAt
    }
  });

  const stoppedRun = await getEnrichmentRunById(activeRun.id);

  return {
    run: stoppedRun ? serializeRun(stoppedRun) : null,
    stopped: true
  };
}

export async function startEnrichmentRun(mode: EnrichmentMode) {
  const activeRun = await findActiveRun();

  if (activeRun) {
    maybeScheduleRun(activeRun);

    return {
      run: serializeRun(activeRun),
      started: false,
      notice:
        activeRun.kind === modeToKind(mode)
          ? "This enrichment run is already in progress."
          : "Another enrichment run is already in progress."
    };
  }

  const run = await prisma.enrichmentRun.create({
    data: {
      kind: modeToKind(mode),
      status: EnrichmentRunStatus.queued,
      stage: "starting",
      completed: 0,
      total: 0,
      statusMessage: mode === "ai" ? "Preparing AI enrichment." : "Preparing Itwewina page enrichment.",
      unitLabel: mode === "ai" ? "AI batches" : "imported records"
    }
  });

  scheduleRun(run.id);

  return {
    run: serializeRun(run),
    started: true
  };
}
