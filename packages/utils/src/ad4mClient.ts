import { getAd4mClient } from "@coasys/ad4m-connect";
import type { Ad4mClient } from "@coasys/ad4m";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Waits until the AD4M client is fully usable (agent, perspectives, runtime)
export async function getAd4mClientReady(options?: {
  maxRetries?: number;
  delayMs?: number;
}): Promise<Ad4mClient> {
  const maxRetries = options?.maxRetries ?? 50;
  const delayMs = options?.delayMs ?? 200;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = (await getAd4mClient()) as Ad4mClient;

      // Probe basic readiness of subsystems; any failure means not ready yet
      await Promise.all([
        client.agent.me(),
        client.perspective.all(),
        client.runtime.info(),
      ]);

      return client;
    } catch (e) {
      lastError = e;
      await sleep(delayMs);
    }
  }

  // One last attempt; if this throws, propagate the real error
  const client = (await getAd4mClient()) as Ad4mClient;
  await Promise.all([client.agent.me(), client.perspective.all(), client.runtime.info()]);
  return client;
}



