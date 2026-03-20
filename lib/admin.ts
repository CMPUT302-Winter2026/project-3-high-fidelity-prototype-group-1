import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "altlab_admin_access";

export function isAdminProtected() {
  return Boolean(process.env.ADMIN_ACCESS_CODE?.trim());
}

export async function hasAdminAccess() {
  if (!isAdminProtected()) {
    return true;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === process.env.ADMIN_ACCESS_CODE;
}

export function hasAdminAccessFromRequest(request: NextRequest) {
  if (!isAdminProtected()) {
    return true;
  }

  return request.cookies.get(ADMIN_COOKIE_NAME)?.value === process.env.ADMIN_ACCESS_CODE;
}

export function unauthorizedAdminResponse() {
  return NextResponse.json(
    {
      error: "Admin access is locked. Set the correct access code to continue."
    },
    { status: 403 }
  );
}
