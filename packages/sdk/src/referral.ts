import { AnchorProvider, IdlAccounts, Program } from "@coral-xyz/anchor";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  RawAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  GetProgramAccountsFilter,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import chunk from "lodash/chunk";

import { chunkedGetMultipleAccountInfos } from "./chunks";
import { PROGRAM_ID } from "./constant";
import { feeService } from "./FeeService";
import { IDL, Referral } from "./idl";
import { getOrCreateATAInstruction } from "./utils";

export interface InitializeProjectVariable {
  adminPubKey: PublicKey;
  basePubKey: PublicKey;
  name: string;
  defaultShareBps: number;
}

export interface TransferProjectVariable {
  newAdminPubKey: PublicKey;
  projectPubKey: PublicKey;
}

export interface InitializeReferralAccountVariable {
  projectPubKey: PublicKey;
  partnerPubKey: PublicKey;
  payerPubKey: PublicKey;
  referralAccountPubKey: PublicKey;
}

export interface InitializeReferralAccountWithNameVariable {
  projectPubKey: PublicKey;
  partnerPubKey: PublicKey;
  payerPubKey: PublicKey;
  name: string;
}

export interface TransferReferralAccountVariable {
  newPartnerPubKey: PublicKey;
  referralAccountPubKey: PublicKey;
}

export interface GetReferralAccountPubkeyVariable {
  projectPubKey: PublicKey;
  name: string;
}

export interface GetReferralTokenAccountPubkeyVariable {
  referralAccountPubKey: PublicKey;
  mint: PublicKey;
}

export interface InitializeReferralTokenAccountVariable {
  payerPubKey: PublicKey;
  referralAccountPubKey: PublicKey;
  mint: PublicKey;
}

export interface ClaimVariable {
  payerPubKey: PublicKey;
  referralAccountPubKey: PublicKey;
  mint: PublicKey;
}

export interface ClaimAllVariable {
  payerPubKey: PublicKey;
  referralAccountPubKey: PublicKey;
  strategy?: GetReferralTokenAccountsStrategy;
}

export interface ClaimPartiallyVariable extends ClaimAllVariable {
  withdrawalableTokenAddress: PublicKey[];
}

export interface RawAccountWithPubkey {
  pubkey: PublicKey;
  account: RawAccount;
}

export const useReferral = (connection: Connection) => {
  return new ReferralProvider(connection);
};

export type GetReferralTokenAccountsStrategy =
  | { type: "top-tokens"; topN: number }
  | { type: "token-list" };

export class ReferralProvider {
  private program: Program<Referral>;
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;

    const provider = new AnchorProvider(
      connection,
      {} as any,
      AnchorProvider.defaultOptions(),
    );

