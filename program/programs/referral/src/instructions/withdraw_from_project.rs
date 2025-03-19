use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{Project, PROJECT_AUTHORITY_SEED};


pub fn withdraw_from_project(
    ctx: Context<WithdrawFromProject>,
    params: WithdrawFromProjectParams,
) -> Result<()> {
    let bump = ctx.bumps.project_authority;
    let signer_seeds: &[&[&[u8]]] = &[&[
        PROJECT_AUTHORITY_SEED,
        ctx.accounts.project.base.as_ref(),
        &[bump],
    ]];

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.project_authority.to_account_info(),
                to: ctx.accounts.admin.to_account_info(),
            },
            signer_seeds,
        ),
        params.amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFromProject<'info> {
    #[account(mut)]
    admin: Signer<'info>,
    #[account(
        has_one = admin
    )]
    project: Account<'info, Project>,
    #[account(
        mut,
        seeds = [PROJECT_AUTHORITY_SEED, project.base.key().as_ref()],
        bump
    )]
    project_authority: SystemAccount<'info>,
    system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct WithdrawFromProjectParams {
    pub amount: u64,
}
