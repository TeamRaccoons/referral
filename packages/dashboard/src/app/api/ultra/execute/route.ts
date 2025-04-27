import { NextResponse } from "next/server";

export const runtime = "edge";
const ULTRA_EXECUTE_URL = "https://lite-api.jup.ag/ultra/v1/execute";

export async function POST(req: Request) {
  try {
    // 🔍 Read and log the raw body
    const rawBody = await req.text();
    console.log("🔥 /ultra/execute raw body:", rawBody);

    // Now parse it exactly once
    let body: { signedTransaction?: string; requestId?: string };
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("📦 JSON parse error:", parseErr);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { signedTransaction, requestId } = body;
    if (!signedTransaction || !requestId) {
      console.error("📋 Missing fields:", body);
      return NextResponse.json(
        { error: "signedTransaction and requestId required" },
        { status: 400 },
      );
    }

    // Forward to Ultra’s execute endpoint
    const res = await fetch(ULTRA_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedTransaction, requestId }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("🚨 Ultra error:", data);
      return NextResponse.json({ error: data }, { status: res.status });
    }

    console.log("✅ Ultra execute response:", data);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ /ultra/execute unexpected error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
