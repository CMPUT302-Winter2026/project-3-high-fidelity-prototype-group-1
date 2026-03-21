"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { IMPORT_CSV_COLUMNS, IMPORT_ITWEWINA_EXAMPLE, IMPORT_JSON_EXAMPLE } from "@/lib/constants";

type ItwewinaProgressStage =
  | "starting"
  | "waiting"
  | "searching"
  | "retrying"
  | "enriching"
  | "finalizing"
  | "complete"
  | "skipped";

type ItwewinaProgressState = {
  stage: ItwewinaProgressStage;
  completed: number;
  total: number;
  term?: string;
  status: string;
  unitLabel?: string;
};

type ItwewinaImportProgressEvent = {
  type: "progress";
  stage: ItwewinaProgressStage;
  completed: number;
  total: number;
  term?: string;
  status: string;
  unitLabel?: string;
};

type ItwewinaImportResultEvent = {
  type: "result";
  importedCount: number;
  queryCount: number;
  warnings?: string[];
};

type ItwewinaImportErrorEvent = {
  type: "error";
  error: string;
};

type ItwewinaImportStreamEvent =
  | ItwewinaImportProgressEvent
  | ItwewinaImportResultEvent
  | ItwewinaImportErrorEvent;

type EnrichmentMode = "ai" | "itwewina";
type EnrichmentRunStatus = "queued" | "running" | "completed" | "failed";

type AiImportSummary = {
  skipped: boolean;
  processedWords: number;
  addedCategoryAssignments: number;
  addedRelations: number;
  addedBeginnerExplanations: number;
  addedExpertExplanations: number;
  warning?: string;
};

type PersistedEnrichmentRun = {
  id: string;
  mode: EnrichmentMode;
  status: EnrichmentRunStatus;
  progress: ItwewinaProgressState;
  warnings: string[];
  error?: string;
  summary?: AiImportSummary;
  processedCount?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
};

function buildImportMessage({
  importedCount,
  queryCount,
  warnings
}: {
  importedCount: number;
  queryCount?: number;
  warnings: string[];
}) {
  const baseMessage = queryCount
    ? `Imported ${importedCount} entries from ${queryCount} itwewina search term(s).`
    : `Imported ${importedCount} entries.`;

  return warnings.length > 0 ? `${baseMessage} Completed with ${warnings.length} warning(s).` : baseMessage;
}

function buildAiEnrichmentMessage(ai: AiImportSummary) {
  if (ai.skipped) {
    return "AI enrichment was skipped.";
  }

  return `AI enrichment processed ${ai.processedWords} word${
    ai.processedWords === 1 ? "" : "s"
  }, adding ${ai.addedCategoryAssignments} category assignment${
    ai.addedCategoryAssignments === 1 ? "" : "s"
  }, ${ai.addedRelations} relation${ai.addedRelations === 1 ? "" : "s"}, ${ai.addedBeginnerExplanations} beginner explanation${
    ai.addedBeginnerExplanations === 1 ? "" : "s"
  }, and ${ai.addedExpertExplanations} expert explanation${ai.addedExpertExplanations === 1 ? "" : "s"}.`;
}

function buildItwewinaPageEnrichmentMessage(processedCount: number, warnings: string[]) {
  const baseMessage = `Enriched ${processedCount} imported Itwewina record${processedCount === 1 ? "" : "s"} with full-page data.`;
  return warnings.length > 0 ? `${baseMessage} Completed with ${warnings.length} warning(s).` : baseMessage;
}

function buildProgressPercent(progress: ItwewinaProgressState) {
  if (progress.total <= 0) {
    return 0;
  }

  const inFlightStages = new Set<ItwewinaProgressStage>(["waiting", "searching", "retrying", "enriching", "finalizing"]);
  const inFlightOffset = progress.completed < progress.total && inFlightStages.has(progress.stage) ? 0.5 : 0;

  const percent = Math.round(((progress.completed + inFlightOffset) / progress.total) * 100);

  if (progress.completed < progress.total) {
    return Math.min(99, percent);
  }

  return Math.min(100, percent);
}

