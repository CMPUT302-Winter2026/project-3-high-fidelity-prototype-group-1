import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { saveWord } from "@/lib/word-service";
import { wordFormSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const payload = wordFormSchema.parse(await request.json());
    const word = await saveWord(payload);

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/admin");
    revalidatePath("/admin/words");
    revalidatePath(`/word/${word.slug}`);

    return NextResponse.json({ word });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid word payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create word." }, { status: 500 });
  }
}
