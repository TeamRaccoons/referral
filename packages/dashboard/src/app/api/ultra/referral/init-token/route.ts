import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is disabled. Please initialize referral token accounts client-side using the ReferralProvider SDK.",
    },
    { status: 403 },
  );
}
