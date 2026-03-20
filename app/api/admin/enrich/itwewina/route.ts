import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import {
  enrichImportedWordsWithItwewinaPages,
  type ItwewinaImportProgressEvent
} from "@/lib/itwewina";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

type ItwewinaPageEnrichmentStreamEvent =
  | ({ type: "progress" } & ItwewinaImportProgressEvent)
  | {
      type: "result";
      processedCount: number;
      warnings?: string[];
    }
  | {
      type: "error";
      error: string;
    };

function encodeStreamEvent(encoder: TextEncoder, event: ItwewinaPageEnrichmentStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ItwewinaPageEnrichmentStreamEvent) => {
        controller.enqueue(encodeStreamEvent(encoder, event));
      };

      try {
        const result = await enrichImportedWordsWithItwewinaPages({
          onProgress(event) {
            send({
              type: "progress",
              ...event
            });
          }
        });

        revalidatePath("/");
        revalidatePath("/search");
        revalidatePath("/admin");
        revalidatePath("/admin/words");

        send({
          type: "result",
          processedCount: result.processedCount,
          warnings: result.warnings.length > 0 ? result.warnings : undefined
        });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Unable to enrich imported Itwewina records."
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
