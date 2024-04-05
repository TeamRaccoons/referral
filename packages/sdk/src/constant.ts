import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3",
);

export const RPC_URL =
  process.env.RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  clusterApiUrl("mainnet-beta");
