use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{
    events::InitializeReferralTokenAccountEvent, Project, ReferralAccount, PROJECT_SEED,
    REFERRAL_ATA_SEED,
};

pub fn initialize_referral_token_account(
    ctx: Context<InitializeReferralTokenAccount>,
) -> Result<()> {
    emit!(InitializeReferralTokenAccountEvent {
        project: ctx.accounts.project.key(),
        referral_account: ctx.accounts.referral_account.key(),
        referral_token_account: ctx.accounts.referral_token_account.key(),
        mint: ctx.accounts.mint.key(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeReferralTokenAccount<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        seeds = [PROJECT_SEED, project.base.key().as_ref()],
        bump,
    )]
    project: Account<'info, Project>,
    #[account(
        has_one = project
    )]
    referral_account: Account<'info, ReferralAccount>,
    #[account(
        init,
        payer = payer,
        seeds = [REFERRAL_ATA_SEED, referral_account.key().as_ref(), mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = project
    )]
    referral_token_account: InterfaceAccount<'info, TokenAccount>,
    mint: InterfaceAccount<'info, Mint>,
    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
}
