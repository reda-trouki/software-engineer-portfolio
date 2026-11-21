import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

export async function GET() {
  const steps: string[] = [];
  try {
    steps.push(`NETLIFY=${process.env.NETLIFY ?? "unset"}`);
    const store = getStore({
      name: "portfolio",
      siteID: process.env.BLOBS_SITE_ID!,
      token: process.env.BLOBS_TOKEN!,
    });
    steps.push("getStore ok");
    const v = await Promise.race([
      store.get("profile", { type: "json" }),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("blobs timeout 5s")), 5000),
      ),
    ]);
    steps.push(v ? "profile found" : "profile is null (store empty)");
    return Response.json({ ok: true, steps });
  } catch (e: any) {
    return Response.json(
      { ok: false, steps, error: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
