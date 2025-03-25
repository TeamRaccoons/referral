import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SPL_TOKEN_PROGRAM_ID, splTokenProgram } from "@coral-xyz/spl-token";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import {
    createTokenMint,
    fundAccount,
    getAccountBalance,
    createTokenAccount,
    fundTokenAccount,
} from "./helpers/helpers";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";


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
            describe("initialize referral token account v2", () => {
                let base: anchor.web3.Keypair;
                let partner: anchor.web3.Keypair;
                let projectPubkey: anchor.web3.PublicKey;
                let projectName = "Referral";
                let referralName = "TestReferral";
                let referralTokenAccount: anchor.web3.PublicKey;
                let token: anchor.web3.PublicKey;
                let referralAmount = 1e8;
                let defaultShareBps = 5000;
                let referralAccountPubkey: anchor.web3.PublicKey;

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

                    referralTokenAccount = getAssociatedTokenAddressSync(
                        token,
                        referralAccountPubkey,
                        true,
                        tokenProgram.programId,
                    );
                });

                it("Is initialized!", async () => {
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
                            associatedTokenProgram: ASSOCIATED_PROGRAM_ID
                        })
                        .signers([admin.payer])
                        .rpc();

                    // Verify initial balance is zero
                    let referralTokenAccountBalance = await getAccountBalance(
                        referralTokenAccount,
                        provider,
                    );
                    expect(referralTokenAccountBalance).to.equal(0);

                    const { value } = await provider.connection.getTokenAccountsByOwner(
                        referralAccountPubkey,
                        {
                            mint: token,
                        },
                    );

                    const accountExist = value.find(({ pubkey }) =>
                        pubkey.equals(referralTokenAccount),
                    );
                    expect(accountExist.pubkey).to.eql(referralTokenAccount);
                });
            });
        });
    });
});