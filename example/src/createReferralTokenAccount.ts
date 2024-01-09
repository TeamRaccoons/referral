import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const connection = new Connection(process.env.RPC_URL || "");
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
const provider = new ReferralProvider(connection);

(async () => {
  const mint = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
  const { tx, referralTokenAccountPubKey } =
    await provider.initializeReferralTokenAccount({
      payerPubKey: keypair.publicKey,
      referralAccountPubKey: new PublicKey(
        "7RCSsJhd5Q5yAJbS9z4EucmJXisKLufokWxkTKnPtz2a",
      ), // Referral Key. You can create this with createReferralAccount.ts.
      mint,
    });

  const referralTokenAccount = await connection.getAccountInfo(
    referralTokenAccountPubKey,
  );

  if (!referralTokenAccount) {
    const txId = await sendAndConfirmTransaction(connection, tx, [keypair]);
    console.log({
      txId,
      referralTokenAccountPubKey: referralTokenAccountPubKey.toBase58(),
    });
  } else {
    console.log(
      `referralTokenAccount ${referralTokenAccountPubKey.toBase58()} for mint ${mint.toBase58()} already exists`,
    );
  }
})();
