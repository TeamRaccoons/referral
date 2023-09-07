import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { assert, expect } from "chai";

import { Referral } from "../target/types/referral";
import { fundAccount } from "./helpers/helpers";

describe("initialize referral account with name", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Referral as Program<Referral>;
  const admin = anchor.workspace.Referral.provider.wallet;
  let base: anchor.web3.Keypair;
  let partner: anchor.web3.Keypair;
  let projectPubkey: anchor.web3.PublicKey;
  let projectName = "Referral";
  let defaultShareBps = 5000;
  let referralAccountName = "Name";
  let referralAccountPubkey: anchor.web3.PublicKey;

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
          Buffer.from(referralAccountName),
        ],
        program.programId,
      );

    referralAccountPubkey = referralAccountProgramAddress;
  });

  it("Is initialized!", async () => {
    await program.methods
      .initializeReferralAccountWithName({ name: referralAccountName })
      .accounts({
        payer: admin.payer.publicKey,
        partner: partner.publicKey,
        project: projectPubkey,
        referralAccount: referralAccountPubkey,
      })
      .signers([admin.payer])
      .rpc();

    const referralAccount = await program.account.referralAccount.fetch(
      referralAccountPubkey,
    );
    expect(referralAccount.partner).to.eql(partner.publicKey);
    expect(referralAccount.project).to.eql(projectPubkey);
    expect(referralAccount.shareBps).to.eql(defaultShareBps);
    expect(referralAccount.name).to.eql(referralAccountName);

    try {
      await program.methods
        .initializeReferralAccountWithName({ name: referralAccountName })
        .accounts({
          payer: admin.payer.publicKey,
          partner: partner.publicKey,
          project: projectPubkey,
          referralAccount: referralAccountPubkey,
        })
        .signers([admin.payer])
        .rpc();
      assert(false, "shold've failed but didn't");
    } catch (err) {
      expect(err.logs).include(
        `Allocate: account Address { address: ${referralAccountPubkey.toBase58()}, base: None } already in use`,
      );
    }
  });

  it("raised if project name is too long", async () => {
    const longReferralAccountName = "Very very long referral name";

    const [referralAccountProgramAddress] =
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("referral"),
          projectPubkey.toBuffer(),
          Buffer.from(longReferralAccountName),
        ],
        program.programId,
      );

    referralAccountPubkey = referralAccountProgramAddress;

    try {
      await program.methods
        .initializeReferralAccountWithName({ name: longReferralAccountName })
        .accounts({
          payer: admin.payer.publicKey,
          partner: partner.publicKey,
          project: projectPubkey,
          referralAccount: referralAccountPubkey,
        })
        .signers([admin.payer])
        .rpc();

      assert(false, "shold've failed but didn't");
    } catch (_err) {
      expect(_err).to.be.instanceOf(AnchorError);
      const err: AnchorError = _err;
      expect(err.error.errorCode.code).to.equal("NameTooLong");
    }
  });
});
