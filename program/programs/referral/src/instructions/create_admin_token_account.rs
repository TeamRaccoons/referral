use crate::{Project, PROJECT_AUTHORITY_SEED};
use anchor_lang::prelude::*;
use anchor_spl::associated_token;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenInterface};

// A convenient method that uses the project authority's SOL to create an associated token account for the admin.
pub fn create_admin_token_account(ctx: Context<CreateAdminTokenAccount>) -> Result<()> {
    let project = &ctx.accounts.project;

    let bump = *ctx.bumps.get("project_authority").unwrap();
    let signer_seeds: &[&[&[u8]]] = &[&[PROJECT_AUTHORITY_SEED, project.base.as_ref(), &[bump]]];

    associated_token::create_idempotent(CpiContext::new_with_signer(
        ctx.accounts.associated_token_program.to_account_info(),
        associated_token::Create {
            associated_token: ctx.accounts.project_admin_token_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            payer: ctx.accounts.project_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
        signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateAdminTokenAccount<'info> {
    #[account(
        has_one = admin,
    )]
    project: Account<'info, Project>,
    #[account(
        mut,
        seeds = [PROJECT_AUTHORITY_SEED, project.base.key().as_ref()],
        bump
    )]
    project_authority: SystemAccount<'info>,
    admin: SystemAccount<'info>,
    /// CHECK: ATA of the admin account
    #[account(mut)]
    project_admin_token_account: UncheckedAccount<'info>,
    mint: Box<InterfaceAccount<'info, Mint>>,
    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
    associated_token_program: Program<'info, AssociatedToken>,
}
