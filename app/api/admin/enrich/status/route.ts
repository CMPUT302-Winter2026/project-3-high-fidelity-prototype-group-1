import { type NextRequest } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { getLatestEnrichmentRun } from "@/lib/enrichment-runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  const run = await getLatestEnrichmentRun();

  return Response.json(
    { run },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
