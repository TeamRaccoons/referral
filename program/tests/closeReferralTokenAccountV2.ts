import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SPL_TOKEN_PROGRAM_ID, splTokenProgram } from "@coral-xyz/spl-token";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import {
    createTokenMint,
    fundAccount,
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
            describe("close referral token account v2", () => {
                let base: anchor.web3.Keypair;
                let partner: anchor.web3.Keypair;
                let projectPubkey: anchor.web3.PublicKey;
                // Added referral name for named referral account
                let referralName = "TestReferral";
                // Changed from referralAccountKeypair to referralAccountPubkey (PDA)
                let referralAccountPubkey: anchor.web3.PublicKey;
                let projectName = "Referral";
                let referralTokenAccount: anchor.web3.PublicKey;
                let token: anchor.web3.PublicKey;
                let referralAmount = 1e8;
                let defaultShareBps = 5000;

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
                });

                it("Is able to close referral token account v2!", async () => {
                    await program.methods
                        .closeReferralTokenAccountV2()
                        .accountsStrict({
                            admin: admin.payer.publicKey,
                            project: projectPubkey,
                            referralAccount: referralAccountPubkey,
                            referralTokenAccount,
                            partner: partner.publicKey,
                            mint: token,
                            tokenProgram: tokenProgram.programId,
                        })
                        .signers([admin.payer])
                        .rpc();

                    // Verify account is closed by trying to get its balance
                    try {
                        await getAccountBalance(referralTokenAccount, provider);
                        expect(false, "should've failed but didn't").to.be.true;
                    } catch (err) {
                        expect(err.toString()).to.includes(
                            "SolanaJSONRPCError: failed to get token account balance: Invalid param: could not find account",
                        );
                    }
                });
            });
        });
    });
});