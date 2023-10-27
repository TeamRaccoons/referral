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
      describe("close referral token account", () => {
        let base: anchor.web3.Keypair;
        let partner: anchor.web3.Keypair;
        let projectPubkey: anchor.web3.PublicKey;
        let referralAccountKeypair: anchor.web3.Keypair;
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
            .accounts({
              base: base.publicKey,
              admin: admin.payer.publicKey,
              project: projectPubkey,
            })
            .signers([base, admin.payer])
            .rpc();

          referralAccountKeypair = anchor.web3.Keypair.generate();

          await program.methods
            .initializeReferralAccount({})
            .accounts({
              payer: partner.publicKey,
              project: projectPubkey,
              partner: partner.publicKey,
              referralAccount: referralAccountKeypair.publicKey,
            })
            .signers([partner, referralAccountKeypair])
            .rpc();

          token = await createTokenMint(tokenProgram, provider);

          const [referralTokenAccountProgramAddress] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [
                Buffer.from("referral_ata"),
                referralAccountKeypair.publicKey.toBuffer(),
                token.toBuffer(),
              ],
              program.programId,
            );

          referralTokenAccount = referralTokenAccountProgramAddress;

          await program.methods
            .initializeReferralTokenAccount()
            .accounts({
              payer: admin.payer.publicKey,
              referralAccount: referralAccountKeypair.publicKey,
              referralTokenAccount,
              project: projectPubkey,
              mint: token,
              tokenProgram: tokenProgram.programId,
            })
            .signers([admin.payer])
            .rpc();
        });

        it("Is able to close referral token account!", async () => {
          await program.methods
            .closeReferralTokenAccount()
            .accounts({
              admin: admin.payer.publicKey,
              project: projectPubkey,
              referralAccount: referralAccountKeypair.publicKey,
              referralTokenAccount,
              partner: partner.publicKey,
              mint: token,
              tokenProgram: tokenProgram.programId,
            })
            .signers([admin.payer])
            .rpc();

          try {
            await getAccountBalance(referralTokenAccount, provider);
            chai.assert(false, "should've failed but didn't");
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
