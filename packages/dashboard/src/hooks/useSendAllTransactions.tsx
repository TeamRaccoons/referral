import { useCallback } from "react";
import {
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

import { useToast } from "@/components/ui/use-toast";
import { useConnection, useWallet } from "@/components/wallet-provider";
import { getSignature } from "@/lib/utils";

export const useSendAllTransactions = () => {
  const { connection } = useConnection();
  const { wallet, publicKey, signTransaction, signAllTransactions } =
    useWallet();
  const { toast } = useToast();

  const sendAllTransactions = useCallback(
    async (transactions: (Transaction | VersionedTransaction)[]) => {
      console.log({ wallet });
      if (!wallet || !publicKey || !wallet.adapter) {
        toast({
          title: "Wallet not connected",
          variant: "destructive",
        });
        return;
      }

      if (!signAllTransactions) {
        toast({
          title: "Wallet does not support signAllTransactions",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Requesting transaction signature...",
        description: "Please review transaction(s) to approve.",
      });

      try {
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");

        transactions.forEach((tx) => {
          if ("version" in tx) {
            tx.message.recentBlockhash = blockhash;
          } else {
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;
          }
        });

        let txs = await signAllTransactions(transactions);

        toast({
          title: `Awaiting transaction(s) to be confirmed...(0/${txs.length})`,
        });

        let txDoneCount = 0;
        let errorTxids: string[] = [];
        let successTxids: string[] = [];
        await Promise.all(
          txs.map(async (tx, index) => {
            let rawTx = Buffer.from(tx.serialize());
            let txid = getSignature(tx);

            await sendAndConfirmRawTransaction(
              connection,
              rawTx,
              {
                signature: txid,
                blockhash,
                lastValidBlockHeight,
              },
              {
                skipPreflight: true,
              },
            );

            txDoneCount++;
            toast({
              title: `Awaiting transaction(s) to be confirmed...(${txDoneCount}/${txs.length})`,
            });

            let value = await connection.getTransaction(txid, {
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0,
            });

            if (!value || value.meta?.err) {
              errorTxids.push(txid);
            } else {
              successTxids.push(txid);
            }
          }),
        );

        if (errorTxids.length > 0) {
          toast({
            title: "Transactions Success",
          });
        }
        // todo error states?

        return {
          successTxids,
          errorTxids,
        };
      } catch (e) {
        console.error({ err: e });
        throw e;
      }
    },
    [wallet, connection, toast, publicKey, signAllTransactions],
  );

  return sendAllTransactions;
};
