import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { bulkUpdateWordsForCategory } from "@/lib/word-service";
import { themeWordBulkEditRequestSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const payload = themeWordBulkEditRequestSchema.parse(await request.json());
    const result = await bulkUpdateWordsForCategory(payload.categoryId, payload.words);

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/admin");
    revalidatePath("/admin/words");

    if (result.categorySlug) {
      revalidatePath(`/category/${result.categorySlug}`);
    }

    for (const slug of result.wordSlugs) {
      revalidatePath(`/word/${slug}`);
    }

    return NextResponse.json({
      ok: true,
      updated: payload.words.length
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid bulk update payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to bulk update words." }, { status: 500 });
  }
}
