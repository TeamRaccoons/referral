use anchor_lang::prelude::*;

use crate::Project;

pub fn transfer_project(
    ctx: Context<TransferProject>,
    _params: TransferProjectParams,
) -> Result<()> {
    ctx.accounts.project.admin = ctx.accounts.new_admin.key();

    Ok(())
}

#[derive(Accounts)]
pub struct TransferProject<'info> {
    admin: Signer<'info>,
    new_admin: SystemAccount<'info>,
    #[account(
        mut,
        has_one = admin,
    )]
    project: Account<'info, Project>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone, Default)]
pub struct TransferProjectParams {}
