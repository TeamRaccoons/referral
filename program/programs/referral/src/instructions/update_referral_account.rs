use anchor_lang::prelude::*;

use crate::{events::UpdateReferralAccountEvent, Project, ReferralAccount};

pub fn update_referral_account(
    ctx: Context<UpdateReferralAccount>,
    params: UpdateReferralAccountParams,
) -> Result<()> {
    ctx.accounts.referral_account.share_bps = params.share_bps;

    emit!(UpdateReferralAccountEvent {
        referral_account: ctx.accounts.referral_account.key(),
        share_bps: params.share_bps,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateReferralAccount<'info> {
    admin: Signer<'info>,
    #[account(
        has_one = admin,
    )]
    project: Account<'info, Project>,
    #[account(
        mut,
        has_one = project
    )]
    referral_account: Account<'info, ReferralAccount>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct UpdateReferralAccountParams {
    pub share_bps: u16,
}
