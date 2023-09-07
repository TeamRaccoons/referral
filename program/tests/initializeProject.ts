import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { expect } from "chai";

import { Referral } from "../target/types/referral";

describe("initialize project", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Referral as Program<Referral>;
  const admin = anchor.workspace.Referral.provider.wallet;
  let defaultShareBps = 5000;
  let base: anchor.web3.Keypair;
  let projectPubkey: anchor.web3.PublicKey;
  let projectName = "Referral";

  beforeEach(async () => {
    base = anchor.web3.Keypair.generate();

    const [projectProgramAddress] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("project"), base.publicKey.toBuffer()],
        program.programId,
      );

    projectPubkey = projectProgramAddress;
  });

  it("Is initialized!", async () => {
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

    const project = await program.account.project.fetch(projectPubkey);
    expect(project.base).to.eql(base.publicKey);
    expect(project.admin).to.eql(admin.publicKey);
    expect(project.name).to.eql(projectName);
    expect(project.defaultShareBps).to.eql(defaultShareBps);
  });

  it("raised if project name is too long", async () => {
    const longProjectName =
      "Very long project name Very long project name Very long project name";

    try {
      await program.methods
        .initializeProject({
          name: longProjectName,
          defaultShareBps,
        })
        .accounts({
          payer: admin.payer.publicKey,
          base: base.publicKey,
          admin: admin.payer.publicKey,
          project: projectPubkey,
        })
        .signers([base, admin.payer])
        .rpc();

      chai.assert(false, "shold've failed but didn't");
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.code).to.equal("NameTooLong");
    }
  });

  it("raised if default share percentage larger than 10000", async () => {
    const invalidSharePercentageBps = 10001;

    try {
      await program.methods
        .initializeProject({
          name: projectName,
          defaultShareBps: invalidSharePercentageBps,
        })
        .accounts({
          payer: admin.payer.publicKey,
          base: base.publicKey,
          admin: admin.payer.publicKey,
          project: projectPubkey,
        })
        .signers([base, admin.payer])
        .rpc();

      chai.assert(false, "shold've failed but didn't");
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.code).to.equal("InvalidSharePercentage");
    }
  });
});
