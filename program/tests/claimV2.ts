import * as anchor from "@coral-xyz/anchor";
import { AnchorError, BN, Program } from "@coral-xyz/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SPL_TOKEN_PROGRAM_ID, splTokenProgram } from "@coral-xyz/spl-token";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createAssociatedTokenAccountIdempotentInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import {
  createAssociatedTokenAccountWithOffCurve,
  createTokenAccount,
  createTokenMint,
  fundAccount,
  fundTokenAccount,
  getAccountBalance,
} from "./helpers/helpers";

describe("program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Referral as Program<Referral>;
  const admin = anchor.workspace.Referral.provider.wallet;

  const TEST_PROGRAM_IDS = [
    SPL_TOKEN_PROGRAM_ID,
    new anchor.web3.PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
  ];
  const TOKEN_PROGRAMS = TEST_PROGRAM_IDS.map((programId) =>
    splTokenProgram({
      provider,
      programId,
    }),
  );

  TOKEN_PROGRAMS.forEach((tokenProgram) => {
    const name =
      tokenProgram.programId === SPL_TOKEN_PROGRAM_ID ? "token" : "token-2022";

    describe(name, () => {
      // Changed test description to reflect V2 implementation
      describe("claim v2", () => {
        let base: anchor.web3.Keypair;
        let partner: anchor.web3.Keypair;
        let projectPubkey: anchor.web3.PublicKey;
        // Added referral name for named referral account
        let referralName = "TestReferral";
        // Changed from referralAccountKeypair to referralAccountPubkey (PDA)
        let referralAccountPubkey: anchor.web3.PublicKey;
        let projectName = "Referral";
        let referralTokenAccount: anchor.web3.PublicKey;
        let projectAuthorityPubkey: anchor.web3.PublicKey;
        let token: anchor.web3.PublicKey;
        let extraToken: anchor.web3.PublicKey;
        let extraReferralTokenAccount: anchor.web3.PublicKey;
        let extraToken2: anchor.web3.PublicKey;
        let extraReferralTokenAccount2: anchor.web3.PublicKey;
        let referralAmount = 1e8;
        let defaultShareBps = 8000;

        beforeEach(async () => {
          base = anchor.web3.Keypair.generate();
          partner = anchor.web3.Keypair.generate();
          fundAccount(partner.publicKey, provider);

          const [projectProgramAddress] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [Buffer.from("project"), base.publicKey.toBuffer()],
              program.programId,
            );

          projectPubkey = projectProgramAddress;

          const [projectAuthorityProgramAddress] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [Buffer.from("project_authority"), base.publicKey.toBuffer()],
              program.programId,
            );

          projectAuthorityPubkey = projectAuthorityProgramAddress;

          const depositAmount = new BN(100000000);

          const transaction = new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.transfer({
              fromPubkey: admin.payer.publicKey,
              toPubkey: projectAuthorityPubkey,
              lamports: depositAmount.toNumber(),
            }),
          );

          await anchor.web3.sendAndConfirmTransaction(
            program.provider.connection,
            transaction,
            [admin.payer],
          );

          await program.methods
            .initializeProject({ name: projectName, defaultShareBps })
            .accountsStrict({
              payer: admin.payer.publicKey,
              project: projectPubkey,
              admin: admin.payer.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
              base: base.publicKey,
            })
            .signers([base, admin.payer])
            .rpc();

          const [referralAccountPda] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [
                Buffer.from("referral"),
                projectPubkey.toBuffer(),
                Buffer.from(referralName),
              ],
              program.programId,
            );

          referralAccountPubkey = referralAccountPda;

          await program.methods
            .initializeReferralAccountWithName({
              name: referralName,
            })
            .accountsStrict({
              payer: partner.publicKey,
              project: projectPubkey,
              partner: partner.publicKey,
              referralAccount: referralAccountPubkey,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([partner])
            .rpc();

          token = await createTokenMint(tokenProgram, provider);

          referralTokenAccount = await createAssociatedTokenAccountWithOffCurve(
            token,
            tokenProgram.programId,
            referralAccountPubkey,
            provider,
          );
          await fundTokenAccount(
            referralTokenAccount,
            token,
            admin.payer,
            referralAmount,
            tokenProgram,
          );
          // Fund the admin account to pay for account creations
          await fundAccount(admin.payer.publicKey, provider);

          extraToken = await createTokenMint(tokenProgram, provider);
          extraReferralTokenAccount =
            await createAssociatedTokenAccountWithOffCurve(
              extraToken,
              tokenProgram.programId,
              referralAccountPubkey,
              provider,
            );
          await fundTokenAccount(
            extraReferralTokenAccount,
            extraToken,
            admin.payer,
            referralAmount,
            tokenProgram,
          );

          extraToken2 = await createTokenMint(tokenProgram, provider);
          extraReferralTokenAccount2 =
            await createAssociatedTokenAccountWithOffCurve(
              extraToken2,
              tokenProgram.programId,
              referralAccountPubkey,
              provider,
            );
          await fundTokenAccount(
            extraReferralTokenAccount2,
            extraToken2,
            admin.payer,
            referralAmount,
            tokenProgram,
          );
        });

        it("Is able to initialize referral token account", async () => {
          // Create a new token mint for testing
          // Get the referral token account address
          const tokenAccount = getAssociatedTokenAddressSync(
            token,
            referralAccountPubkey,
            true,
            tokenProgram.programId,
          );
          const ix = createAssociatedTokenAccountIdempotentInstruction(
            admin.payer.publicKey,
            tokenAccount,
            referralAccountPubkey,
            token,
            tokenProgram.programId,
          );

          const tx = new Transaction().add(ix);

          // Initialize the referral token account
          await provider.sendAndConfirm(tx, [admin.payer]);
          // Check that account exists
          const accountInfo = await provider.connection.getAccountInfo(
            tokenAccount,
          );
          expect(accountInfo).to.not.be.null;
        });

        it("Is able to claim using V2!", async () => {
          let referralTokenAccountBalance = await getAccountBalance(
            referralTokenAccount,
            provider,
          );

          let projectAdminTokenAccount = getAssociatedTokenAddressSync(
            token,
            admin.payer.publicKey,
            false,
            tokenProgram.programId,
          );
          let partnerTokenAccount = getAssociatedTokenAddressSync(
            token,
            partner.publicKey,
            false,
            tokenProgram.programId,
          );
          console.log("Claiming");
          try {
            await program.methods
              .claimV2()
              .accountsStrict({
                payer: admin.payer.publicKey,
                admin: admin.payer.publicKey,
                partner: partner.publicKey,
                project: projectPubkey,
                projectAdminTokenAccount,
                referralAccount: referralAccountPubkey,
                referralTokenAccount,
                partnerTokenAccount,
                mint: token,
                tokenProgram: tokenProgram.programId,
                systemProgram: anchor.web3.SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              })
              .signers([admin.payer])
              .rpc();
            console.log("Claimed");
          } catch (err) {
            console.log(err);
          }

          referralTokenAccountBalance = await getAccountBalance(
            referralTokenAccount,
            provider,
          );
          expect(referralTokenAccountBalance).to.equal(0);
          let projectAdminTokenAccountBalance = await getAccountBalance(
            projectAdminTokenAccount,
            provider,
          );
          expect(projectAdminTokenAccountBalance).to.equal(
            (referralAmount * (10000 - defaultShareBps)) / 10000,
          );
          let partnerTokenAccountBalance = await getAccountBalance(
            partnerTokenAccount,
            provider,
          );
          expect(partnerTokenAccountBalance).to.equal(
            (referralAmount * defaultShareBps) / 10000,
          );
        });

        it("raised if project admin token account is wrong", async () => {
          try {
            let partnerTokenAccount = await createTokenAccount(
              token,
              tokenProgram.programId,
              partner.publicKey,
              provider,
            );

            await program.methods
              .claimV2() // Changed to V2 method
              .accountsStrict({
                payer: admin.payer.publicKey,
                admin: admin.payer.publicKey,
                partner: partner.publicKey,
                project: projectPubkey,
                projectAdminTokenAccount: partnerTokenAccount,
                referralAccount: referralAccountPubkey,
                referralTokenAccount,
                partnerTokenAccount,
                mint: token,
                tokenProgram: tokenProgram.programId,
                systemProgram: anchor.web3.SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              })
              .signers([admin.payer])
              .rpc();

            expect(false, "should've failed but didn't").to.be.true;
          } catch (_err) {
            expect(_err).to.be.instanceOf(AnchorError);
            const err: AnchorError = _err;
            expect(err.error.errorCode.code).to.equal("ConstraintTokenOwner");
          }
        });

        it("raised if partner token account is wrong", async () => {
          try {
            let projectAdminTokenAccount = await createTokenAccount(
              token,
              tokenProgram.programId,
              admin.payer.publicKey,
              provider,
            );

            await program.methods
              .claimV2()
              .accountsStrict({
                payer: admin.payer.publicKey,
                admin: admin.payer.publicKey,
                partner: partner.publicKey,
                project: projectPubkey,
                projectAdminTokenAccount,
                referralAccount: referralAccountPubkey,
                referralTokenAccount,
                partnerTokenAccount: projectAdminTokenAccount,
                mint: token,
                tokenProgram: tokenProgram.programId,
                systemProgram: anchor.web3.SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              })
              .signers([admin.payer])
              .rpc();

            expect(true, "should've failed but didn't").to.be.true;
          } catch (_err) {
            expect(_err).to.be.instanceOf(AnchorError);
            const err: AnchorError = _err;
            expect(err.error.errorCode.code).to.equal("ConstraintTokenOwner");
          }
        });

        it("raised if referral token account is wrong", async () => {
          let projectAdminTokenAccount = await createTokenAccount(
            token,
            tokenProgram.programId,
            admin.payer.publicKey,
            provider,
          );
          let partnerTokenAccount = await createTokenAccount(
            token,
            tokenProgram.programId,
            partner.publicKey,
            provider,
          );

          try {
            await program.methods
              .claimV2() // Changed to V2 method
              .accountsStrict({
                payer: admin.payer.publicKey,
                admin: admin.payer.publicKey,
                partner: partner.publicKey,
                project: projectPubkey,
                projectAdminTokenAccount,
                referralAccount: referralAccountPubkey,
                referralTokenAccount: projectAdminTokenAccount,
                partnerTokenAccount,
                mint: token,
                tokenProgram: tokenProgram.programId,
                systemProgram: anchor.web3.SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
              })
              .signers([admin.payer])
              .rpc();

            expect(false, "should've failed but didn't").to.be.true;
          } catch (_err) {
            expect(_err).to.be.instanceOf(AnchorError);
            const err: AnchorError = _err;
            // Not ConstraintSeeds anymore because its just an ATA now
            expect(err.error.errorCode.code).to.equal("ConstraintTokenOwner");
          }
        });

        it("Is able to claim all with V2!", async () => {
          // Get latest blockhash
          const blockhash = (await provider.connection.getLatestBlockhash())
            .blockhash;

          // Fetch referral and project accounts
          const referralAccount = await program.account.referralAccount.fetch(
            referralAccountPubkey,
          );
          const project = await program.account.project.fetch(
            referralAccount.project,
          );

          // Get token accounts (both SPL and Token-2022)
          const { tokenAccounts, token2022Accounts } = await Promise.all([
            provider.connection.getTokenAccountsByOwner(referralAccountPubkey, {
              programId: TOKEN_PROGRAM_ID,
            }),
            provider.connection.getTokenAccountsByOwner(referralAccountPubkey, {
              programId: TOKEN_2022_PROGRAM_ID,
            }),
          ]).then(([spl, token2022]) => ({
            tokenAccounts: spl.value,
            token2022Accounts: token2022.value,
          }));

          // Process tokens in chunks
          const vtTxs = await Promise.all(
            [tokenAccounts, token2022Accounts].map(async (accounts, idx) => {
              const tokenProgramId =
                idx === 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

              const tokensWithAmount = accounts.filter((item) => {
                const decoded = AccountLayout.decode(
                  new Uint8Array(item.account.data),
                );
                return decoded.amount > 0 && decoded.state === 1;
              });

              const claimParams = await Promise.all(
                tokensWithAmount.map(async (token) => {
                  const preInstructions: TransactionInstruction[] = [];
                  const mint = new PublicKey(token.account.data.slice(0, 32));

                  const partnerTokenAccount = getAssociatedTokenAddressSync(
                    mint,
                    referralAccount.partner,
                    true,
                    tokenProgramId,
                  );
                  preInstructions.push(
                    createAssociatedTokenAccountIdempotentInstruction(
                      admin.payer.publicKey,
                      partnerTokenAccount,
                      referralAccount.partner,
                      mint,
                      tokenProgramId,
                    ),
                  );

                  const projectAdminTokenAccount =
                    getAssociatedTokenAddressSync(
                      mint,
                      admin.payer.publicKey,
                      true,
                      tokenProgramId,
                    );
                  const ix = await program.methods
                    .createAdminTokenAccount()
                    .accounts({
                      admin: admin.payer.publicKey,
                      mint,
                      project: projectPubkey,
                      projectAdminTokenAccount,
                      tokenProgram: tokenProgramId,
                      projectAuthority: projectAuthorityPubkey,
                    })
                    .instruction();

                  preInstructions.push(ix);

                  return {
                    projectAdminTokenAccount,
                    partnerTokenAccount,
                    preInstructions,
                    mint,
                    referralTokenAccount: token.pubkey,
                  };
                }),
              );

              const txs: VersionedTransaction[] = [];
              let instructions: TransactionInstruction[] = [];
              let chunk = 0;

              for (const params of claimParams) {
                const tx = await program.methods
                  .claimV2()
                  .accounts({
                    payer: admin.payer.publicKey,
                    project: referralAccount.project,
                    admin: project.admin,
                    projectAdminTokenAccount: params.projectAdminTokenAccount,
                    referralAccount: referralAccountPubkey,
                    referralTokenAccount: params.referralTokenAccount,
                    partner: referralAccount.partner,
                    partnerTokenAccount: params.partnerTokenAccount,
                    mint: params.mint,
                    tokenProgram: tokenProgramId,
                    systemProgram: SystemProgram.programId,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                  })
                  .preInstructions(params.preInstructions)
                  .transaction();

                instructions.push(...tx.instructions);
                chunk += 1;

                if (chunk === 2) {
                  const messageV0 = new TransactionMessage({
                    payerKey: admin.payer.publicKey,
                    instructions,
                    recentBlockhash: blockhash,
                  }).compileToV0Message();

                  txs.push(new VersionedTransaction(messageV0));
                  chunk = 0;
                  instructions = [];
                }
              }
              if (instructions.length > 0) {
                const messageV0 = new TransactionMessage({
                  payerKey: admin.payer.publicKey,
                  instructions,
                  recentBlockhash: blockhash,
                }).compileToV0Message();

                txs.push(new VersionedTransaction(messageV0));
              }

              return txs;
            }),
          );

          // Execute all transactions
          const allTxs = vtTxs.flat();
          console.log(`Executing ${allTxs.length} transactions`);

          expect(allTxs.length).to.be.greaterThan(
            1,
            "Should create at least one transaction for > 3 claims",
          );

          for (const tx of allTxs) {
            await provider.sendAndConfirm(tx);
          }

          // Small delay to ensure all transactions are confirmed
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const [
            referralBalance,
            extraReferralBalance,
            extraReferralBalance2,
            adminBalance,
            adminExtraBalance,
            adminExtraBalance2,
            partnerBalance,
            partnerExtraBalance,
            partnerExtraBalance2,
          ] = await Promise.all([
            getAccountBalance(referralTokenAccount, provider),
            getAccountBalance(extraReferralTokenAccount, provider),
            getAccountBalance(extraReferralTokenAccount2, provider),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                token,
                admin.payer.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                extraToken,
                admin.payer.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                extraToken2,
                admin.payer.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                token,
                partner.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                extraToken,
                partner.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                extraToken2,
                partner.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
          ]);

          // All referral accounts should be empty
          expect(referralBalance).to.equal(0);
          expect(extraReferralBalance).to.equal(0);
          expect(extraReferralBalance2).to.equal(0);

          // Admin should have received their share (20%)
          const expectedAdminShare =
            (referralAmount * (10000 - defaultShareBps)) / 10000;
          expect(adminBalance).to.equal(expectedAdminShare);
          expect(adminExtraBalance).to.equal(expectedAdminShare);
          expect(adminExtraBalance2).to.equal(expectedAdminShare);

          // Partner should have received their share (80%)
          const expectedPartnerShare =
            (referralAmount * defaultShareBps) / 10000;
          expect(partnerBalance).to.equal(expectedPartnerShare);
          expect(partnerExtraBalance).to.equal(expectedPartnerShare);
          expect(partnerExtraBalance2).to.equal(expectedPartnerShare);
        });

        it("Is able to claim partially with V2!", async () => {
          // Create and fund multiple token accounts
          const token2 = await createTokenMint(tokenProgram, provider);
          const token3 = await createTokenMint(tokenProgram, provider);

          const referralTokenAccount2 =
            await createAssociatedTokenAccountWithOffCurve(
              token2,
              tokenProgram.programId,
              referralAccountPubkey,
              provider,
            );
          const referralTokenAccount3 =
            await createAssociatedTokenAccountWithOffCurve(
              token3,
              tokenProgram.programId,
              referralAccountPubkey,
              provider,
            );

          // Fund all accounts with same amount
          await Promise.all([
            fundTokenAccount(
              referralTokenAccount2,
              token2,
              admin.payer,
              referralAmount,
              tokenProgram,
            ),
            fundTokenAccount(
              referralTokenAccount3,
              token3,
              admin.payer,
              referralAmount,
              tokenProgram,
            ),
          ]);

          // Get initial balances
          const initialBalances = await Promise.all([
            getAccountBalance(referralTokenAccount, provider),
            getAccountBalance(referralTokenAccount2, provider),
            getAccountBalance(referralTokenAccount3, provider),
          ]);

          // Verify initial state
          initialBalances.forEach((balance) => {
            expect(balance).to.equal(referralAmount);
          });

          // Only claim tokens 1 and 2, leaving token 3 untouched
          const tokensToWithdraw = [
            referralTokenAccount,
            referralTokenAccount2,
          ];

          const blockhash = (await provider.connection.getLatestBlockhash())
            .blockhash;

          // Get accounts info for processing
          const accountsInfo =
            await provider.connection.getMultipleAccountsInfo(tokensToWithdraw);

          // Process in chunks of 4 (matching SDK behavior)
          const claimInstructions: TransactionInstruction[] = [];

          for (const accountInfo of accountsInfo) {
            const tokenProgramId = accountInfo.owner;
            const tokenAccountData = AccountLayout.decode(
              new Uint8Array(accountInfo.data),
            );
            const mint = new PublicKey(tokenAccountData.mint);

            // Create partner token account
            const partnerTokenAccount = getAssociatedTokenAddressSync(
              mint,
              partner.publicKey,
              true,
              tokenProgramId,
            );
            claimInstructions.push(
              createAssociatedTokenAccountIdempotentInstruction(
                admin.payer.publicKey,
                partnerTokenAccount,
                partner.publicKey,
                mint,
                tokenProgramId,
              ),
            );

            // Create admin token account
            const projectAdminTokenAccount = getAssociatedTokenAddressSync(
              mint,
              admin.payer.publicKey,
              true,
              tokenProgramId,
            );
            const ix = await program.methods
              .createAdminTokenAccount()
              .accounts({
                admin: admin.payer.publicKey,
                mint,
                project: projectPubkey,
                projectAdminTokenAccount,
                tokenProgram: tokenProgramId,
                projectAuthority: projectAuthorityPubkey,
              })
              .instruction();

            claimInstructions.push(ix);

            // Add claim instruction
            const tx = await program.methods
              .claimV2()
              .accounts({
                payer: admin.payer.publicKey,
                admin: admin.payer.publicKey,
                partner: partner.publicKey,
                project: projectPubkey,
                projectAdminTokenAccount,
                referralAccount: referralAccountPubkey,
                referralTokenAccount:
                  tokensToWithdraw[accountsInfo.indexOf(accountInfo)],
                partnerTokenAccount,
                mint,
                tokenProgram: tokenProgramId,
                systemProgram: SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              })
              .transaction();

            claimInstructions.push(...tx.instructions);
          }

          // Execute transaction
          const messageV0 = new TransactionMessage({
            payerKey: admin.payer.publicKey,
            instructions: claimInstructions,
            recentBlockhash: blockhash,
          }).compileToV0Message();

          const tx = new VersionedTransaction(messageV0);
          await provider.sendAndConfirm(tx);

          // Verify final balances
          const [
            finalBalance1,
            finalBalance2,
            finalBalance3,
            adminBalance1,
            adminBalance2,
            partnerBalance1,
            partnerBalance2,
          ] = await Promise.all([
            getAccountBalance(referralTokenAccount, provider),
            getAccountBalance(referralTokenAccount2, provider),
            getAccountBalance(referralTokenAccount3, provider),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                token,
                admin.payer.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                token2,
                admin.payer.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                token,
                partner.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
            getAccountBalance(
              getAssociatedTokenAddressSync(
                token2,
                partner.publicKey,
                true,
                tokenProgram.programId,
              ),
              provider,
            ),
          ]);

          // Claimed tokens should be empty
          expect(finalBalance1).to.equal(0);
          expect(finalBalance2).to.equal(0);
          // Unclaimed token should be untouched
          expect(finalBalance3).to.equal(referralAmount);

          // Verify correct distribution for claimed tokens
          [adminBalance1, adminBalance2].forEach((balance) => {
            expect(balance).to.equal(
              (referralAmount * (10000 - defaultShareBps)) / 10000,
            );
          });

          [partnerBalance1, partnerBalance2].forEach((balance) => {
            expect(balance).to.equal(
              (referralAmount * defaultShareBps) / 10000,
            );
          });
        });
      });
    });
  });
});
