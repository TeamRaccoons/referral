import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";

// import { ReferralProvider } from "@jup-ag/referral-sdk";
import { ReferralProvider } from "../../packages/sdk/src/referral";

const connection = new Connection(process.env.RPC_URL || "");
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
const provider = new ReferralProvider(connection);

(async () => {
  // This method will returns a list of transactions for all claims batched by 5 claims for each transaction.
  console.log("starting");

  const txs = await provider.claimAllV2({
    payerPubKey: keypair.publicKey,
    referralAccountPubKey: new PublicKey(
      "bpGGztAsBsbwhi7rShWQ1qnrWqjUHhzrN4smxErbZPA",
    ), // Referral Key. You can create this with createReferralAccount.ts.
  });
  console.log({ txs });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  // Send each claim transaction one by one.
  for (const tx of txs) {
    console.log("sending a claim tx");

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
