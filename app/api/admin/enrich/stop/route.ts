import { type NextRequest } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { stopActiveEnrichmentRun } from "@/lib/enrichment-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const payload = await stopActiveEnrichmentRun();

  return Response.json(payload, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
