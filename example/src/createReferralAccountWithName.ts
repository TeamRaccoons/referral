import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// import { ReferralProvider } from "@jup-ag/referral-sdk";
import { ReferralProvider } from "../../packages/sdk/src/referral";
import { JUPITER_PROJECT, ULTRA_PROJECT } from "./constant";

const connection = new Connection(process.env.RPC_URL || "");
const payer = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
// const partner = Keypair.generate();
// console.log(`PARTNER_PUBKEY=${partner.publicKey.toBase58()}`);
// console.log(`PARTNER_KEYPAIR=${bs58.encode(partner.secretKey)}`);
const provider = new ReferralProvider(connection);

// change
const PARTNER_PUBKEY: string = "9K1ChjxXbyQPR4154c8gMVZKyEtks7P3aLD8QG23jamk"; // Make this new wallet before hand
const REFERRAL_ACC_NAME: string = "dn_test";

(async () => {
  const { tx, referralAccountPubKey } =
    await provider.initializeReferralAccountWithName({
      payerPubKey: payer.publicKey,
      partnerPubKey: new PublicKey(PARTNER_PUBKEY),
      projectPubKey: ULTRA_PROJECT,
      name: REFERRAL_ACC_NAME,
    });

  const referralAccount = await connection.getAccountInfo(
    referralAccountPubKey,
  );

  if (!referralAccount) {
    const txId = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log({
      txId,
      referralAccountPubKey: referralAccountPubKey.toBase58(),
    });
  } else {
    console.log(
      `referralAccount ${referralAccountPubKey.toBase58()} already exists`,
    );
  }

  // shareBps is 80% by default. To change, contact anyhau.
  // requires admin to change.
})();
