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
    connection?: Connection
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
      await fetch("https://cache.jup.ag/reference-fees")
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
    connection?: Connection
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

    const simulation = await (connection || this.connection).simulateTransaction(
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

  private addMarginErrorForComputeUnitLimit = (units: number, margin: number) =>
    Math.floor(units * margin);

  private getReferralReferenceFeeInMicroLamports = async () => {
    const marketReferenceFeeInLamports = await this.getMarketReferenceFee();
    return marketReferenceFeeInLamports.referral;
  };

  // --------------------
  // Main methods
  // --------------------
  getOptimalComputeUnitLimitAndPrice: FeeService["getOptimalComputeUnitLimitAndPrice"] =
    async (payload, connection?: Connection) => {
      // Unit
      const simulationUnits = await this.getSimulationUnits(payload, connection);
      /**
       * Best practices to always add a margin error to the simulation units (10% ~ 20%)
       * @see https://solana.com/developers/guides/advanced/how-to-request-optimal-compute#special-considerations
       */
      const simulationUnitsWithMarginError =
        this.addMarginErrorForComputeUnitLimit(simulationUnits, 1.2);

      // Price
      const referenceFeeInMicroLamports =
        await this.getReferralReferenceFeeInMicroLamports();

      return {
        // `computeUnitLimit`
        units: simulationUnitsWithMarginError,
        // `computeUnitPrice`
        microLamports: referenceFeeInMicroLamports,
      };
    };
}

export const feeService = new FeeServiceImpl();
