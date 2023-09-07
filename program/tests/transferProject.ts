import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import { fundAccount } from "./helpers/helpers";

describe("transfer project", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Referral as Program<Referral>;
  const admin = anchor.workspace.Referral.provider.wallet;
  let base: anchor.web3.Keypair;
  let newAdmin: anchor.web3.Keypair;
  let projectPubkey: anchor.web3.PublicKey;
  let projectName = "Referral";
  let defaultShareBps = 5000;

  beforeEach(async () => {
    base = anchor.web3.Keypair.generate();
    newAdmin = anchor.web3.Keypair.generate();
    fundAccount(newAdmin.publicKey, provider);

    const [projectProgramAddress] =
      await anchor.web3.PublicKey.findProgramAddress(
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
  });

  it("able to transfer project!", async () => {
    await program.methods
      .transferProject({})
      .accounts({
        admin: admin.payer.publicKey,
        newAdmin: newAdmin.publicKey,
        project: projectPubkey,
      })
      .signers([admin.payer])
      .rpc();

    const project = await program.account.project.fetch(projectPubkey);
    expect(project.base).to.eql(base.publicKey);
    expect(project.admin).to.eql(newAdmin.publicKey);
    expect(project.name).to.eql(projectName);
    expect(project.defaultShareBps).to.eql(defaultShareBps);
  });

  it("failed if admin is not signer", async () => {
    try {
      await program.methods
        .transferProject({})
        .accounts({
          admin: newAdmin.publicKey,
          newAdmin: newAdmin.publicKey,
          project: projectPubkey,
        })
        .signers([newAdmin])
        .rpc();

      chai.assert(false, "shold've failed but didn't");
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.code).to.equal("ConstraintHasOne");
      expect(err.error.origin).to.equal("project");
    }
  });
});
