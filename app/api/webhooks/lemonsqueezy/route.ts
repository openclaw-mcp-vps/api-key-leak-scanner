import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { addPurchase } from "@/lib/purchases-store";

interface StripeEvent<T = unknown> {
  type: string;
  data: {
    object: T;
  };
}

interface CheckoutSession {
  id: string;
  customer_details?: {
    email?: string | null;
  };
  customer_email?: string | null;
}

function parseStripeSignature(value: string): { timestamp: string; v1: string } | null {
  const parts = value.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const v1 = parts.find((part) => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1) {
    return null;
  }
  return { timestamp, v1 };
}

function verifyStripeWebhookSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(parsed.v1, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  const isValid = verifyStripeWebhookSignature(payload, signature, webhookSecret);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: StripeEvent<CheckoutSession>;
  try {
    event = JSON.parse(payload) as StripeEvent<CheckoutSession>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email ?? session.customer_email;

    if (email && session.id) {
      await addPurchase({
        email,
        checkoutSessionId: session.id,
        purchasedAt: new Date().toISOString(),
        provider: "stripe"
      });
    }
  }

  return NextResponse.json({ received: true });
}
