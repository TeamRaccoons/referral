use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{Project, BPS_DENOMINATOR, PLATFORM_FEE_BPS, PROJECT_SEED, PLATFORM_ADMIN};

pub fn withdraw_project_fees(ctx: Context<WithdrawProjectFees>) -> Result<()> {
    let accounts = &ctx.accounts;
    
    // Get the token account balance
    let balance = accounts.project_token_account.amount;
    
    // Calculate splits using basis points (2000 bps = 20% to platform)
    let platform_amount = (balance as u128)
        .checked_mul(PLATFORM_FEE_BPS as u128)
        .unwrap_or(0)
        .checked_div(BPS_DENOMINATOR)
        .unwrap_or(0) as u64;
    
    let project_admin_amount = balance.checked_sub(platform_amount).unwrap_or(0);
    
    // Get project bump for PDA signing
    let bump = ctx.bumps.project;
    let signer_seeds: &[&[&[u8]]] = &[&[PROJECT_SEED, accounts.project.base.as_ref(), &[bump]]];
    
    // Transfer to platform - program authority ata
    if platform_amount > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                accounts.token_program.to_account_info(),
                TransferChecked {
                    from: accounts.project_token_account.to_account_info(),
                    mint: accounts.mint.to_account_info(),
                    to: accounts.platform_token_account.to_account_info(),
                    authority: accounts.project.to_account_info(),
                },
                signer_seeds,
            ),
            platform_amount,
            accounts.mint.decimals,
        )?;
    }
    
    // Transfer to project admin - 
    if project_admin_amount > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                accounts.token_program.to_account_info(),
                TransferChecked {
                    from: accounts.project_token_account.to_account_info(),
                    mint: accounts.mint.to_account_info(),
                    to: accounts.project_admin_token_account.to_account_info(),
                    authority: accounts.project.to_account_info(),
                },
                signer_seeds,
            ),
            project_admin_amount,
            accounts.mint.decimals,
        )?;
    }
    
    emit!(WithdrawProjectFeesEvent {
        project: accounts.project.key(),
        mint: accounts.mint.key(),
        project_token_account: accounts.project_token_account.key(),
        platform_token_account: accounts.platform_token_account.key(),
        project_admin_token_account: accounts.project_admin_token_account.key(),
        platform_amount,
        project_admin_amount,
        total_amount: balance,
    });
    
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawProjectFees<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    
    // Enforce that platform_admin is the actual platform admin or payer is the project admin
    #[account(
        constraint = (
            platform_admin.key() == PLATFORM_ADMIN && 
            *payer.key == platform_admin.key()
        ) || 
        *payer.key == project.admin
    )]
    platform_admin: SystemAccount<'info>,
    
    #[account(
        seeds = [PROJECT_SEED, project.base.key().as_ref()],
        bump,
    )]
    project: Account<'info, Project>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = project
    )]
    project_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        token::authority = platform_admin,
        token::mint = mint,
    )]
    platform_token_account: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        token::authority = project.admin,
        token::mint = mint,
    )]
    project_admin_token_account: InterfaceAccount<'info, TokenAccount>,
    
    mint: InterfaceAccount<'info, Mint>,
    
    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
    associated_token_program: Program<'info, AssociatedToken>,
}

// Define the event struct in your events.rs file
#[event]
pub struct WithdrawProjectFeesEvent {
    pub project: Pubkey,
    pub mint: Pubkey,
    pub project_token_account: Pubkey,
    pub platform_token_account: Pubkey, 
    pub project_admin_token_account: Pubkey,
    pub platform_amount: u64,
    pub project_admin_amount: u64,
    pub total_amount: u64,
} 