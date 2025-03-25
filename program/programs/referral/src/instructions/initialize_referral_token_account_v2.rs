use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    events::InitializeReferralTokenAccountEvent, Project, ReferralAccount, PROJECT_SEED,
    REFERRAL_SEED,
};

pub fn initialize_referral_token_account_v2(
    ctx: Context<InitializeReferralTokenAccountV2>,
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
pub struct InitializeReferralTokenAccountV2<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        seeds = [PROJECT_SEED, project.base.key().as_ref()],
        bump,
    )]
    project: Account<'info, Project>,
    #[account(
        has_one = project,
        constraint = referral_account.name.is_some(),
        seeds = [REFERRAL_SEED, project.key().as_ref(), referral_account.name.as_ref().unwrap().as_bytes()],
        bump
    )]
    referral_account: Account<'info, ReferralAccount>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = referral_account,
        associated_token::token_program = token_program
    )]
    referral_token_account: InterfaceAccount<'info, TokenAccount>,
    mint: InterfaceAccount<'info, Mint>,
    system_program: Program<'info, System>,
    associated_token_program: Program<'info, AssociatedToken>,
    token_program: Interface<'info, TokenInterface>,
}
