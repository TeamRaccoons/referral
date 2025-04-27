import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const inputMint = searchParams.get("inputMint");
    const outputMint = searchParams.get("outputMint");
    const amount = searchParams.get("amount");
    const taker = searchParams.get("taker");
    const referralAccount = searchParams.get("referralAccount");
    const referralFee = searchParams.get("referralFee");

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: inputMint, outputMint, or amount",
        },
        { status: 400 },
      );
    }

    // Build the Ultra Get Order URL
    const url = new URL("https://lite-api.jup.ag/ultra/v1/order");
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", amount);
    if (taker) url.searchParams.set("taker", taker);
    if (referralAccount)
      url.searchParams.set("referralAccount", referralAccount);
    if (referralFee) url.searchParams.set("referralFee", referralFee);

    const response = await fetch(url.toString());
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("ultra/order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
