import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { RPC_URL } from "./constant";

interface Fee {
  /**
   * @description medium
   */
  m: number;
  /**
   * @description high
   */
  h: number;
  /**
   * @description very high
   */
  vh: number;
}

interface MarketReferenceFee {
  claim: number;
  jup: Fee;
  jup2: Fee;
  loAndDCA: number;
  referral: number;
  perps: Fee;
  swapFee: number;
  lastUpdatedAt: number;
}

interface GetOptimalComputeUnitLimitAndPricePayload {
  instructions: TransactionInstruction[];
  payer: PublicKey;
  lookupTables: AddressLookupTableAccount[];
}

interface GetOptimalComputeUnitLimitAndPriceResponse {
  units: number;
  microLamports: number;
}

interface FeeService {
  getOptimalComputeUnitLimitAndPrice: (
    payload: GetOptimalComputeUnitLimitAndPricePayload,
  ) => Promise<GetOptimalComputeUnitLimitAndPriceResponse>;
}

class FeeServiceImpl implements FeeService {
  // --------------------
  // Properties
  // --------------------
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL);
  }

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

  /**
   *
   * Code snippets from the Solana documentation
   * @see https://solana.com/developers/guides/advanced/how-to-request-optimal-compute#how-to-request-compute-budget
   */
  private getSimulationUnits = async (
    payload: GetOptimalComputeUnitLimitAndPricePayload,
  ) => {
    const { instructions, payer, lookupTables } = payload;

    const testInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ...instructions,
    ];

    const testVersionedTxn = new VersionedTransaction(
      new TransactionMessage({
        instructions: testInstructions,
        payerKey: payer,
        recentBlockhash: PublicKey.default.toString(),
      }).compileToV0Message(lookupTables),
    );

    const simulation = await this.connection.simulateTransaction(
      testVersionedTxn,
      {
        replaceRecentBlockhash: true,
        sigVerify: false,
      },
    );
    if (simulation.value.err) {
      return undefined;
    }
    return simulation.value.unitsConsumed;
  };

  private addMarginErrorForComputeUnitLimit = (fee: number, margin: number) =>
    Math.floor(fee * margin);

  private getReferralReferenceFeeInMicroLamports = async (
    computeUnitLimit: number,
  ) => {
    const marketReferenceFeeInLamports = await this.getMarketReferenceFee();

    const referralReferenceFeeInMicroLamports =
      this.computePriceMicroLamportsFromFeeLamports(
        marketReferenceFeeInLamports.loAndDCA,
        computeUnitLimit,
      );

    return referralReferenceFeeInMicroLamports;
  };

  private computePriceMicroLamportsFromFeeLamports = (
    feeInLamports: number,
    computeUnitLimit: number,
  ) => Math.floor((feeInLamports * 1_000_000) / computeUnitLimit);

  // --------------------
  // Main methods
  // --------------------
  getOptimalComputeUnitLimitAndPrice: FeeService["getOptimalComputeUnitLimitAndPrice"] =
    async (payload) => {
      // unit
      const simulationUnits = await this.getSimulationUnits(payload);
      /**
       * Best practices to always add a margin error to the simulation units (10% ~ 20%)
       * @see https://solana.com/developers/guides/advanced/how-to-request-optimal-compute#special-considerations
       */
      const simulationUnitsWithMarginError =
        this.addMarginErrorForComputeUnitLimit(simulationUnits, 1.2);

      console.log(simulationUnits);

      // price
      const referenceFeeInMicroLamports =
        await this.getReferralReferenceFeeInMicroLamports(simulationUnits);

      return {
        // `computeUnitLimit`
        units: simulationUnitsWithMarginError,
        // `computeUnitPrice`
        microLamports: referenceFeeInMicroLamports,
      };
    };
}

export const feeService = new FeeServiceImpl();
