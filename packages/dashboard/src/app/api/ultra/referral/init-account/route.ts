import { NextResponse } from "next/server";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

import { RPC_URL, ULTRA_PROJECT } from "@/lib/constants";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { name, partner } = await req.json();
    const partnerPubKey = new PublicKey(partner);

    const connection = new Connection(RPC_URL);
    const provider = new ReferralProvider(connection);

    const { tx, referralAccountPubKey } =
      await provider.initializeReferralAccountWithName({
        projectPubKey: ULTRA_PROJECT,
        partnerPubKey,
        payerPubKey: partnerPubKey,
        name,
      });

    // ← **ADD THIS BLOCK**
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = partnerPubKey;

    // AFTER
    const transaction = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return NextResponse.json({
      transaction,
      referralAccount: referralAccountPubKey.toBase58(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
