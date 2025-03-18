mod events;
mod instructions;

use anchor_lang::prelude::*;
use instructions::*;

#[cfg(all(not(feature = "devnet"), not(feature = "mainnet")))]
declare_id!("9vhgK3i91cTwTHQag85zoA3PmJUTfgvgYFc9AJPRNhGn");

#[cfg(feature = "devnet")]
declare_id!("9vhgK3i91cTwTHQag85zoA3PmJUTfgvgYFc9AJPRNhGn");

#[cfg(feature = "mainnet")]
declare_id!("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3");

pub const PROJECT_SEED: &[u8] = b"project";
pub const PROJECT_V2_SEED: &[u8] = b"project_v2";
pub const PROJECT_AUTHORITY_SEED: &[u8] = b"project_authority";
pub const REFERRAL_SEED: &[u8] = b"referral";
pub const REFERRAL_ATA_SEED: &[u8] = b"referral_ata";
pub const AUTHORITY_SEED: &[u8] = b"authority";

#[program]
pub mod referral {
    use super::*;

    // Project account instructions.

    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        params: InitializeProjectParams,
    ) -> Result<()> {
        instructions::initialize_project(ctx, params)
    }

    pub fn update_project(ctx: Context<UpdateProject>, params: UpdateProjectParams) -> Result<()> {
        instructions::update_project(ctx, params)
    }

    pub fn transfer_project(
        ctx: Context<TransferProject>,
        params: TransferProjectParams,
    ) -> Result<()> {
        instructions::transfer_project(ctx, params)
    }

    pub fn update_referral_account(
        ctx: Context<UpdateReferralAccount>,
        params: UpdateReferralAccountParams,
    ) -> Result<()> {
        instructions::update_referral_account(ctx, params)
    }

    pub fn withdraw_from_project(
        ctx: Context<WithdrawFromProject>,
        params: WithdrawFromProjectParams,
    ) -> Result<()> {
        instructions::withdraw_from_project(ctx, params)
    }

    pub fn create_admin_token_account(ctx: Context<CreateAdminTokenAccount>) -> Result<()> {
        instructions::create_admin_token_account(ctx)
    }

    // Referral account instructions.

    pub fn initialize_referral_account(
        ctx: Context<InitializeReferralAccount>,
        params: InitializeReferralAccountParams,
    ) -> Result<()> {
        instructions::initialize_referral_account(ctx, params)
    }

    pub fn initialize_referral_account_with_name(
        ctx: Context<InitializeReferralAccountWithName>,
        params: InitializeReferralAccountWithNameParams,
    ) -> Result<()> {
        instructions::initialize_referral_account_with_name(ctx, params)
    }

    pub fn transfer_referral_account(
        ctx: Context<TransferReferralAccount>,
        params: TransferReferralAccountParams,
    ) -> Result<()> {
        instructions::transfer_referral_account(ctx, params)
    }

    pub fn initialize_referral_token_account(
        ctx: Context<InitializeReferralTokenAccount>,
    ) -> Result<()> {
        instructions::initialize_referral_token_account(ctx)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim(ctx)
    }

    pub fn close_referral_token_account(ctx: Context<CloseReferralTokenAccount>) -> Result<()> {
        instructions::close_referral_token_account(ctx)
    }

    pub fn initialize_project_token_account(
        ctx: Context<InitializeProjectTokenAccount>,
        params: InitializeProjectTokenAccountParams,
    ) -> Result<()> {
        instructions::initialize_project_token_account(ctx, params)
    }

    pub fn initialize_project_v2(
        ctx: Context<InitializeProjectV2>,
        params: InitializeProjectParams,
    ) -> Result<()> {
        instructions::initialize_project_v2(ctx, params)
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
pub struct Project {
    base: Pubkey,
    admin: Pubkey,
    name: String,
    default_share_bps: u16,
}

impl Project {
    const LEN: usize = 8 + 32 + 32 + MAX_PROJECT_NAME_LENGTH + 12;
}

#[account]
pub struct ProjectV2 {
    admin: Pubkey,
    name: String,
    default_share_bps: u16,
}

impl ProjectV2 {
    const LEN: usize = 8 + 32 + MAX_PROJECT_NAME_LENGTH + 12;
}

#[account]
pub struct ReferralAccount {
    partner: Pubkey,
    project: Pubkey,
    share_bps: u16,
    name: Option<String>,
}

impl ReferralAccount {
    const LEN: usize = 8 + 32 + 32 + MAX_REFERRAL_ACCOUNT_NAME_LENGTH + 2;
}

#[error_code]
pub enum ProgramErrorCode {
    InvalidCalculation,
    InvalidSharePercentage,
    NameTooLong,
}

const MAX_PROJECT_NAME_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_REFERRAL_ACCOUNT_NAME_LENGTH: usize = 50 * 4; // 50 chars max.
