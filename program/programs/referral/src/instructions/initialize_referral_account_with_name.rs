use anchor_lang::prelude::*;

use crate::{
    events::InitializeReferralAccountEvent, ProgramErrorCode, Project, ReferralAccount,
    PROJECT_SEED, REFERRAL_SEED,
};

pub fn initialize_referral_account_with_name(
    ctx: Context<InitializeReferralAccountWithName>,
    params: InitializeReferralAccountWithNameParams,
) -> Result<()> {
    require!(
        params.name.chars().count() < 20,
        ProgramErrorCode::NameTooLong
    );

    let share_bps = ctx.accounts.project.default_share_bps;

    ctx.accounts.referral_account.set_inner(ReferralAccount {
        partner: ctx.accounts.partner.key(),
        project: ctx.accounts.project.key(),
        share_bps: share_bps,
        name: Some(params.name.clone()),
    });

    emit!(InitializeReferralAccountEvent {
        project: ctx.accounts.project.key(),
        partner: ctx.accounts.partner.key(),
        referral_account: ctx.accounts.referral_account.key(),
        share_bps: share_bps,
        name: Some(params.name)
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(params: InitializeReferralAccountWithNameParams)]
pub struct InitializeReferralAccountWithName<'info> {
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
        seeds = [REFERRAL_SEED, project.key().as_ref(), params.name.as_ref()],
        bump,
        space = ReferralAccount::LEN
    )]
    referral_account: Account<'info, ReferralAccount>,
    system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct InitializeReferralAccountWithNameParams {
    pub name: String,
}
