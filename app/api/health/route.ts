import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

const timeout = (ms: number) =>
  new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms));

export async function GET() {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  const out: Record<string, unknown> = {
    version: "health-v3", // change this string each time so you know the new deploy is live
    node: process.version,
    hasSiteID: !!siteID,
    hasToken: !!token,
  };

  // Test 1: can the function reach Netlify's API at all?
  try {
    const r: any = await Promise.race([
      fetch("https://api.netlify.com/api/v1/sites/" + siteID, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      timeout(5000),
    ]);
    out.netlifyApi = r.status; // 200 = reachable and token works, 401 = bad token, 404 = wrong site ID
  } catch (e: any) {
    out.netlifyApi = "FAILED: " + e.message;
  }

  // Test 2: Blobs with explicit credentials
  try {
    const store = getStore({ name: "portfolio", siteID: siteID!, token: token! });
    const v = await Promise.race([store.get("profile", { type: "json" }), timeout(5000)]);
    out.blobs = v ? "data found" : "null (store empty, but Blobs works)";
  } catch (e: any) {
    out.blobs = "FAILED: " + e.message;
  }

  return Response.json(out);
}