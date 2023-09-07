import { useCallback } from "react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

import { useToast } from "@/components/ui/use-toast";
import { useConnection, useWallet } from "@/components/wallet-provider";

export const useSendTransaction = () => {
  const { connection } = useConnection();
  const { wallet } = useWallet();
  const { toast } = useToast();

  const sendTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction) => {
      if (!wallet || !wallet.adapter) {
        toast({
          title: "Wallet not connected",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Requesting transaction signature...",
        description: "Please review transaction to approve.",
      });

      try {
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        let txid = await wallet.adapter.sendTransaction(
          transaction,
          connection,
          {
            skipPreflight: true,
          },
        );

        toast({
          title: "Awaiting Transaction to be confirmed...",
        });

        const { value } = await connection.confirmTransaction({
          signature: txid,
          blockhash,
          lastValidBlockHeight,
        });

        if (value.err) {
          console.log({ value, txid });
          throw new Error("Transaction Failed");
        }

        toast({
          title: "Transaction Success",
        });
      } catch (e) {
        toast({
          title: "Transaction Failed",
        });
        throw e;
      }
    },
    [wallet, connection, toast],
  );

  return sendTransaction;
};
