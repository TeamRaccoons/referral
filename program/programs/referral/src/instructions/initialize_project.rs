use anchor_lang::prelude::*;

use crate::{events::InitializeProjectEvent, ProgramErrorCode, Project, PROJECT_SEED};

pub fn initialize_project(
    ctx: Context<InitializeProject>,
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

    ctx.accounts.project.set_inner(Project {
        admin: ctx.accounts.admin.key(),
        base: ctx.accounts.base.key(),
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
pub struct InitializeProject<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    base: Signer<'info>,
    admin: SystemAccount<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [PROJECT_SEED, base.key().as_ref()],
        bump,
        space = Project::LEN
    )]
    project: Account<'info, Project>,
    system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct InitializeProjectParams {
    pub name: String,
    pub default_share_bps: u16,
}
