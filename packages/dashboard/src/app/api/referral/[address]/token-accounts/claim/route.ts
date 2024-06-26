import { NextResponse } from "next/server";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { RPC_URL } from "@/lib/constants";

export const runtime = "edge";

const bodyShape = z.object({
  referralAccount: z.string(),
  mint: z.string(),
  feePayer: z.string(),
});

export async function POST(
  request: Request,
  { params: { address } }: { params: { address: string } },
) {
  try {
    const connection = new Connection(RPC_URL);
    const referralProvider = new ReferralProvider(connection);

    const body = await request.json();

    const { referralAccount, feePayer, mint } = bodyShape.parse({
      ...body,
      referralAccount: address,
    });

    let feePayerPubkey = new PublicKey(feePayer);
    const [tx, { blockhash }] = await Promise.all([
      referralProvider.claim({
        mint: new PublicKey(mint),
        payerPubKey: feePayerPubkey,
        referralAccountPubKey: new PublicKey(referralAccount),
      }),
      connection.getLatestBlockhash({
        commitment: "confirmed",
      }),
    ]);

    return NextResponse.json({
      tx: Buffer.from(tx.serialize()).toString("base64"),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
