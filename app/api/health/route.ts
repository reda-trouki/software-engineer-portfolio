// app/api/health/route.ts  (temporary, delete afterwards)
import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

const timeout = (ms: number) =>
  new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms),
  );

async function step(
  name: string,
  fn: () => Promise<unknown>,
  out: Record<string, unknown>,
) {
  const t = Date.now();
  try {
    const result = await Promise.race([fn(), timeout(15000)]);
    out[name] = { ok: true, ms: Date.now() - t, result };
  } catch (e: any) {
    out[name] = { ok: false, ms: Date.now() - t, error: e.message };
  }
}

export async function GET() {
  const out: Record<string, unknown> = { version: "health-v7" };
  const store = getStore({
    name: "portfolio",
    consistency: "strong",
    siteID: "c935cc7-a09b-4371-ba6d-ce1d309f2e35",
    token: process.env.BLOBS_TOKEN?.trim(),
  });

  await step(
    "list",
    async () => (await store.list({ prefix: "db" })).blobs.map((b) => b.key),
    out,
  );
  await step(
    "setJSON_plain",
    async () => (await store.setJSON("t1", { a: 1 })).modified,
    out,
  );
  await step(
    "getWithMetadata",
    async () => (await store.getWithMetadata("t1", { type: "json" }))?.etag,
    out,
  );
  await step(
    "setJSON_onlyIfNew",
    async () =>
      (await store.setJSON("t2-" + Date.now(), { a: 1 }, { onlyIfNew: true }))
        .modified,
    out,
  );
  await step(
    "setJSON_onlyIfMatch",
    async () => {
      const cur = await store.getWithMetadata("t1", { type: "json" });
      return (await store.setJSON("t1", { a: 2 }, { onlyIfMatch: cur!.etag }))
        .modified;
    },
    out,
  );

  return Response.json(out);
}
