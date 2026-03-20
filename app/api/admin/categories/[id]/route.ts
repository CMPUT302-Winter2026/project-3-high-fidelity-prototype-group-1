import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { hasAdminAccessFromRequest, unauthorizedAdminResponse } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { categorySchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const payload = categorySchema.parse(await request.json());
    const { id } = await params;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: payload.name.trim(),
        slug: payload.slug?.trim() ? slugify(payload.slug) : slugify(payload.name),
        description: payload.description?.trim() || undefined,
        colorToken: payload.colorToken?.trim() || undefined
      }
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/words");

    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid category payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to update category." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!hasAdminAccessFromRequest(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await params;
    await prisma.category.delete({
      where: { id }
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/words");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete category." }, { status: 500 });
  }
}
