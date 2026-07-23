"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";

function safeRedirectTarget(from: FormDataEntryValue | null): string {
  const value = typeof from === "string" ? from : "";
  // Only ever redirect back into our own app, never to an external URL.
  return value.startsWith("/") ? value : "/dashboard";
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectTarget(formData.get("from"));

  if (!verifyPassword(password)) {
    redirect(`/login?error=1&from=${encodeURIComponent(redirectTo)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  redirect(redirectTo);
}
