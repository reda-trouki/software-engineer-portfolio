import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

const timeout = (ms: number) =>
  new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms));

async function step(name: string, fn: () => Promise<unknown>, out: Record<string, unknown>) {
  const t = Date.now();
  try {
    out[name] = { result: await Promise.race([fn(), timeout(20000)]), ms: Date.now() - t };
  } catch (e: any) {
    out[name] = { error: e.message, ms: Date.now() - t };
  }
}

export async function GET() {
  const out: Record<string, unknown> = { version: "health-v5", node: process.version };
  const store = getStore({
    name: "portfolio",
    siteID: "ac935cc7-a09b-4371-ba6d-ce1d309f2e35",
    token: (process.env.BLOBS_TOKEN ?? "").trim(),
  });

  await step("write", async () => { await store.setJSON("health-test", { ok: true }); return "written"; }, out);
  await step("read", () => store.get("health-test", { type: "json" }), out);
  await step("readMissing", () => store.get("does-not-exist", { type: "json" }), out);

  return Response.json(out);
}