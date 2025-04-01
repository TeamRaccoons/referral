import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { splTokenProgram } from "@coral-xyz/spl-token";
import { createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

import { Referral } from "../../target/types/referral";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

type TokenProgramReturnType = ReturnType<typeof splTokenProgram>;

export const program = anchor.workspace.Referral as Program<Referral>;

export const fundAccount = async (
  publicKey: anchor.web3.PublicKey,
  provider: anchor.AnchorProvider,
) => {
  const signature = await provider.connection.requestAirdrop(
    publicKey,
    anchor.web3.LAMPORTS_PER_SOL,
  );
  await provider.connection.confirmTransaction(signature);
};

export const createTokenMint = async (
  tokenProgram: TokenProgramReturnType,
  provider: anchor.AnchorProvider,
): Promise<anchor.web3.PublicKey> => {
  const mint = anchor.web3.Keypair.generate();
  const authority = provider.wallet.publicKey;
  const createMintIx = await tokenProgram.account.mint.createInstruction(mint);
  const initMintIx = await tokenProgram.methods
    .initializeMint2(0, authority, null)
    .accounts({ mint: mint.publicKey })
    .instruction();

  const tx = new anchor.web3.Transaction();
  tx.add(createMintIx, initMintIx);

  await tokenProgram.provider.sendAndConfirm(tx, [mint]);
  return mint.publicKey;
};

export const createTokenAccount = async (
  tokenMint: anchor.web3.PublicKey,
  tokenProgram: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  provider: anchor.AnchorProvider,
): Promise<anchor.web3.PublicKey> => {
  const feePayer = anchor.web3.Keypair.generate();
  await fundAccount(feePayer.publicKey, provider);

  return await createAssociatedTokenAccount(
    provider.connection,
    feePayer,
    tokenMint,
    owner,
    undefined, // Just use the default ConfirmOptions
    tokenProgram,
  );
};

export const createAssociatedTokenAccountWithOffCurve = async (
  mint: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
  provider: anchor.AnchorProvider,
) => {
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    owner,
    true,  // allowOwnerOffCurve set to true
    programId,
    ASSOCIATED_PROGRAM_ID
  );

  const tx = new anchor.web3.Transaction().add(
    createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,  // payer
      associatedToken,            // associatedToken
      owner,                      // owner
      mint,                       // mint
      programId,                  // programId
      ASSOCIATED_PROGRAM_ID      // associatedTokenProgramId
    )
  );

  await provider.sendAndConfirm(tx);
  return associatedToken;
}

export const fundTokenAccount = async (
  tokenAccount: anchor.web3.PublicKey,
  tokenMint: anchor.web3.PublicKey,
  authority: anchor.web3.Keypair,
  amount: number,
  tokenProgram: TokenProgramReturnType,
) => {
  await tokenProgram.methods
    .mintTo(new anchor.BN(amount))
    .accounts({
      mint: tokenMint,
      account: tokenAccount,
      owner: authority.publicKey,
    })
    .signers([authority])
    .rpc();
};

export const getAccountBalance = async (
  tokenAccount: anchor.web3.PublicKey,
  provider: anchor.AnchorProvider,
) => {
  const tokenBalance = await provider.connection.getTokenAccountBalance(
    tokenAccount,
  );

  return Number(tokenBalance.value.amount);
};
