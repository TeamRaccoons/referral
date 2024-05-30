import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const connection = new Connection(process.env.RPC_URL || "");
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
const provider = new ReferralProvider(connection);

(async () => {
  // This method will returns a list of transactions for all claims batched by 5 claims for each transaction.
  const txs = await provider.claimPartially({
    withdrawalableTokenAddress: [], // Enter your withdrawalable token address here.
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

    const txid = await connection.sendTransaction(tx);
    const { value } = await connection.confirmTransaction({
      signature: txid,
      blockhash,
      lastValidBlockHeight,
    });

    if (value.err) {
      console.log({ value, txid });
    } else {
      console.log({ txid });
    }
  }
})();
