import {
  estimatePriorityFee,
  modifyComputeUnitLimitIx,
  modifyPriorityFeeIx,
} from "@mercurial-finance/optimist";
import {
  ComputeBudgetProgram,
  Connection,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";

import { RPC_URL } from "../constant";

interface FeeRepository {
  modifyComputeUnitLimitAndPrice: (
    tx: Transaction | VersionedTransaction,
  ) => Promise<boolean>;
}

class FeeRepositoryImpl implements FeeRepository {
  // --------------------
  // Properties
  // --------------------

  // average `unitsConsumed` value from all transactions sent by `sendAllTransactions`
  private readonly COMPUTE_UNIT_LIMIT = 500_000;

  private connection: Connection;

  // --------------------
  // Constructor
  // --------------------
  constructor() {
    this.connection = new Connection(RPC_URL);
  }

  // --------------------
  // Helper methods
  // --------------------
  private getFeeInMicroLamportsFromLamports = (
    totalFeeInLamports: number,
    computeUnitLimit: number,
  ) => Math.floor((totalFeeInLamports * 1_000_000) / computeUnitLimit);

  private getEstimatedPriorityFeeInMicroLamports = async (
    tx: Transaction | VersionedTransaction,
  ) => {
    const estimatedPriorityFeeInLamports = await estimatePriorityFee(
      this.connection,
      {
        tx,
      },
    );

    const estimatedPriorityFeeInMicroLamports =
      this.getFeeInMicroLamportsFromLamports(
        estimatedPriorityFeeInLamports || 0,
        this.COMPUTE_UNIT_LIMIT,
      );

    return estimatedPriorityFeeInMicroLamports;
  };

  // --------------------
  // Main methods
  // --------------------
  modifyComputeUnitLimitAndPrice: FeeRepository["modifyComputeUnitLimitAndPrice"] =
    async (tx) => {
      const estimatedPriorityFeeInMicroLamports =
        await this.getEstimatedPriorityFeeInMicroLamports(tx);

      const modifyUnitLimitResult = modifyComputeUnitLimitIx(
        tx,
        this.COMPUTE_UNIT_LIMIT,
      );
      const modifyModifyUnitPriceResult = modifyPriorityFeeIx(
        tx,
        estimatedPriorityFeeInMicroLamports,
      );

      return modifyUnitLimitResult && modifyModifyUnitPriceResult;
    };
}

export const feeRepository = new FeeRepositoryImpl();
