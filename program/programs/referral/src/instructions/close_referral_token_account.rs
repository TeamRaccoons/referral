use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, CloseAccount, Mint, TokenAccount, TokenInterface,
};

use crate::{Project, ReferralAccount, PROJECT_SEED, REFERRAL_ATA_SEED};

pub fn close_referral_token_account(ctx: Context<CloseReferralTokenAccount>) -> Result<()> {
    let bump = *ctx.bumps.get("project").unwrap();
    let signer_seeds: &[&[&[u8]]] = &[&[PROJECT_SEED, ctx.accounts.project.base.as_ref(), &[bump]]];

    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.referral_token_account.to_account_info(),
            destination: ctx.accounts.partner.to_account_info(),
            authority: ctx.accounts.project.to_account_info(),
        },
        signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct CloseReferralTokenAccount<'info> {
    #[account(mut)]
    admin: Signer<'info>,
    #[account(
        has_one = admin,
        seeds = [PROJECT_SEED, project.base.key().as_ref()],
        bump,
    )]
    project: Account<'info, Project>,
    #[account(
        has_one = project,
        has_one = partner
    )]
    referral_account: Account<'info, ReferralAccount>,
    #[account(
        mut,
        seeds = [REFERRAL_ATA_SEED, referral_account.key().as_ref(), mint.key().as_ref()],
        bump,
        token::authority = project,
        token::mint = mint,
        token::token_program = token_program,
    )]
    referral_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    partner: SystemAccount<'info>,
    mint: InterfaceAccount<'info, Mint>,
    token_program: Interface<'info, TokenInterface>,
}
