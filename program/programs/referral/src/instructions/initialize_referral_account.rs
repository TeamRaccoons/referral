use anchor_lang::prelude::*;

use crate::{events::InitializeReferralAccountEvent, Project, ReferralAccount, PROJECT_SEED};

pub fn initialize_referral_account(
    ctx: Context<InitializeReferralAccount>,
    _params: InitializeReferralAccountParams,
) -> Result<()> {
    let share_bps = ctx.accounts.project.default_share_bps;

    ctx.accounts.referral_account.set_inner(ReferralAccount {
        partner: ctx.accounts.partner.key(),
        project: ctx.accounts.project.key(),
        share_bps: share_bps,
        name: None,
    });

    emit!(InitializeReferralAccountEvent {
        project: ctx.accounts.project.key(),
        partner: ctx.accounts.partner.key(),
        referral_account: ctx.accounts.referral_account.key(),
        share_bps: share_bps,
        name: None
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeReferralAccount<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    partner: SystemAccount<'info>,
    #[account(
        seeds = [PROJECT_SEED, project.base.key().as_ref()],
        bump,
    )]
    project: Account<'info, Project>,
    #[account(
        init,
        payer = payer,
        space = ReferralAccount::LEN
    )]
    referral_account: Account<'info, ReferralAccount>,
    system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct InitializeReferralAccountParams {}