async function readJsonLineStream<EventType>(
  response: Response,
  onEvent: (event: EventType) => void
) {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Import progress stream was unavailable.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

      let newlineIndex = buffer.indexOf("\n");

      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line) {
          onEvent(JSON.parse(line) as EventType);
        }

        newlineIndex = buffer.indexOf("\n");
      }

      if (done) {
        break;
      }
    }

    const trailingLine = buffer.trim();

    if (trailingLine) {
      onEvent(JSON.parse(trailingLine) as EventType);
    }
  } catch (error) {
    throw new Error(
      `The import stream disconnected before a final result was received. ${
        error instanceof Error && error.message ? `Last browser error: ${error.message}. ` : ""
      }Refresh the admin word list to confirm whether the import still finished on the server.`
    );
  }
}

export function ImportForm() {
  const [mode, setMode] = useState<"json" | "csv" | "itwewina">("json");
  const [text, setText] = useState(IMPORT_JSON_EXAMPLE);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ItwewinaProgressState | null>(null);
  const [enrichmentMessage, setEnrichmentMessage] = useState("");
  const [enrichmentWarning, setEnrichmentWarning] = useState("");
  const [enrichmentError, setEnrichmentError] = useState("");
  const [isEnrichmentRunning, setIsEnrichmentRunning] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<ItwewinaProgressState | null>(null);
  const [activeEnrichment, setActiveEnrichment] = useState<EnrichmentMode | null>(null);
  const router = useRouter();
  const lastObservedEnrichmentRunRef = useRef<{ id: string; status: EnrichmentRunStatus } | null>(null);
  const isItwewinaMode = mode === "itwewina";
  const progressPercent = progress ? buildProgressPercent(progress) : 0;
  const enrichmentProgressPercent = enrichmentProgress ? buildProgressPercent(enrichmentProgress) : 0;

  const syncEnrichmentRun = useCallback((run: PersistedEnrichmentRun | null) => {
    if (!run) {
      setIsEnrichmentRunning(false);
      setActiveEnrichment(null);
      setEnrichmentProgress(null);
      setEnrichmentMessage("");
      setEnrichmentWarning("");
      setEnrichmentError("");
      return;
    }

    const previousRun = lastObservedEnrichmentRunRef.current;
    const isCurrentRunActive = run.status === "queued" || run.status === "running";
    const didRunJustFinish =
      previousRun &&
      previousRun.id === run.id &&
      (previousRun.status === "queued" || previousRun.status === "running") &&
      !isCurrentRunActive;

    setActiveEnrichment(run.mode);
    setIsEnrichmentRunning(isCurrentRunActive);
    setEnrichmentProgress(run.progress);
    setEnrichmentWarning(run.warnings.join("\n"));

    if (run.status === "completed") {
      setEnrichmentError("");
      setEnrichmentMessage(
        run.mode === "ai"
          ? buildAiEnrichmentMessage(
              run.summary ?? {
                skipped: false,
                processedWords: run.progress.completed,
                addedCategoryAssignments: 0,
                addedRelations: 0,
                addedBeginnerExplanations: 0,
                addedExpertExplanations: 0
              }
            )
          : buildItwewinaPageEnrichmentMessage(run.processedCount ?? 0, run.warnings)
      );
    } else {
      setEnrichmentMessage("");
      setEnrichmentError(run.status === "failed" ? run.error ?? "Enrichment failed." : "");
    }

    lastObservedEnrichmentRunRef.current = {
      id: run.id,
      status: run.status
    };

    if (didRunJustFinish) {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function pollEnrichmentStatus() {
      try {
        const response = await fetch("/api/admin/enrich/status", {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as { run?: PersistedEnrichmentRun | null } | null;

        if (!cancelled) {
          syncEnrichmentRun(payload?.run ?? null);
        }
      } catch {
        // Keep the last known progress in the UI and try again on the next poll.
      }
    }

    void pollEnrichmentStatus();
    const intervalId = window.setInterval(() => {
      void pollEnrichmentStatus();
    }, 4_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [syncEnrichmentRun]);

  async function runStandardImport() {
    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, text })
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          importedCount?: number;
          queryCount?: number;
          warnings?: string[];
          error?: string;
        }
      | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? "Import failed.");
    }

    const importedCount = payload?.importedCount ?? 0;
    const queryCount = payload?.queryCount;
    const warnings = payload?.warnings ?? [];

    setMessage(buildImportMessage({ importedCount, queryCount, warnings }));
    setWarning(warnings.join("\n"));
    router.refresh();
  }

  async function runItwewinaImport() {
    const response = await fetch("/api/admin/import/itwewina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Import failed.");
    }

    const result = await new Promise<ItwewinaImportResultEvent>((resolve, reject) => {
      readJsonLineStream<ItwewinaImportStreamEvent>(response, (event) => {
        if (event.type === "progress") {
          setProgress({
            stage: event.stage,
            completed: event.completed,
            total: event.total,
            term: event.term,
            status: event.status,
            unitLabel: event.unitLabel
          });
          return;
        }

        if (event.type === "result") {
          resolve(event);
          return;
        }

        reject(new Error(event.error));
      }).catch(reject);
    });

    const warnings = result.warnings ?? [];

    setProgress({
      stage: "complete",
      completed: result.queryCount,
      total: result.queryCount,
      status: "Import complete.",
      unitLabel: "search terms"
    });
    setMessage(
      buildImportMessage({
        importedCount: result.importedCount,
        queryCount: result.queryCount,
        warnings
      })
    );
    setWarning(warnings.join("\n"));
    router.refresh();
  }

  async function runEnrichmentRequest(mode: EnrichmentMode) {
    const endpoint = mode === "ai" ? "/api/admin/enrich/ai" : "/api/admin/enrich/itwewina";
    const startResponse = await fetch(endpoint, { method: "POST" });

    if (!startResponse.ok) {
      const payload = (await startResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Enrichment failed.");
    }

    const payload = (await startResponse.json().catch(() => null)) as
      | {
          run?: PersistedEnrichmentRun;
          started?: boolean;
          notice?: string;
          error?: string;
        }
      | null;

    if (!payload?.run) {
      throw new Error(payload?.error ?? "Enrichment failed.");
    }

    syncEnrichmentRun(payload.run);

    if (payload.notice) {
      setEnrichmentWarning([payload.run.warnings.join("\n"), payload.notice].filter(Boolean).join("\n"));
    }
  }

  async function handleImport() {
    setError("");
    setMessage("");
    setWarning("");
    setProgress(
      isItwewinaMode
        ? {
            stage: "starting",
            completed: 0,
            total: 0,
            status: "Preparing itwewina import.",
            unitLabel: "search terms"
          }
        : null
    );
    setIsRunning(true);

    try {
      if (isItwewinaMode) {
        await runItwewinaImport();
      } else {
        await runStandardImport();
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleEnrichment(mode: EnrichmentMode) {
    setEnrichmentError("");
    setEnrichmentMessage("");
    setEnrichmentWarning("");
    setActiveEnrichment(mode);
    setEnrichmentProgress({
      stage: "starting",
      completed: 0,
      total: 0,
      status: mode === "ai" ? "Preparing AI enrichment." : "Preparing Itwewina page enrichment.",
      unitLabel: mode === "ai" ? "AI batches" : "imported records"
    });
    setIsEnrichmentRunning(true);

    try {
      await runEnrichmentRequest(mode);
    } catch (enrichmentRunError) {
      setEnrichmentError(enrichmentRunError instanceof Error ? enrichmentRunError.message : "Enrichment failed.");
      setIsEnrichmentRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="surface-card p-5">
        <p className="section-label">Import mode</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["json", "csv", "itwewina"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMode(option);
                setError("");
                setMessage("");
                setWarning("");
                setProgress(null);
                setText(
                  option === "json" ? IMPORT_JSON_EXAMPLE : option === "itwewina" ? IMPORT_ITWEWINA_EXAMPLE : ""
                );
              }}
              className={mode === option ? "tap-button-primary" : "tap-button-secondary"}
            >
              {option === "itwewina" ? "ITWEWINA" : option.toUpperCase()}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="section-label">{isItwewinaMode ? "Search terms" : "Paste or load data"}</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="app-input mt-2 min-h-72 font-mono text-xs leading-6"
          />
        </label>

        {isItwewinaMode ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add one Cree or English search term per line. The server will fetch
            <code> https://itwewina.altlab.app/search?q=...</code>, parse the live search results, and save the matched
            entries to the local catalog. Full-page Itwêwina enrichment and AI enrichment now run separately from the
            Enrichment section below so imports finish faster and avoid timing out.
          </p>
        ) : null}

        {isItwewinaMode && progress ? (
          <div className="surface-muted mt-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-label">Import progress</p>
                <p className="mt-2 text-lg text-slate-900">{progress.status}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {progress.term ? `Current word: ${progress.term}` : "Current step: background processing"}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-semibold text-slate-900">{progressPercent}%</p>
                <p className="text-sm text-slate-500">
                  {progress.total > 0
                    ? `${progress.completed} of ${progress.total} ${progress.unitLabel ?? "items"} processed`
                    : "Waiting to start"}
                </p>
              </div>
            </div>

            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
              aria-label="Itwewina import progress"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progressPercent}
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-moss-700 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <label className="tap-button-secondary mt-3 inline-flex cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          Load file
          <input
            type="file"
            className="hidden"
            accept={
              mode === "json"
                ? ".json,application/json"
                : mode === "csv"
                  ? ".csv,text/csv"
                  : ".txt,text/plain"
            }
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              file
                .text()
                .then((value) => {
                  setError("");
                  setText(value);
                })
                .catch(() => {
                  setError("Unable to read the selected file. Save it as UTF-8 text or paste the contents manually.");
                });
            }}
          />
        </label>

        {message ? <p className="mt-3 whitespace-pre-line text-sm text-moss-700">{message}</p> : null}
        {warning ? <p className="mt-3 whitespace-pre-line text-sm text-amber-700">{warning}</p> : null}
        {error ? <p className="mt-3 whitespace-pre-line text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          className="tap-button-primary mt-4"
          disabled={isRunning || isEnrichmentRunning}
          onClick={() => void handleImport()}
        >
          {isRunning ? "Importing..." : "Run import"}
        </button>
      </section>

      <section className="surface-card p-5">
        <p className="section-label">Enrichment</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Run enrichment after an import. <code>AI</code> adds explanations, categories, and relations across the local
          catalog. <code>Itwêwina pages</code> revisits imported Itwêwina-backed records to pull paradigms, related
          references, and audio. These runs now continue on the server even if this tab disconnects, and the panel will
          reload the latest status when you open it again.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="tap-button-secondary"
            disabled={isRunning || isEnrichmentRunning}
            onClick={() => void handleEnrichment("ai")}
          >
            {isEnrichmentRunning && activeEnrichment === "ai" ? "Running AI..." : "Run AI enrichment"}
          </button>
          <button
            type="button"
            className="tap-button-secondary"
            disabled={isRunning || isEnrichmentRunning}
            onClick={() => void handleEnrichment("itwewina")}
          >
            {isEnrichmentRunning && activeEnrichment === "itwewina"
              ? "Enriching Itwewina pages..."
              : "Run Itwewina page enrichment"}
          </button>
        </div>

        {enrichmentProgress ? (
          <div className="surface-muted mt-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="section-label">Enrichment progress</p>
                <p className="mt-2 text-lg text-slate-900">{enrichmentProgress.status}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {enrichmentProgress.term ? `Current word: ${enrichmentProgress.term}` : "Current step: background processing"}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-semibold text-slate-900">{enrichmentProgressPercent}%</p>
                <p className="text-sm text-slate-500">
                  {enrichmentProgress.total > 0
                    ? `${enrichmentProgress.completed} of ${enrichmentProgress.total} ${
                        enrichmentProgress.unitLabel ?? "items"
                      } processed`
                    : "Waiting to start"}
                </p>
              </div>
            </div>

            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
              aria-label="Enrichment progress"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={enrichmentProgressPercent}
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-moss-700 transition-all duration-300"
                style={{ width: `${enrichmentProgressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        {enrichmentMessage ? <p className="mt-3 whitespace-pre-line text-sm text-moss-700">{enrichmentMessage}</p> : null}
        {enrichmentWarning ? <p className="mt-3 whitespace-pre-line text-sm text-amber-700">{enrichmentWarning}</p> : null}
        {enrichmentError ? <p className="mt-3 whitespace-pre-line text-sm text-red-600">{enrichmentError}</p> : null}
      </section>

      <section className="surface-card p-5">
        <p className="section-label">CSV expectations</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Nested fields such as <code>meanings</code>, <code>morphologyTables</code>, and <code>relations</code> can
          be JSON arrays inside CSV cells. Categories can be provided with <code>categorySlugs</code> as a pipe-separated
          list or JSON array.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {IMPORT_CSV_COLUMNS.map((column) => (
            <span key={column} className="chip">
              {column}
            </span>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <p className="section-label">Itwewina import notes</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The initial Itwewina import keeps only what the live search results expose: the Cree lemma, syllabics, first
          gloss, part of speech, linguistic breakdown, stem, source URL, and import notes. Use the Enrichment section
          afterward if you want AI-generated explanations or full-page Itwêwina paradigms, related references, and
          audio.
        </p>
      </section>
    </div>
  );
}
