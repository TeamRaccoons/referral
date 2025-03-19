use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::TokenAccount,
    token_interface::{Mint, TokenInterface},
};

use crate::{events::InitializeProjectTokenAccountEvent, Project, PROJECT_SEED};

pub fn initialize_project_ata(
    ctx: Context<InitializeProjectAta>,
    _params: InitializeProjectAtaParams,
) -> Result<()> {
    emit!(InitializeProjectTokenAccountEvent {
        project: ctx.accounts.project.key(),
        admin: ctx.accounts.admin.key(),
        project_token_account: ctx.accounts.project_token_account.key(),
        mint: ctx.accounts.mint.key(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProjectAta<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    admin: SystemAccount<'info>,
    #[account(
        seeds = [PROJECT_SEED, project.base.key().as_ref()],
        bump,
    )]
    project: Account<'info, Project>,
    #[account(
        init,
        payer=payer,
        associated_token::mint=mint,
        associated_token::authority=project
    )]
    project_token_account: Account<'info, TokenAccount>,
    mint: Box<InterfaceAccount<'info, Mint>>,
    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
    associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct InitializeProjectAtaParams {}
