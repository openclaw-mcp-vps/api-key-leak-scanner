import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paidAccessCookie } from "@/lib/paywall";
import { hasPaidEmail } from "@/lib/purchases-store";

function appBaseUrl(request: Request): URL {
  const configured = process.env.NEXTAUTH_URL;
  if (configured) {
    return new URL(configured);
  }
  return new URL(request.url);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const baseUrl = appBaseUrl(request);

  if (!email) {
    return NextResponse.redirect(new URL("/?error=signin_required", baseUrl));
  }

  const paid = await hasPaidEmail(email);
  if (!paid) {
    return NextResponse.redirect(new URL("/dashboard?unlock=missing_purchase", baseUrl));
  }

  const response = NextResponse.redirect(new URL("/dashboard?unlock=success", baseUrl));
  response.cookies.set(paidAccessCookie(email));
  return response;
}
