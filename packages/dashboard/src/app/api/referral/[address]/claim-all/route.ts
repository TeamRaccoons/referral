import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is disabled. Please contact us on discord for assistance.",
    },
    {
      status: 403,
    },
  );
}
