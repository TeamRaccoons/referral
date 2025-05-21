import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const RPC_URL =
  process.env.RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  clusterApiUrl("mainnet-beta");

export const JUPITER_PROJECT = new PublicKey(
  "45ruCyfdRkWpRNGEqWzjCiXRHkZs8WXCLQ67Pnpye7Hp",
);

export const JUPITER_PROJECT_ULTRA = new PublicKey(
  "DkiqsTrw1u1bYFumumC7sCG2S8K25qc2vemJFHyW2wJc",
);
