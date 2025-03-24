import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { SPL_TOKEN_PROGRAM_ID, splTokenProgram } from "@coral-xyz/spl-token";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import {
    createTokenAccount,
    createTokenMint,
    fundAccount,
    fundTokenAccount,
    getAccountBalance,
} from "./helpers/helpers";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

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
                let projectAdminTokenAccount: anchor.web3.PublicKey;
                let referralTokenAccount: anchor.web3.PublicKey;
                let partnerTokenAccount: anchor.web3.PublicKey;
                let token: anchor.web3.PublicKey;
                let referralAmount = 1e8;
                let defaultShareBps = 2000;

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
                                Buffer.from(referralName)
                            ],
                            program.programId
                        );

                    referralAccountPubkey = referralAccountPda;

                    await program.methods
                        .initializeReferralAccountWithName({
                            name: referralName
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
                    projectAdminTokenAccount = await createTokenAccount(
                        token,
                        tokenProgram.programId,
                        admin.payer.publicKey,
                        provider,
                    );
                    partnerTokenAccount = await createTokenAccount(
                        token,
                        tokenProgram.programId,
                        partner.publicKey,
                        provider,
                    );

                    const [referralTokenAccountProgramAddress] =
                        anchor.web3.PublicKey.findProgramAddressSync(
                            [
                                Buffer.from("referral_ata"),
                                referralAccountPubkey.toBuffer(),
                                token.toBuffer(),
                            ],
                            program.programId,
                        );

                    referralTokenAccount = referralTokenAccountProgramAddress;

                    await program.methods
                        .initializeReferralTokenAccountV2()
                        .accountsStrict({
                            payer: admin.payer.publicKey,
                            referralAccount: referralAccountPubkey,
                            referralTokenAccount,
                            project: projectPubkey,
                            mint: token,
                            tokenProgram: tokenProgram.programId,
                            systemProgram: anchor.web3.SystemProgram.programId,
                        })
                        .signers([admin.payer])
                        .rpc();

                    await fundTokenAccount(
                        referralTokenAccount,
                        token,
                        admin.payer,
                        referralAmount,
                        tokenProgram,
                    );
                });

                it("Is able to claim using V2!", async () => {
                    let referralTokenAccountBalance = await getAccountBalance(
                        referralTokenAccount,
                        provider,
                    );
                    expect(referralTokenAccountBalance).to.equal(referralAmount);
                    let projectAdminTokenAccountBalance = await getAccountBalance(
                        projectAdminTokenAccount,
                        provider,
                    );
                    expect(projectAdminTokenAccountBalance).to.equal(0);
                    let partnerTokenAccountBalance = await getAccountBalance(
                        partnerTokenAccount,
                        provider,
                    );
                    expect(partnerTokenAccountBalance).to.equal(0);

                    console.log("Claiming");
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
                        })
                        .signers([admin.payer])
                        .rpc();
                    console.log("Claimed");

                    referralTokenAccountBalance = await getAccountBalance(
                        referralTokenAccount,
                        provider,
                    );
                    expect(referralTokenAccountBalance).to.equal(0);
                    projectAdminTokenAccountBalance = await getAccountBalance(
                        projectAdminTokenAccount,
                        provider,
                    );
                    expect(projectAdminTokenAccountBalance).to.equal(
                        (referralAmount * (10000 - defaultShareBps)) / 10000,
                    );
                    partnerTokenAccountBalance = await getAccountBalance(
                        partnerTokenAccount,
                        provider,
                    );
                    expect(partnerTokenAccountBalance).to.equal(
                        (referralAmount * defaultShareBps) / 10000,
                    );
                });

                it("raised if project admin token account is wrong", async () => {
                    try {
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
                                // Added required additional programs for V2
                                systemProgram: anchor.web3.SystemProgram.programId,
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
                            })
                            .signers([admin.payer])
                            .rpc();

                        expect(false, "should've failed but didn't").to.be.true;
                    } catch (_err) {
                        expect(_err).to.be.instanceOf(AnchorError);
                        const err: AnchorError = _err;
                        expect(err.error.errorCode.code).to.equal("ConstraintSeeds");
                    }
                });
            });
        });
    });
});