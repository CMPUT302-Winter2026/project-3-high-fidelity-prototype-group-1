import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { categorySchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const payload = categorySchema.parse(await request.json());
    const slug = payload.slug?.trim() ? slugify(payload.slug) : slugify(payload.name);

    const category = await prisma.category.create({
      data: {
        name: payload.name.trim(),
        slug,
        description: payload.description?.trim() || undefined,
        colorToken: payload.colorToken?.trim() || undefined
      }
    });

    revalidatePath("/");
    revalidatePath("/admin");

    return NextResponse.json({
      category: {
        ...category,
        _count: {
          words: 0
        }
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid category payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create category." }, { status: 500 });
  }
}
