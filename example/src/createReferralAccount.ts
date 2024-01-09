import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { JUPITER_PROJECT } from "./constant";

const connection = new Connection(process.env.RPC_URL || "");
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
const provider = new ReferralProvider(connection);
const referralAccountKeypair = Keypair.generate();

(async () => {
  const tx = await provider.initializeReferralAccount({
    payerPubKey: keypair.publicKey,
    partnerPubKey: keypair.publicKey,
    projectPubKey: JUPITER_PROJECT,
    referralAccountPubKey: referralAccountKeypair.publicKey,
  });

  const referralAccount = await connection.getAccountInfo(
    referralAccountKeypair.publicKey,
  );

  if (!referralAccount) {
    const txId = await sendAndConfirmTransaction(connection, tx, [
      keypair,
      referralAccountKeypair,
    ]);
    console.log({
      txId,
      referralAccountPubKey: referralAccountKeypair.publicKey.toBase58(),
    });
  } else {
    console.log(
      `referralAccount ${referralAccountKeypair.publicKey.toBase58()} already exists`,
    );
  }
})();
