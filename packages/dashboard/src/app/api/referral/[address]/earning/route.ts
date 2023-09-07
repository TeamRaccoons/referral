import { NextResponse } from "next/server";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection } from "@solana/web3.js";

import { RPC_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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

  const addresses = [
    ...tokenAccounts.token2022Accounts,
    ...tokenAccounts.tokenAccounts,
  ].map(({ pubkey }) => pubkey.toString());

  const result = await prisma.transaction.aggregate({
    where: {
      tokenAccount: {
        in: addresses,
      },
    },
    _sum: {
      usdAmount: true,
    },
  });

  return NextResponse.json({ totalUsdEarning: result._sum.usdAmount || 0 });
}
