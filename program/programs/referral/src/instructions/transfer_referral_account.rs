use anchor_lang::prelude::*;

use crate::ReferralAccount;

pub fn transfer_referral_account(
    ctx: Context<TransferReferralAccount>,
    _params: TransferReferralAccountParams,
) -> Result<()> {
    ctx.accounts.referral_account.partner = ctx.accounts.new_partner.key();

    Ok(())
}

#[derive(Accounts)]
pub struct TransferReferralAccount<'info> {
    partner: Signer<'info>,
    new_partner: SystemAccount<'info>,
    #[account(
        mut,
        has_one = partner
    )]
    referral_account: Account<'info, ReferralAccount>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct TransferReferralAccountParams {}
