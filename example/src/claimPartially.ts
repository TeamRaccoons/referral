import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const connection = new Connection(process.env.RPC_URL || "");
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
const provider = new ReferralProvider(connection);
const referralPubKey = new PublicKey(process.env.RERERRAL_PUBKEY || ""); // Referral Key. You can create this with createReferralAccount.ts.

(async () => {
  // This method will return an array of withdrawable token addresses.
  const referralTokens = await provider.getReferralTokenAccountsWithStrategy(
    referralPubKey.toString(),
    { type: "token-list" },
  );

  const withdrawalableTokenAddress = [
    ...(referralTokens.tokenAccounts || []),
    ...(referralTokens.token2022Accounts || []),
  ].map((a) => a.pubkey);

  // You can do a chunk / slice of x withdrawalableTokenAddress to claim partially to prevent a RPC timeout
  const tenWithdrawableTokenAddress = withdrawalableTokenAddress.slice(1, 10);

  // This method will returns a list of transactions for all claims batched by 5 claims for each transaction.
  const txs = await provider.claimPartially({
    withdrawalableTokenAddress: tenWithdrawableTokenAddress, // Enter your withdrawalable token address here.
    payerPubKey: keypair.publicKey,
    referralAccountPubKey: new PublicKey(referralPubKey),
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
