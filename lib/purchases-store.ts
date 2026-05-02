import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface PurchaseRecord {
  email: string;
  checkoutSessionId: string;
  purchasedAt: string;
  provider: "stripe";
}

interface PurchasePayload {
  purchases: PurchaseRecord[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "purchases.json");

async function ensureStore(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(STORE_PATH, "utf-8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify({ purchases: [] } satisfies PurchasePayload, null, 2), "utf-8");
  }
}

async function readStore(): Promise<PurchasePayload> {
  await ensureStore();
  const raw = await readFile(STORE_PATH, "utf-8");
  return JSON.parse(raw) as PurchasePayload;
}

async function writeStore(payload: PurchasePayload): Promise<void> {
  await ensureStore();
  await writeFile(STORE_PATH, JSON.stringify(payload, null, 2), "utf-8");
}

export async function addPurchase(record: PurchaseRecord): Promise<void> {
  const payload = await readStore();
  const existing = payload.purchases.find((entry) => entry.checkoutSessionId === record.checkoutSessionId);
  if (existing) {
    return;
  }

  payload.purchases.push(record);
  await writeStore(payload);
}

export async function hasPaidEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const payload = await readStore();
  return payload.purchases.some((entry) => entry.email.toLowerCase() === normalized);
}
