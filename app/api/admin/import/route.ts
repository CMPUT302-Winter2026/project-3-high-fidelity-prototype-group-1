import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { importWords, parseImportInput } from "@/lib/importers";

const importRequestSchema = z.object({
  mode: z.enum(["json", "csv"]),
  text: z.string().min(1, "Import text is required.")
});

export async function POST(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const payload = importRequestSchema.parse(await request.json());
    const parsed = parseImportInput(payload.mode, payload.text);
    const result = await importWords(parsed);

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/admin");
    revalidatePath("/admin/words");

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid import payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to complete import." }, { status: 500 });
  }
}
