import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { getSignature } from "./utils/getSignature";
import { transactionSenderAndConfirmationWaiter } from "./utils/transactionSender";

const connection = new Connection(process.env.RPC_URL || "");
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
const provider = new ReferralProvider(connection);

(async () => {
  // This method will returns a list of transactions for all claims batched by 5 claims for each transaction.
  const txs = await provider.claimAll({
    payerPubKey: keypair.publicKey,
    referralAccountPubKey: new PublicKey(
      "7RCSsJhd5Q5yAJbS9z4EucmJXisKLufokWxkTKnPtz2a",
    ), // Referral Key. You can create this with createReferralAccount.ts.
  });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  // Send each claim transaction one by one.
  for (const tx of txs) {
    tx.sign([keypair]);
    const signature = getSignature(tx);

    // We first simulate whether the transaction would be successful
    const { value: simulatedTransactionResponse } =
      await connection.simulateTransaction(tx, {
        replaceRecentBlockhash: true,
        commitment: "processed",
      });
    const { err, logs } = simulatedTransactionResponse;

    if (err) {
      // Simulation error, we can check the logs for more details
      // If you are getting an invalid account error, make sure that you have the input mint account to actually swap from.
      console.error("Simulation Error:");
      console.error({ err, logs });
      continue;
    }

    const serializedTransaction = Buffer.from(tx.serialize());
    const transactionResponse = await transactionSenderAndConfirmationWaiter({
      connection,
      serializedTransaction,
      blockhashWithExpiryBlockHeight: {
        blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
      },
    });

    // If we are not getting a response back, the transaction has not confirmed.
    if (!transactionResponse) {
      console.error("Transaction not confirmed");
      continue;
    }

    if (transactionResponse.meta?.err) {
      console.error(transactionResponse.meta?.err);
    }

    console.log(`https://solscan.io/tx/${signature}`);
  }
})();
