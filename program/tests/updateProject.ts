import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import { fundAccount } from "./helpers/helpers";

describe("update project", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Referral as Program<Referral>;
  const admin = anchor.workspace.Referral.provider.wallet;
  let base: anchor.web3.Keypair;
  let partner: anchor.web3.Keypair;
  let projectPubkey: anchor.web3.PublicKey;
  let referralAccountPubkey: anchor.web3.PublicKey;
  let projectName = "Referral";
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
        payer: admin.payer.publicKey,
        base: base.publicKey,
        admin: admin.payer.publicKey,
        project: projectPubkey,
      })
      .signers([base, admin.payer])
      .rpc();

    const [referralAccountProgramAddress] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("referral"),
          projectPubkey.toBuffer(),
          partner.publicKey.toBuffer(),
        ],
        program.programId,
      );

    referralAccountPubkey = referralAccountProgramAddress;
  });

  it("Is able to update project!", async () => {
    const updatedName = "New Name";
    const updateDefaultShareBps = 1000;

    await program.methods
      .updateProject({
        name: updatedName,
        defaultShareBps: updateDefaultShareBps,
      })
      .accounts({
        project: projectPubkey,
        admin: admin.payer.publicKey,
      })
      .signers([admin.payer])
      .rpc();

    const project = await program.account.project.fetch(projectPubkey);
    expect(project.name).to.eql(updatedName);
    expect(project.defaultShareBps).to.eql(updateDefaultShareBps);
  });

  it("Is able to update project name only!", async () => {
    const updatedName = "New Name";

    await program.methods
      .updateProject({
        name: updatedName,
        defaultShareBps: null,
      })
      .accounts({
        project: projectPubkey,
        admin: admin.payer.publicKey,
      })
      .signers([admin.payer])
      .rpc();

    const project = await program.account.project.fetch(projectPubkey);
    expect(project.name).to.eql(updatedName);
    expect(project.defaultShareBps).to.eql(defaultShareBps);
  });

  it("Is able to update default share bps only!", async () => {
    const updateDefaultShareBps = 1000;

    await program.methods
      .updateProject({
        name: null,
        defaultShareBps: updateDefaultShareBps,
      })
      .accounts({
        project: projectPubkey,
        admin: admin.payer.publicKey,
      })
      .signers([admin.payer])
      .rpc();

    const project = await program.account.project.fetch(projectPubkey);
    expect(project.name).to.eql(projectName);
    expect(project.defaultShareBps).to.eql(updateDefaultShareBps);
  });

  it("will failed if signer is not admin!", async () => {
    const updateDefaultShareBps = 1000;

    try {
      await program.methods
        .updateProject({
          name: null,
          defaultShareBps: updateDefaultShareBps,
        })
        .accounts({
          project: projectPubkey,
          admin: partner.publicKey,
        })
        .signers([partner])
        .rpc();

      chai.assert(false, "shold've failed but didn't");
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.code).to.equal("ConstraintHasOne");
    }
  });
});
