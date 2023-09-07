import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import { fundAccount } from "./helpers/helpers";

describe("update referral account", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Referral as Program<Referral>;
  const admin = anchor.workspace.Referral.provider.wallet;
  let base: anchor.web3.Keypair;
  let partner: anchor.web3.Keypair;
  let projectPubkey: anchor.web3.PublicKey;
  let referralAccountKeypair: anchor.web3.Keypair;
  let projectName = "Referral";
  let defaultShareBps = 5000;

  beforeEach(async () => {
    base = anchor.web3.Keypair.generate();
    partner = anchor.web3.Keypair.generate();
    fundAccount(partner.publicKey, provider);

    const [projectProgramAddress] =
      await anchor.web3.PublicKey.findProgramAddressSync(
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
  });

  it("Is able to update project!", async () => {
    const updateShareBps = 1000;

    await program.methods
      .updateReferralAccount({
        shareBps: updateShareBps,
      })
      .accounts({
        project: projectPubkey,
        referralAccount: referralAccountKeypair.publicKey,
        admin: admin.payer.publicKey,
      })
      .signers([admin.payer])
      .rpc();

    const referralAccount = await program.account.referralAccount.fetch(
      referralAccountKeypair.publicKey,
    );
    expect(referralAccount.shareBps).to.eql(updateShareBps);
  });

  it("will failed if signer is not admin!", async () => {
    const updateShareBps = 1000;

    try {
      await program.methods
        .updateReferralAccount({
          shareBps: updateShareBps,
        })
        .accounts({
          project: projectPubkey,
          referralAccount: referralAccountKeypair.publicKey,
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
