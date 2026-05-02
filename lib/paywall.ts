import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ACCESS_COOKIE_NAME = "akls_paid";
const ACCESS_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

function signingSecret(): string {
  return process.env.NEXTAUTH_SECRET || "development-secret-change-me";
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createAccessToken(email: string): string {
  const payload = JSON.stringify({
    email,
    iat: Date.now(),
    exp: Date.now() + ACCESS_COOKIE_TTL_SECONDS * 1000
  });
  const encodedPayload = base64UrlEncode(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string): { valid: boolean; email?: string } {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payload, signature] = parts;
  const expected = sign(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false };
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as {
      email?: string;
      exp?: number;
    };

    if (!parsed.email || !parsed.exp || Date.now() > parsed.exp) {
      return { valid: false };
    }

    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false };
  }
}

export async function hasPaidAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return verifyAccessToken(token).valid;
}

export function paidAccessCookie(email: string): {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    name: ACCESS_COOKIE_NAME,
    value: createAccessToken(email),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_COOKIE_TTL_SECONDS
  };
}
