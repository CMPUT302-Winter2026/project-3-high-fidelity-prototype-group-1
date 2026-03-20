import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { enrichVocabularyCatalogWithAI } from "@/lib/ai";
import type { ItwewinaImportProgressEvent } from "@/lib/itwewina";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

type AiEnrichmentStreamEvent =
  | ({ type: "progress" } & ItwewinaImportProgressEvent)
  | {
      type: "result";
      summary: Awaited<ReturnType<typeof enrichVocabularyCatalogWithAI>>;
      warnings?: string[];
    }
  | {
      type: "error";
      error: string;
    };

function encodeStreamEvent(encoder: TextEncoder, event: AiEnrichmentStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AiEnrichmentStreamEvent) => {
        controller.enqueue(encodeStreamEvent(encoder, event));
      };

      try {
        send({
          type: "progress",
          stage: "starting",
          completed: 0,
          total: 0,
          status: "Preparing AI enrichment.",
          unitLabel: "AI batches"
        });

        const warnings: string[] = [];
        const summary = await enrichVocabularyCatalogWithAI({
          onProgress(event) {
            send({
              type: "progress",
              stage: "finalizing",
              completed: event.completed,
              total: event.total,
              status: event.status,
              unitLabel: "AI batches"
            });
          }
        });

        if (summary.warning) {
          warnings.push(summary.warning);
        }

        revalidatePath("/");
        revalidatePath("/search");
        revalidatePath("/admin");
        revalidatePath("/admin/words");

        send({
          type: "result",
          summary,
          warnings: warnings.length > 0 ? warnings : undefined
        });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Unable to run AI enrichment."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no"
    }
  });
}
