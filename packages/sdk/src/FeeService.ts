import {
  modifyComputeUnitLimitIx,
  modifyPriorityFeeIx,
} from "@mercurial-finance/optimist";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

interface Fee {
  m: number;
  h: number;
  vh: number;
}

interface MarketReferenceFee {
  claim: number;
  jup: Fee;
  jup2: Fee;
  loAndDCA: number;
  perps: Fee;
  swapFee: number;
  lastUpdatedAt: number;
}

interface FeeService {
  modifyComputeUnitLimitAndPrice: (
    tx: Transaction | VersionedTransaction,
  ) => Promise<boolean>;
}

class FeeServiceImpl implements FeeService {
  // --------------------
  // Properties
  // --------------------

  // average `unitsConsumed` value from all transactions sent by `sendAllTransactions`
  private readonly COMPUTE_UNIT_LIMIT = 500_000;

  private readonly MINIMUM_FEE_IN_MICRO_LAMPORTS = 10_000;

  // --------------------
  // API
  // --------------------
  private getMarketReferenceFee = async (): Promise<MarketReferenceFee> => {
    const data = (
      await fetch("https://cache.jup.ag/jup-claim-reference-fees")
    ).json() as unknown as MarketReferenceFee;
    return data;
  };

  // --------------------
  // Helper methods
  // --------------------
  private getFeeInMicroLamportsFromLamports = (
    totalFeeInLamports: number,
    computeUnitLimit: number,
  ) => Math.floor((totalFeeInLamports * 1_000_000) / computeUnitLimit);
  r;
  private getPriorityFeeInMicroLamports = async () => {
    const marketReferenceFee = await this.getMarketReferenceFee();
    const loAndDCAReferenceFeeInMicroLamports =
      this.getFeeInMicroLamportsFromLamports(
        marketReferenceFee.loAndDCA,
        this.COMPUTE_UNIT_LIMIT,
      );

    const priorityFeeInMicroLamports = Math.min(
      this.MINIMUM_FEE_IN_MICRO_LAMPORTS,
      loAndDCAReferenceFeeInMicroLamports,
    );

    return priorityFeeInMicroLamports;
  };

  // --------------------
  // Main methods
  // --------------------
  modifyComputeUnitLimitAndPrice: FeeService["modifyComputeUnitLimitAndPrice"] =
    async (tx) => {
      const priorityFeeInMicroLamports =
        await this.getPriorityFeeInMicroLamports();

      const modifyUnitLimitResult = modifyComputeUnitLimitIx(
        tx,
        this.COMPUTE_UNIT_LIMIT,
      );
      const modifyModifyUnitPriceResult = modifyPriorityFeeIx(
        tx,
        priorityFeeInMicroLamports,
      );

      return modifyUnitLimitResult && modifyModifyUnitPriceResult;
    };
}

export const feeService = new FeeServiceImpl();
