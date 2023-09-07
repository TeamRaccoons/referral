import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Referral } from "../target/types/referral";
import { createTokenMint, fundAccount } from "./helpers/helpers";
import { BN } from "bn.js";
import { splTokenProgram } from "@coral-xyz/spl-token";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

describe("create admin token account", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Referral as Program<Referral>;
  const admin = anchor.workspace.Referral.provider.wallet;
  let base: anchor.web3.Keypair;
  let partner: anchor.web3.Keypair;
  let projectPubkey: anchor.web3.PublicKey;
  let projectAuthorityPubkey: anchor.web3.PublicKey;
  let projectName = "Referral";
  let defaultShareBps = 5000;

  beforeEach(async () => {
    base = anchor.web3.Keypair.generate();
    partner = anchor.web3.Keypair.generate();
    fundAccount(partner.publicKey, provider);

    const [projectProgramAddress] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("project"), base.publicKey.toBuffer()],
        program.programId
      );

    projectPubkey = projectProgramAddress;

    const [projectAuthorityProgramAddress] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("project_authority"), base.publicKey.toBuffer()],
        program.programId
      );

    projectAuthorityPubkey = projectAuthorityProgramAddress;

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

    const depositAmount = new BN(100000000);

    const transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: admin.payer.publicKey,
        toPubkey: projectAuthorityPubkey,
        lamports: depositAmount.toNumber(),
      })
    );

    await anchor.web3.sendAndConfirmTransaction(
      program.provider.connection,
      transaction,
      [admin.payer]
    );
  });

  const TEST_PROGRAM_IDS = [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID];
  const TOKEN_PROGRAMS = TEST_PROGRAM_IDS.map((programId) =>
    splTokenProgram({
      provider,
      programId,
    })
  );

  TOKEN_PROGRAMS.forEach((tokenProgram) => {
    const name =
      tokenProgram.programId === TOKEN_PROGRAM_ID ? "token" : "token-2022";

    describe(name, () => {
      it("Is able to deposit into project!", async () => {
        const mint = await createTokenMint(tokenProgram, provider);
        const projectAdminTokenAccount = getAssociatedTokenAddressSync(
          mint,
          admin.payer.publicKey,
          true,
          tokenProgram.programId
        );

        const preBalance = await program.provider.connection.getBalance(
          projectAuthorityPubkey
        );

        await program.methods
          .createAdminTokenAccount()
          .accounts({
            admin: admin.payer.publicKey,
            mint,
            project: projectPubkey,
            projectAdminTokenAccount,
            tokenProgram: tokenProgram.programId,
            projectAuthority: projectAuthorityPubkey,
          })
          .rpc();

        const projectAdminTokenAccountInfo =
          await program.provider.connection.getParsedAccountInfo(
            projectAdminTokenAccount
          );

        const splTokenData = (
          projectAdminTokenAccountInfo.value.data as web3.ParsedAccountData
        ).parsed.info;

        expect(splTokenData.mint).to.eq(mint.toBase58());
        expect(splTokenData.owner).to.eq(admin.payer.publicKey.toBase58());
        expect(splTokenData.state).to.eq("initialized");

        const postBalance = await program.provider.connection.getBalance(
          projectAuthorityPubkey
        );

        expect(preBalance > postBalance).to.eql(true);

        // Should be able to call again without failing
        await program.methods
          .createAdminTokenAccount()
          .accounts({
            admin: admin.payer.publicKey,
            mint,
            project: projectPubkey,
            projectAdminTokenAccount,
            tokenProgram: tokenProgram.programId,
            projectAuthority: projectAuthorityPubkey,
          })
          .rpc();
      });
    });
  });
});
