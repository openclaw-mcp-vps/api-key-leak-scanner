import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let initialized = false;

export function ensureLemonSqueezyInitialized(): void {
  if (initialized) {
    return;
  }

  if (!process.env.LEMONSQUEEZY_API_KEY) {
    return;
  }

  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    onError: (error) => {
      console.error("Lemon Squeezy SDK error", error);
    }
  });
  initialized = true;
}
