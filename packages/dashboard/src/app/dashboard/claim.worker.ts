import { ReferralProvider } from "@jup-ag/referral-sdk";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

addEventListener(
  "message",
  async (
    message: MessageEvent<{
      rpc: string;
      payerPubKey: PublicKey;
      referralAccountPubKey: PublicKey;
    }>,
  ) => {
    const referralProvider = new ReferralProvider(
      new Connection(message.data.rpc),
    );

    const txsCompiled: VersionedTransaction[] = await referralProvider.claimAll(
      {
        payerPubKey: new PublicKey(message.data.payerPubKey),
        referralAccountPubKey: new PublicKey(
          message.data.referralAccountPubKey,
        ),
      },
    );
    postMessage(txsCompiled.map((tx) => tx.serialize()));
  },
);