    this.program = new Program(IDL, PROGRAM_ID, provider);
  }

  public async getProjects(filters: GetProgramAccountsFilter[] = []) {
    return await this.program.account.project.all(filters);
  }

  public async getProject(pubkey: PublicKey) {
    return await this.program.account.project.fetch(pubkey);
  }

  public async getReferralAccount(pubkey: PublicKey) {
    return await this.program.account.referralAccount.fetch(pubkey);
  }

  public async getReferralAccounts(filters: GetProgramAccountsFilter[] = []) {
    return await this.program.account.referralAccount.all(filters);
  }

  public getProjectAuthorityPubKey(
    project: IdlAccounts<Referral>["project"],
  ): PublicKey {
    let [projectAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("project_authority"), project.base.toBuffer()],
      this.program.programId,
    );

    return projectAuthority;
  }

  public getReferralAccountWithNamePubKey({
    projectPubKey,
    name,
  }: GetReferralAccountPubkeyVariable) {
    const [referralAccountPubKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("referral"), projectPubKey.toBuffer(), Buffer.from(name)],
      this.program.programId,
    );

    return referralAccountPubKey;
  }

  public getReferralTokenAccountPubKey({
    referralAccountPubKey,
    mint,
  }: GetReferralTokenAccountPubkeyVariable) {
    const [referralTokenAccountPubKey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("referral_ata"),
        referralAccountPubKey.toBuffer(),
        mint.toBuffer(),
      ],
      this.program.programId,
    );

    return referralTokenAccountPubKey;
  }

  public getReferralTokenAccountPubKeyV2({
    referralAccountPubKey,
    tokenProgramId,
    mint,
  }: GetReferralTokenAccountPubkeyVariable & {
    tokenProgramId: PublicKey;
  }) {
    const tokenAccount = getAssociatedTokenAddressSync(
      mint,
      referralAccountPubKey,
      true,
      tokenProgramId,
    );

    return tokenAccount;
  }

  public async getReferralTokenAccounts(
    referralAccountAddress: string,
  ): Promise<{
    tokenAccounts: RawAccountWithPubkey[];
    token2022Accounts: RawAccountWithPubkey[];
  }> {
    const referralAccount = await this.program.account.referralAccount.fetch(
      new PublicKey(referralAccountAddress),
    );

    const [tokenAccounts, token2022Accounts] = await Promise.all(
      [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map(async (programId) => {
        const mintSet = new Set();
        const possibleTokenAccountSet = new Set<string>();
        const tokenAccountMap = new Map<string, RawAccount>();

        // get all token accounts belong to project
        const allTokenAccounts = await this.connection.getTokenAccountsByOwner(
          referralAccount.project,
          { programId },
        );

        // get unique mint and all token accounts
        allTokenAccounts.value.map((tokenAccount) => {
          const accountData = AccountLayout.decode(
            new Uint8Array(tokenAccount.account.data),
          );

          if (!mintSet.has(accountData.mint.toBase58())) {
            const address = this.getReferralTokenAccountPubKey({
              referralAccountPubKey: new PublicKey(referralAccountAddress),
              mint: accountData.mint,
            });
            mintSet.add(accountData.mint.toBase58());
            possibleTokenAccountSet.add(address.toBase58());
          }

          tokenAccountMap.set(tokenAccount.pubkey.toBase58(), accountData);
        });

        // loop through mint and find token account belong to referral account
        return Array.from(possibleTokenAccountSet).reduce((acc, address) => {
          const tokenAccount = tokenAccountMap.get(address);
          if (tokenAccount) {
            acc.push({ pubkey: new PublicKey(address), account: tokenAccount });
          }

          return acc;
        }, new Array<RawAccountWithPubkey>());
      }),
    );

    return { tokenAccounts, token2022Accounts };
  }

  public async getReferralTokenAccountsV2(
    referralAccountAddress: string,
  ): Promise<{
    tokenAccounts: RawAccountWithPubkey[];
    token2022Accounts: RawAccountWithPubkey[];
  }> {
    const [tokenAccounts, token2022Accounts] = await Promise.all(
      [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map(async (programId) => {
        // get all token accounts owned by referral account for this program
        const allTokenAccounts = await this.connection.getTokenAccountsByOwner(
          new PublicKey(referralAccountAddress),
          { programId },
        );

        // convert to RawAccountWithPubkey format
        return allTokenAccounts.value.map((tokenAccount) => ({
          pubkey: tokenAccount.pubkey,
          account: AccountLayout.decode(
            new Uint8Array(tokenAccount.account.data),
          ),
        }));
      }),
    );

    return { tokenAccounts, token2022Accounts };
  }

  public async getReferralTokenAccountsWithStrategy(
    referralAccountAddress: string,
    strategy: GetReferralTokenAccountsStrategy = {
      type: "top-tokens",
      topN: 100,
    },
  ): Promise<{
    tokenAccounts: RawAccountWithPubkey[];
    token2022Accounts: RawAccountWithPubkey[];
  }> {
    const tokens = await (async () => {
      if (strategy.type === "top-tokens") {
        const topTokens = (
          (await (
            await fetch("https://cache.jup.ag/top-tokens")
          ).json()) as string[]
        ).slice(0, strategy.topN);
        return topTokens;
      } else if (strategy.type === "token-list") {
        const tokens = (
          await (
            await fetch("https://tokens.jup.ag/tokens?tags=verified,lst")
          ).json()
        ).map(({ address }) => address) as string[];
        return tokens;
      } else {
        throw new Error("Invalid strategy");
      }
    })();

    const tokensWithOwner = await chunkedGetMultipleAccountInfos(
      this.connection,
      tokens.map((topToken) => new PublicKey(topToken)),
    );

    // Create mint -> owner map
    const mintOwnerMap = new Map<string, PublicKey>();
    tokens.forEach((token, index) => {
      const accountInfo = tokensWithOwner[index];
      if (accountInfo) {
        mintOwnerMap.set(token, accountInfo.owner);
      }
    });

    const referralTokenAccounts = tokens.map((topToken) =>
      this.getReferralTokenAccountPubKey({
        referralAccountPubKey: new PublicKey(referralAccountAddress),
        mint: new PublicKey(topToken),
      }),
    );

    const tokenAccounts: RawAccountWithPubkey[] = [];
    const token2022Accounts: RawAccountWithPubkey[] = [];
    const accountInfos = await chunkedGetMultipleAccountInfos(
      this.connection,
      referralTokenAccounts,
    );
    for (const [index, accountInfo] of accountInfos.entries()) {
      if (!accountInfo) continue;
      const address = referralTokenAccounts[index];
      const rawAccount = AccountLayout.decode(new Uint8Array(accountInfo.data));

      const rawAccountWithPubkey = {
        pubkey: address,
        account: rawAccount,
      };
      if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        tokenAccounts.push(rawAccountWithPubkey);
      } else if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        token2022Accounts.push(rawAccountWithPubkey);
      }
    }

    return {
      tokenAccounts,
      token2022Accounts,
    };
  }

  public async getReferralTokenAccountsWithStrategyV2(
    referralAccountAddress: string,
    strategy: GetReferralTokenAccountsStrategy = {
      type: "top-tokens",
      topN: 100,
    },
  ): Promise<{
    tokenAccounts: RawAccountWithPubkey[];
    token2022Accounts: RawAccountWithPubkey[];
  }> {
    // Get tokens based on strategy
    const tokens = await (async () => {
      if (strategy.type === "top-tokens") {
        const topTokens = (
          (await (
            await fetch("https://cache.jup.ag/top-tokens")
          ).json()) as string[]
        ).slice(0, strategy.topN);
        return topTokens;
      } else if (strategy.type === "token-list") {
        const tokens = (
          await (
            await fetch("https://tokens.jup.ag/tokens?tags=verified,lst")
          ).json()
        ).map(({ address }) => address) as string[];
        return tokens;
      } else {
        throw new Error("Invalid strategy");
      }
    })();

    const referralPubkey = new PublicKey(referralAccountAddress);

    // Get token accounts for both programs
    const [tokenAccounts, token2022Accounts] = await Promise.all(
      [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map(async (programId) => {
        const accounts = await this.connection.getTokenAccountsByOwner(
          referralPubkey,
          { programId },
        );

        return accounts.value
          .map((tokenAccount) => ({
            pubkey: tokenAccount.pubkey,
            account: AccountLayout.decode(
              new Uint8Array(tokenAccount.account.data),
            ),
          }))
          .filter((account) =>
            // Only include accounts for mints in our strategy list
            tokens.includes(account.account.mint.toBase58()),
          );
      }),
    );

    return {
      tokenAccounts,
      token2022Accounts,
    };
  }

  public async initializeProject({
    basePubKey,
    adminPubKey,
    name,
    defaultShareBps,
  }: InitializeProjectVariable): Promise<Transaction> {
    const [projectPubKey] = PublicKey.findProgramAddressSync(
      [Buffer.from("project"), basePubKey.toBuffer()],
      this.program.programId,
    );

    return await this.program.methods
      .initializeProject({ name, defaultShareBps })
      .accounts({
        admin: adminPubKey,
        project: projectPubKey,
        base: basePubKey,
      })
      .transaction();
  }

  public async transferProject({
    newAdminPubKey,
    projectPubKey,
  }: TransferProjectVariable): Promise<Transaction> {
    const project = await this.program.account.project.fetch(projectPubKey);

    return await this.program.methods
      .transferProject({})
      .accounts({
        admin: project.admin,
        project: projectPubKey,
        newAdmin: newAdminPubKey,
      })
      .transaction();
  }

  public async initializeReferralAccount({
    projectPubKey,
    partnerPubKey,
    payerPubKey,
    referralAccountPubKey,
  }: InitializeReferralAccountVariable): Promise<Transaction> {
    return await this.program.methods
      .initializeReferralAccount({})
      .accounts({
        project: projectPubKey,
        partner: partnerPubKey,
        referralAccount: referralAccountPubKey,
        payer: payerPubKey,
      })
      .transaction();
  }

  public async initializeReferralAccountWithName({
    projectPubKey,
    partnerPubKey,
    payerPubKey,
    name,
  }: InitializeReferralAccountWithNameVariable): Promise<{
    tx: Transaction;
    referralAccountPubKey: PublicKey;
  }> {
    const referralAccountPubKey = this.getReferralAccountWithNamePubKey({
      projectPubKey,
      name,
    });

    const tx = await this.program.methods
      .initializeReferralAccountWithName({ name })
      .accounts({
        project: projectPubKey,
        partner: partnerPubKey,
        referralAccount: referralAccountPubKey,
        payer: payerPubKey,
      })
      .transaction();

    return { tx, referralAccountPubKey };
  }

  public async transferReferralAccount({
    newPartnerPubKey,
    referralAccountPubKey,
  }: TransferReferralAccountVariable): Promise<Transaction> {
    const referralAccount = await this.program.account.referralAccount.fetch(
      referralAccountPubKey,
    );

    return await this.program.methods
      .transferReferralAccount({})
      .accounts({
        partner: referralAccount.partner,
        newPartner: newPartnerPubKey,
        referralAccount: referralAccountPubKey,
      })
      .transaction();
  }

  public async initializeReferralTokenAccount({
    payerPubKey,
    referralAccountPubKey,
    mint,
  }: InitializeReferralTokenAccountVariable): Promise<{
    tx: Transaction;
    referralTokenAccountPubKey: PublicKey;
  }> {
    const mintAccount = await this.connection.getAccountInfo(mint);
    if (!mintAccount) throw new Error("Invalid mint");

    if (
      ![TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].some((id) =>
        id.equals(mintAccount.owner),
      )
    )
      throw new Error("Invalid mint");

    const referralAccount = await this.program.account.referralAccount.fetch(
      referralAccountPubKey,
    );

    const referralTokenAccountPubKey = this.getReferralTokenAccountPubKey({
      referralAccountPubKey,
      mint,
    });

    const tx = await this.program.methods
      .initializeReferralTokenAccount()
      .accounts({
        payer: payerPubKey,
        project: referralAccount.project,
        referralAccount: referralAccountPubKey,
        referralTokenAccount: referralTokenAccountPubKey,
        mint,
        tokenProgram: mintAccount.owner,
      })
      .transaction();

    return { tx, referralTokenAccountPubKey };
  }

  public async initializeReferralTokenAccountV2({
    payerPubKey,
    referralAccountPubKey,
    mint,
  }: InitializeReferralTokenAccountVariable): Promise<{
    tx: Transaction;
    referralTokenAccountPubKey: PublicKey;
  }> {
    const mintAccount = await this.connection.getAccountInfo(mint);
    if (!mintAccount) throw new Error("Invalid mint");

    if (
      ![TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].some((id) =>
        id.equals(mintAccount.owner),
      )
    )
      throw new Error("Invalid mint");

    const referralTokenAccountPubKey = this.getReferralTokenAccountPubKey({
      referralAccountPubKey,
      mint,
    });

    const tokenAccount = getAssociatedTokenAddressSync(
      mint,
      referralTokenAccountPubKey,
      true,
      mintAccount.owner,
    );

    const ix = createAssociatedTokenAccountIdempotentInstruction(
      payerPubKey,
      tokenAccount,
      referralTokenAccountPubKey,
      mint,
      mintAccount.owner,
    );

    const tx = new Transaction().add(ix);

    return { tx, referralTokenAccountPubKey };
  }

  public async claim({
    payerPubKey,
    referralAccountPubKey,
    mint,
  }: ClaimVariable): Promise<VersionedTransaction> {
    const mintAccount = await this.connection.getAccountInfo(mint);
    if (!mintAccount) throw new Error("Invalid mint");

    if (
      ![TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].some((id) =>
        id.equals(mintAccount.owner),
      )
    )
      throw new Error("Invalid mint");

    const referralAccount = await this.program.account.referralAccount.fetch(
      referralAccountPubKey,
    );
    const project = await this.program.account.project.fetch(
      referralAccount.project,
    );

    const [
      referralTokenAccountPubKey,
      [partnerTokenAccount, createPartnerTokenAccountIx],
      [projectAdminTokenAccount, createProjectAdminTokenAccountIx],
    ] = await Promise.all([
      this.getReferralTokenAccountPubKey({
        referralAccountPubKey,
        mint,
      }),
      getOrCreateATAInstruction(
        mint,
        referralAccount.partner,
        this.connection,
        payerPubKey,
        undefined,
        mintAccount.owner,
      ),
      getOrCreateATAInstruction(
        mint,
        project.admin,
        this.connection,
        payerPubKey,
        undefined,
        mintAccount.owner,
      ),
    ]);

    let preInstructions: TransactionInstruction[] = [];
    if (createPartnerTokenAccountIx)
      preInstructions.push(createPartnerTokenAccountIx);
    if (createProjectAdminTokenAccountIx) {
      const projectAuthority = this.getProjectAuthorityPubKey(project);
      const ix = await this.program.methods
        .createAdminTokenAccount()
        .accounts({
          project: referralAccount.project,
          projectAuthority,
          admin: project.admin,
          projectAdminTokenAccount: projectAdminTokenAccount,
          mint,
          tokenProgram: mintAccount.owner,
        })
        .instruction();

      preInstructions.push(ix);
    }

    const transaction = await this.program.methods
      .claim()
      .accounts({
        payer: payerPubKey,
        project: referralAccount.project,
        admin: project.admin,
        projectAdminTokenAccount,
        referralAccount: referralAccountPubKey,
        referralTokenAccount: referralTokenAccountPubKey,
        partner: referralAccount.partner,
        partnerTokenAccount: partnerTokenAccount,
        mint,
        tokenProgram: mintAccount.owner,
      })
      .preInstructions(preInstructions)
      .transaction();
    const instructions = transaction.instructions;

    // Get Address Lookup Table
    const addressLookupTable = await this.connection.getAddressLookupTable(
      new PublicKey("GBzQG2iFrPwXjGtCnwNt9S5eHd8xAR8jUMt3QDJpnjud"),
    );
    const lookupTableAccount = addressLookupTable.value;

    // Priority Fee Instructions
    const { units, microLamports } =
      await feeService.getOptimalComputeUnitLimitAndPrice({
        instructions: transaction.instructions,
        payer: payerPubKey,
        lookupTables: [lookupTableAccount],
      });
    instructions.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    );
    if (units) {
      instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));
    }

    // Compile to V0 Message
    const blockhash = (await this.connection.getLatestBlockhash()).blockhash;
    const messageV0 = new TransactionMessage({
      payerKey: payerPubKey,
      instructions,
      recentBlockhash: blockhash,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  }

  public async claimV2({
    payerPubKey,
    referralAccountPubKey,
    mint,
  }: ClaimVariable): Promise<VersionedTransaction> {
    const mintAccount = await this.connection.getAccountInfo(mint);
    if (!mintAccount) throw new Error("Invalid mint");

    if (
      ![TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].some((id) =>
        id.equals(mintAccount.owner),
      )
    )
      throw new Error("Invalid mint");

    const referralAccount = await this.program.account.referralAccount.fetch(
      referralAccountPubKey,
    );
    const project = await this.program.account.project.fetch(
      referralAccount.project,
    );

    const [
      referralTokenAccountPubKey,
      [partnerTokenAccount, createPartnerTokenAccountIx],
      [projectAdminTokenAccount, createProjectAdminTokenAccountIx],
    ] = await Promise.all([
      this.getReferralTokenAccountPubKeyV2({
        referralAccountPubKey,
        mint,
        tokenProgramId: mintAccount.owner,
      }),
      getOrCreateATAInstruction(
        mint,
        referralAccount.partner,
        this.connection,
        payerPubKey,
        undefined,
        mintAccount.owner,
      ),
      getOrCreateATAInstruction(
        mint,
        project.admin,
        this.connection,
        payerPubKey,
        undefined,
        mintAccount.owner,
      ),
    ]);

    let preInstructions: TransactionInstruction[] = [];
    if (createPartnerTokenAccountIx)
      preInstructions.push(createPartnerTokenAccountIx);
    if (createProjectAdminTokenAccountIx) {
      const projectAuthority = this.getProjectAuthorityPubKey(project);
      const ix = await this.program.methods
        .createAdminTokenAccount()
        .accounts({
          project: referralAccount.project,
          projectAuthority,
          admin: project.admin,
          projectAdminTokenAccount: projectAdminTokenAccount,
          mint,
          tokenProgram: mintAccount.owner,
        })
        .instruction();

      preInstructions.push(ix);
    }

    const transaction = await this.program.methods
      .claimV2()
      .accountsStrict({
        payer: payerPubKey,
        project: referralAccount.project,
        admin: project.admin,
        projectAdminTokenAccount,
        referralAccount: referralAccountPubKey,
        referralTokenAccount: referralTokenAccountPubKey,
        partner: referralAccount.partner,
        partnerTokenAccount: partnerTokenAccount,
        mint,
        tokenProgram: mintAccount.owner,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .preInstructions(preInstructions)
      .transaction();
    const instructions = transaction.instructions;

    // Get Address Lookup Table
    const addressLookupTable = await this.connection.getAddressLookupTable(
      new PublicKey("GBzQG2iFrPwXjGtCnwNt9S5eHd8xAR8jUMt3QDJpnjud"),
    );
    const lookupTableAccount = addressLookupTable.value;

    // Priority Fee Instructions
    const { units, microLamports } =
      await feeService.getOptimalComputeUnitLimitAndPrice({
        instructions: transaction.instructions,
        payer: payerPubKey,
        lookupTables: [lookupTableAccount],
      });
    instructions.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    );
    if (units) {
      instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));
    }

    // Compile to V0 Message
    const blockhash = (await this.connection.getLatestBlockhash()).blockhash;
    const messageV0 = new TransactionMessage({
      payerKey: payerPubKey,
      instructions,
      recentBlockhash: blockhash,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  }

  public async claimAll({
    payerPubKey,
    referralAccountPubKey,
    strategy,
  }: ClaimAllVariable): Promise<VersionedTransaction[]> {
    const blockhash = (await this.connection.getLatestBlockhash()).blockhash;
    const lookupTableAccount = await this.connection
      .getAddressLookupTable(
        new PublicKey("GBzQG2iFrPwXjGtCnwNt9S5eHd8xAR8jUMt3QDJpnjud"),
      )
      .then((res) => res.value);

    const referralAccount = await this.program.account.referralAccount.fetch(
      referralAccountPubKey,
    );
    const project = await this.program.account.project.fetch(
      referralAccount.project,
    );
    const projectAuthority = this.getProjectAuthorityPubKey(project);

    const { tokenAccounts, token2022Accounts } = strategy
      ? await this.getReferralTokenAccountsWithStrategy(
          referralAccountPubKey.toString(),
          strategy,
        )
      : await this.getReferralTokenAccounts(referralAccountPubKey.toString());

    const vtTxs = await Promise.all(
      [tokenAccounts, token2022Accounts].map(async (accounts, idx) => {
        const tokenProgramId =
          idx === 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
        const tokensWithAmount = accounts.filter(
          (item) => item.account.amount > 0 && item.account.state === 1,
        );

        const claimParams = await Promise.all(
          tokensWithAmount.map(async (token) => {
            const referralTokenAccountPubKey =
              this.getReferralTokenAccountPubKey({
                referralAccountPubKey,
                mint: token.account.mint,
              });

            const preInstructions: TransactionInstruction[] = [];

            const partnerTokenAccount = getAssociatedTokenAddressSync(
              token.account.mint,
              referralAccount.partner,
              true,
              tokenProgramId,
            );
            preInstructions.push(
              createAssociatedTokenAccountIdempotentInstruction(
                payerPubKey,
                partnerTokenAccount,
                referralAccount.partner,
                token.account.mint,
                tokenProgramId,
              ),
            );

            const projectAdminTokenAccount = getAssociatedTokenAddressSync(
              token.account.mint,
              project.admin,
              true,
              tokenProgramId,
            );
            const ix = await this.program.methods
              .createAdminTokenAccount()
              .accounts({
                project: referralAccount.project,
                projectAuthority,
                admin: project.admin,
                projectAdminTokenAccount,
                mint: token.account.mint,
                tokenProgram: tokenProgramId,
              })
              .instruction();

            preInstructions.push(ix);

            return {
              referralTokenAccountPubKey,
              projectAdminTokenAccount,
              partnerTokenAccount,
              preInstructions,
              mint: token.account.mint,
            };
          }),
        );

        const txs: VersionedTransaction[] = [];
        let instructions: TransactionInstruction[] = [];
        let chunk = 0;
        for (const {
          referralTokenAccountPubKey,
          projectAdminTokenAccount,
          partnerTokenAccount,
          mint,
          preInstructions,
        } of claimParams) {
          const tx = await this.program.methods
            .claim()
            .accounts({
              payer: payerPubKey,
              project: referralAccount.project,
              admin: project.admin,
              projectAdminTokenAccount,
              referralAccount: referralAccountPubKey,
              referralTokenAccount: referralTokenAccountPubKey,
              partner: referralAccount.partner,
              partnerTokenAccount: partnerTokenAccount,
              mint,
              tokenProgram: tokenProgramId,
            })
            .preInstructions(preInstructions)
            .transaction();
          instructions.push(...tx.instructions);

          chunk += 1;

          if (chunk === 4) {
            // Priority Fee Instructions
            const { units, microLamports } =
              await feeService.getOptimalComputeUnitLimitAndPrice({
                instructions,
                payer: payerPubKey,
                lookupTables: [lookupTableAccount],
              });
            instructions.unshift(
              ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
            );
            if (units) {
              instructions.unshift(
                ComputeBudgetProgram.setComputeUnitLimit({ units }),
              );
            }

            // Compile to V0 Message
            const messageV0 = new TransactionMessage({
              payerKey: payerPubKey,
              instructions,
              recentBlockhash: blockhash,
            }).compileToV0Message([lookupTableAccount]);
            chunk = 0;
            instructions = [];

            txs.push(new VersionedTransaction(messageV0));
          }
        }
        return txs;
      }),
    );

    return vtTxs.flat();
  }

  public async claimAllV2({
    payerPubKey,
    referralAccountPubKey,
  }: ClaimAllVariable): Promise<VersionedTransaction[]> {
    const blockhash = (await this.connection.getLatestBlockhash()).blockhash;
    const lookupTableAccount = await this.connection
      .getAddressLookupTable(
        new PublicKey("GBzQG2iFrPwXjGtCnwNt9S5eHd8xAR8jUMt3QDJpnjud"),
      )
      .then((res) => res.value);

    const referralAccount = await this.program.account.referralAccount.fetch(
      referralAccountPubKey,
    );
    const project = await this.program.account.project.fetch(
      referralAccount.project,
    );
    const projectAuthority = this.getProjectAuthorityPubKey(project);

    const { tokenAccounts, token2022Accounts } =
      await this.getReferralTokenAccountsV2(referralAccountPubKey.toString());

    const vtTxs = await Promise.all(
      [tokenAccounts, token2022Accounts].map(async (accounts, idx) => {
        const tokenProgramId =
          idx === 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
        const tokensWithAmount = accounts.filter(
          (item) => item.account.amount > 0 && item.account.state === 1,
        );

        const claimParams = await Promise.all(
          tokensWithAmount.map(async (token) => {
            const preInstructions: TransactionInstruction[] = [];

            const partnerTokenAccount = getAssociatedTokenAddressSync(
              token.account.mint,
              referralAccount.partner,
              true,
              tokenProgramId,
            );
            preInstructions.push(
              createAssociatedTokenAccountIdempotentInstruction(
                payerPubKey,
                partnerTokenAccount,
                referralAccount.partner,
                token.account.mint,
                tokenProgramId,
              ),
            );

            const projectAdminTokenAccount = getAssociatedTokenAddressSync(
              token.account.mint,
              project.admin,
              true,
              tokenProgramId,
            );
            const ix = await this.program.methods
              .createAdminTokenAccount()
              .accounts({
                project: referralAccount.project,
                projectAuthority,
                admin: project.admin,
                projectAdminTokenAccount,
                mint: token.account.mint,
                tokenProgram: tokenProgramId,
              })
              .instruction();

            preInstructions.push(ix);

            return {
              projectAdminTokenAccount,
              partnerTokenAccount,
              preInstructions,
              mint: token.account.mint,
              referralTokenAccount: token.pubkey, // Use ATA directly
            };
          }),
        );

        const txs: VersionedTransaction[] = [];
        let instructions: TransactionInstruction[] = [];
        let chunk = 0;
        for (const {
          projectAdminTokenAccount,
          partnerTokenAccount,
          mint,
          preInstructions,
          referralTokenAccount,
        } of claimParams) {
          const tx = await this.program.methods
            .claimV2()
            .accounts({
              payer: payerPubKey,
              project: referralAccount.project,
              admin: project.admin,
              projectAdminTokenAccount,
              referralAccount: referralAccountPubKey,
              referralTokenAccount,
              partner: referralAccount.partner,
              partnerTokenAccount,
              mint,
              tokenProgram: tokenProgramId,
              systemProgram: SystemProgram.programId,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            })
            .preInstructions(preInstructions)
            .transaction();
          instructions.push(...tx.instructions);

          chunk += 1;

          if (chunk === 4) {
            // Priority Fee Instructions
            const { units, microLamports } =
              await feeService.getOptimalComputeUnitLimitAndPrice({
                instructions,
                payer: payerPubKey,
                lookupTables: [lookupTableAccount],
              });
            instructions.unshift(
              ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
            );
            if (units) {
              instructions.unshift(
                ComputeBudgetProgram.setComputeUnitLimit({ units }),
              );
            }

            // Compile to V0 Message
            const messageV0 = new TransactionMessage({
              payerKey: payerPubKey,
              instructions,
              recentBlockhash: blockhash,
            }).compileToV0Message([lookupTableAccount]);
            chunk = 0;
            instructions = [];

            txs.push(new VersionedTransaction(messageV0));
          }
        }
        if (instructions.length > 0) {
          const messageV0 = new TransactionMessage({
            payerKey: payerPubKey,
            instructions,
            recentBlockhash: blockhash,
          }).compileToV0Message([lookupTableAccount]);

          txs.push(new VersionedTransaction(messageV0));
        }

        return txs;
      }),
    );

    return vtTxs.flat();
  }

  public async claimPartially({
    payerPubKey,
    referralAccountPubKey,
    withdrawalableTokenAddress,
  }: ClaimPartiallyVariable): Promise<VersionedTransaction[]> {
    const blockhash = (await this.connection.getLatestBlockhash()).blockhash;
    const lookupTableAccount = await this.connection
      .getAddressLookupTable(
        new PublicKey("GBzQG2iFrPwXjGtCnwNt9S5eHd8xAR8jUMt3QDJpnjud"),
      )
      .then((res) => res.value);

    const referralAccount = await this.program.account.referralAccount.fetch(
      referralAccountPubKey,
    );
    const project = await this.program.account.project.fetch(
      referralAccount.project,
    );
    const projectAuthority = this.getProjectAuthorityPubKey(project);

    const result = await this.connection.getMultipleAccountsInfo(
      withdrawalableTokenAddress,
    );

    const claimInstructionParams = await Promise.all(
      result.map(async (item) => {
        const tokenProgramId = item.owner;
        const tokenAccountData = AccountLayout.decode(
          new Uint8Array(item.data),
        );

        const referralTokenAccountPubKey = this.getReferralTokenAccountPubKey({
          referralAccountPubKey,
          mint: tokenAccountData.mint,
        });

        const preInstructions: TransactionInstruction[] = [];

        const partnerTokenAccount = getAssociatedTokenAddressSync(
          tokenAccountData.mint,
          referralAccount.partner,
          true,
          tokenProgramId,
        );
        preInstructions.push(
          createAssociatedTokenAccountIdempotentInstruction(
            payerPubKey,
            partnerTokenAccount,
            referralAccount.partner,
            tokenAccountData.mint,
            tokenProgramId,
          ),
        );

        const projectAdminTokenAccount = getAssociatedTokenAddressSync(
          tokenAccountData.mint,
          project.admin,
          true,
          tokenProgramId,
        );

        const ix = await this.program.methods
          .createAdminTokenAccount()
          .accounts({
            project: referralAccount.project,
            projectAuthority,
            admin: project.admin,
            projectAdminTokenAccount,
            mint: tokenAccountData.mint,
            tokenProgram: tokenProgramId,
          })
          .instruction();

        preInstructions.push(ix);

        return {
          referralTokenAccountPubKey,
          projectAdminTokenAccount,
          partnerTokenAccount,
          preInstructions,
          tokenProgramId,
          mint: tokenAccountData.mint,
        };
      }),
    );

    const chunkedInstructions = chunk(claimInstructionParams, 4);

    const txs: VersionedTransaction[] = await Promise.all(
      chunkedInstructions.map(async (chunkParams) => {
        let instructions: TransactionInstruction[] = [];

        await Promise.all(
          chunkParams.map(
            async ({
              referralTokenAccountPubKey,
              projectAdminTokenAccount,
              partnerTokenAccount,
              mint,
              preInstructions,
              tokenProgramId,
            }) => {
              const tx = await this.program.methods
                .claim()
                .accounts({
                  payer: payerPubKey,
                  project: referralAccount.project,
                  admin: project.admin,
                  projectAdminTokenAccount,
                  referralAccount: referralAccountPubKey,
                  referralTokenAccount: referralTokenAccountPubKey,
                  partner: referralAccount.partner,
                  partnerTokenAccount: partnerTokenAccount,
                  mint,
                  tokenProgram: tokenProgramId,
                })
                .preInstructions(preInstructions)
                .transaction();

              instructions.push(...tx.instructions);
            },
          ),
        );

        // Priority Fee Instructions
        const { units, microLamports } =
          await feeService.getOptimalComputeUnitLimitAndPrice({
            instructions,
            payer: payerPubKey,
            lookupTables: [lookupTableAccount],
          });
        instructions.unshift(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
        );
        if (units) {
          instructions.unshift(
            ComputeBudgetProgram.setComputeUnitLimit({ units }),
          );
        }

        // Compile to V0 Message
        const messageV0 = new TransactionMessage({
          payerKey: payerPubKey,
          instructions,
          recentBlockhash: blockhash,
        }).compileToV0Message([lookupTableAccount]);

        instructions = [];

        return new VersionedTransaction(messageV0);
      }),
    );

    return txs;
  }
}
