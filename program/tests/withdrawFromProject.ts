import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { Referral } from "../target/types/referral";
import { fundAccount } from "./helpers/helpers";
import { BN } from "bn.js";
import { SystemProgram, Transaction } from "@solana/web3.js";

describe("withdraw from project", () => {
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

    const depositAmount = new BN(10000000);

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

  it("Is able to withdraw from project!", async () => {
    const preWithdrawAmount = await program.provider.connection.getBalance(
      projectAuthorityPubkey
    );
    const withdrawAmount = new BN(10000);

    try {
      await program.methods
        .withdrawFromProject({ amount: withdrawAmount })
        .accounts({
          admin: admin.payer.publicKey,
          projectAuthority: projectAuthorityPubkey,
          project: projectPubkey,
        })
        .signers([admin.payer])
        .rpc();
    } catch (err) {
      console.log({ err });
    }

    const postWithdrawAmount = await program.provider.connection.getBalance(
      projectAuthorityPubkey
    );
    expect(postWithdrawAmount).to.eql(
      preWithdrawAmount - withdrawAmount.toNumber()
    );
  });

  it("raised if remaining amount less than minimum rent", async () => {
    try {
      await program.methods
        .withdrawFromProject({ amount: new BN(9999990) })
        .accounts({
          admin: admin.payer.publicKey,
          projectAuthority: projectAuthorityPubkey,
          project: projectPubkey,
        })
        .signers([admin.payer])
        .rpc();

      assert(false, "shold've failed but didn't");
    } catch (err) {
      expect(err.toString()).to.eql(
        "Error: failed to send transaction: Transaction simulation failed: Transaction results in an account (1) without insufficient funds for rent"
      );
    }
  });
});
