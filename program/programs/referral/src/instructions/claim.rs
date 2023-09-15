use crate::{
    events::ClaimEvent, ProgramErrorCode, Project, ReferralAccount, PROJECT_SEED, REFERRAL_ATA_SEED,
};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

const DENOMINATOR: u128 = 10_000;

pub fn claim(ctx: Context<Claim>) -> Result<()> {
    let accounts = &ctx.accounts;

    let token_account_balance = accounts.referral_token_account.amount;
    let referral_amount: u64 = u128::from(token_account_balance)
        .checked_mul(u128::from(accounts.referral_account.share_bps))
        .ok_or(ProgramErrorCode::InvalidCalculation)?
        .checked_div(DENOMINATOR)
        .ok_or(ProgramErrorCode::InvalidCalculation)?
        .try_into()
        .unwrap();

    let project_amount = token_account_balance.checked_sub(referral_amount).unwrap();
    let mint = &ctx.accounts.mint;

    let bump = *ctx.bumps.get("project").unwrap();
    let signer_seeds: &[&[&[u8]]] = &[&[PROJECT_SEED, accounts.project.base.as_ref(), &[bump]]];

    if referral_amount > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                accounts.token_program.to_account_info(),
                TransferChecked {
                    from: accounts.referral_token_account.to_account_info(),
                    mint: accounts.mint.to_account_info(),
                    to: accounts.partner_token_account.to_account_info(),
                    authority: accounts.project.to_account_info(),
                },
                signer_seeds,
            ),
            referral_amount,
            mint.decimals,
        )?;
    }

    if project_amount > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                accounts.token_program.to_account_info(),
                TransferChecked {
                    from: accounts.referral_token_account.to_account_info(),
                    mint: accounts.mint.to_account_info(),
                    to: accounts.project_admin_token_account.to_account_info(),
                    authority: accounts.project.to_account_info(),
                },
                signer_seeds,
            ),
            project_amount,
            mint.decimals,
        )?;
    }

    emit!(ClaimEvent {
        project: ctx.accounts.project.key(),
        project_admin_token_account: ctx.accounts.project_admin_token_account.key(),
        referral_account: ctx.accounts.referral_account.key(),
        referral_token_account: ctx.accounts.referral_token_account.key(),
        partner_token_account: ctx.accounts.partner_token_account.key(),
        mint: ctx.accounts.mint.key(),
        referral_amount: referral_amount,
        project_amount: project_amount
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        has_one = admin,
        seeds = [PROJECT_SEED, project.base.key().as_ref()],
        bump,
    )]
    project: Account<'info, Project>,
    admin: SystemAccount<'info>,
    #[account(
        mut,
        token::authority = admin,
        token::mint = mint,
        token::token_program = token_program,
    )]
    project_admin_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        has_one = project,
        has_one = partner
    )]
    referral_account: Account<'info, ReferralAccount>,
    #[account(
        mut,
        seeds = [REFERRAL_ATA_SEED, referral_account.key().as_ref(), mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = project
    )]
    referral_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    partner: SystemAccount<'info>,
    #[account(
        mut,
        token::authority = partner,
        token::mint = mint,
        token::token_program = token_program,
    )]
    partner_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    mint: Box<InterfaceAccount<'info, Mint>>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
}
