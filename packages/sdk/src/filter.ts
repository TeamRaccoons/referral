import { GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

export const projectAdminFilter = (publicKey: PublicKey) => {
  return {
    memcmp: {
      offset: 8 + 32,
      bytes: publicKey.toBase58(),
    },
  };
};

export const referralAccountPartnerFilter = (
  publicKey: PublicKey,
): GetProgramAccountsFilter => {
  return {
    memcmp: {
      offset: 8,
      bytes: publicKey.toBase58(),
    },
  };
};

export const referralAccountProjectFilter = (
  publicKey: PublicKey,
): GetProgramAccountsFilter => {
  return {
    memcmp: {
      offset: 8 + 32,
      bytes: publicKey.toBase58(),
    },
  };
};
