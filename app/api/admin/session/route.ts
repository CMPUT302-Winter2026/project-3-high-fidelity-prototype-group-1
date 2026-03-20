import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, isAdminProtected } from "@/lib/admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: string } | null;

  if (!isAdminProtected()) {
    return NextResponse.json({ ok: true, unlocked: true });
  }

  if (!body?.code || body.code !== process.env.ADMIN_ACCESS_CODE) {
    return NextResponse.json({ error: "Incorrect admin access code." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, process.env.ADMIN_ACCESS_CODE!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return NextResponse.json({ ok: true, unlocked: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
