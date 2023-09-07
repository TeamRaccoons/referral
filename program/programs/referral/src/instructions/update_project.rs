use anchor_lang::prelude::*;

use crate::{events::UpdateProjectEvent, Project};

pub fn update_project(ctx: Context<UpdateProject>, params: UpdateProjectParams) -> Result<()> {
    let project = &mut ctx.accounts.project;

    if params.name.is_some() {
        project.name = params.name.unwrap();
    }

    if params.default_share_bps.is_some() {
        project.default_share_bps = params.default_share_bps.unwrap();
    }

    emit!(UpdateProjectEvent {
        project: project.key(),
        name: project.name.clone(),
        default_share_bps: project.default_share_bps,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateProject<'info> {
    admin: Signer<'info>,
    #[account(
        mut,
        has_one = admin,
    )]
    project: Account<'info, Project>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct UpdateProjectParams {
    pub name: Option<String>,
    pub default_share_bps: Option<u16>,
}
