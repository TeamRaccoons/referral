import { NextResponse } from "next/server";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection } from "@solana/web3.js";

import { RPC_URL } from "@/lib/constants";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params: { address } }: { params: { address: string } },
) {
  const connection = new Connection(RPC_URL);
  const referralProvider = new ReferralProvider(connection);

  const tokenAccounts = await referralProvider.getReferralTokenAccounts(
    address,
  );

  return NextResponse.json(
    [...tokenAccounts.token2022Accounts, ...tokenAccounts.tokenAccounts].map(
      ({ pubkey, account }) => ({
        pubkey: pubkey.toString(),
        mint: account.mint.toString(),
      }),
    ),
  );
}
