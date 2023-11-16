import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SPL_TOKEN_PROGRAM_ID, splTokenProgram } from "@coral-xyz/spl-token";
import {
  createInitializeMetadataPointerInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeMintInstruction,
  createMint,
  ExtensionType,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
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
      describe("initialize referral token account", () => {
        let base: anchor.web3.Keypair;
        let partner: anchor.web3.Keypair;
        let projectPubkey: anchor.web3.PublicKey;
        let referralAccountKeypair: anchor.web3.Keypair;
        let projectName = "Referral";
        let referralTokenAccount: anchor.web3.PublicKey;
        let token: anchor.web3.PublicKey;
        let defaultShareBps = 5000;

        beforeEach(async () => {
          base = anchor.web3.Keypair.generate();
          partner = anchor.web3.Keypair.generate();
          await fundAccount(partner.publicKey, provider);

          const [projectProgramAddress] =
            anchor.web3.PublicKey.findProgramAddressSync(
              [Buffer.from("project"), base.publicKey.toBuffer()],
              program.programId,
            );

          projectPubkey = projectProgramAddress;

          await program.methods
            .initializeProject({ name: projectName, defaultShareBps })
            .accounts({
              payer: admin.payer.publicKey,
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

          if (name === "token") {
            token = await createTokenMint(tokenProgram, provider);
          } else {
            token = await createTokenMintWithMetadataPointerExtension(provider);
          }

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
        });

        it("Is initialized!", async () => {
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

          let referralTokenAccountBalance = await getAccountBalance(
            referralTokenAccount,
            provider,
          );
          expect(referralTokenAccountBalance).to.equal(0);

          const { value } = await provider.connection.getTokenAccountsByOwner(
            projectPubkey,
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

const createTokenMintWithMetadataPointerExtension = async (
  provider: anchor.AnchorProvider,
) => {
  const mintKeypair = new anchor.web3.Keypair();
  const extensions = [ExtensionType.MetadataPointer];
  const mintLen = getMintLen(extensions);
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(
    mintLen,
  );

  const transaction = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: provider.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mintKeypair.publicKey,
      provider.publicKey,
      anchor.web3.PublicKey.default,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9,
      provider.publicKey,
      anchor.web3.PublicKey.default,
      TOKEN_2022_PROGRAM_ID,
    ),
  );
  await provider.sendAndConfirm(transaction, [mintKeypair]);

  return mintKeypair.publicKey;
};
