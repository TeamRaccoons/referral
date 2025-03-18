use anchor_lang::prelude::*;

use crate::{events::InitializeProjectEvent, ProgramErrorCode, ProjectV2, PROJECT_V2_SEED};

use super::InitializeProjectParams;

// Initialize a project PDA account which has its own token accounts
pub fn initialize_project_v2(
    ctx: Context<InitializeProjectV2>,
    params: InitializeProjectParams,
) -> Result<()> {
    require!(
        params.name.chars().count() < 50,
        ProgramErrorCode::NameTooLong
    );

    require!(
        params.default_share_bps <= 10_000,
        ProgramErrorCode::InvalidSharePercentage
    );

    ctx.accounts.project.set_inner(ProjectV2 {
        admin: ctx.accounts.admin.key(),
        name: params.name.clone(),
        default_share_bps: params.default_share_bps,
    });

    emit!(InitializeProjectEvent {
        project: ctx.accounts.project.key(),
        admin: ctx.accounts.admin.key(),
        name: params.name,
        default_share_bps: params.default_share_bps,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProjectV2<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    admin: SystemAccount<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [PROJECT_V2_SEED, admin.key().as_ref()],
        bump,
        space = ProjectV2::LEN
    )]
    project: Account<'info, ProjectV2>,
    system_program: Program<'info, System>,
}
