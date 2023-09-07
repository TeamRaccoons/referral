import {
  referralAccountPartnerFilter,
  referralAccountProjectFilter,
  ReferralProvider,
} from "@jup-ag/referral-sdk";
import { PublicKey } from "@solana/web3.js";

import { JUPITER_PROJECT } from "./constants";
import { nonNullable } from "./utils";

export const getReferralAccounts = async (
  provider: ReferralProvider,
  wallet: PublicKey,
) => {
  return provider.getReferralAccounts([
    referralAccountProjectFilter(JUPITER_PROJECT),
    referralAccountPartnerFilter(wallet),
  ]);
};

interface CreateReferralTokenAccountsParams {
  wallet: PublicKey;
  tokenMints: PublicKey[];
  referralPubkey: PublicKey;
  referralProvider: ReferralProvider;
}
export const createReferralTokenAccounts = async ({
  tokenMints,
  referralProvider,
  referralPubkey,
  wallet,
}: CreateReferralTokenAccountsParams) => {
  let referralTokenAccounts = await Promise.all(
    tokenMints
      .map((token) => {
        return referralProvider.initializeReferralTokenAccount({
          mint: new PublicKey(token),
          payerPubKey: wallet,
          referralAccountPubKey: referralPubkey,
        });
      })
      .filter(nonNullable),
  );

  let instructions = referralTokenAccounts.flatMap(({ tx }) => {
    return tx.instructions;
  });

  let tx = referralTokenAccounts[0].tx;
  tx.instructions = instructions;

  return tx;
};
