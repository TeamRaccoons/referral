import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

import { Referral } from "../target/types/referral";
import { fundAccount } from "./helpers/helpers";

describe("initialize referral account", () => {
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

    referralAccountKeypair = anchor.web3.Keypair.generate();
  });

  it("Is initialized!", async () => {
    await program.methods
      .initializeReferralAccount({})
      .accounts({
        payer: admin.payer.publicKey,
        partner: partner.publicKey,
        project: projectPubkey,
        referralAccount: referralAccountKeypair.publicKey,
      })
      .signers([admin.payer, referralAccountKeypair])
      .rpc();

    const referralAccount = await program.account.referralAccount.fetch(
      referralAccountKeypair.publicKey,
    );
    expect(referralAccount.partner).to.eql(partner.publicKey);
    expect(referralAccount.project).to.eql(projectPubkey);
    expect(referralAccount.shareBps).to.eql(defaultShareBps);
    expect(referralAccount.name).to.eql(null);
  });
});
