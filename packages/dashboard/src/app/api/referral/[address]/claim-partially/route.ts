import { NextResponse } from "next/server";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { RPC_URL } from "@/lib/constants";

export const runtime = "edge";

const bodyShape = z.object({
  referralAccount: z.string(),
  feePayer: z.string(),
});

export async function POST(
  request: Request,
  {
    params: { address, withdrawalableTokenAddress },
  }: { params: { address: string; withdrawalableTokenAddress: PublicKey[] } },
) {
  try {
    const connection = new Connection(RPC_URL);
    const referralProvider = new ReferralProvider(connection);

    const body = await request.json();

    const { referralAccount, feePayer } = bodyShape.parse({
      ...body,
      referralAccount: address,
    });

    let feePayerPubkey = new PublicKey(feePayer);
    const txsCompiled = await referralProvider.claimPartially({
      payerPubKey: feePayerPubkey,
      withdrawalableTokenAddress,
      referralAccountPubKey: new PublicKey(referralAccount),
    });

    const txs = txsCompiled.map((tx) =>
      Buffer.from(tx.serialize()).toString("base64"),
    );

    return NextResponse.json({
      txs: txs,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
