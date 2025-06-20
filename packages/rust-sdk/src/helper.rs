//! # Jupiter Referral Program Helper
//!
//! Helper functions for creating Jupiter Referral Program instructions.
//! This module provides utilities similar to the OrderEngine helper for creating
//! common Referral program instructions.

use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program,
};
use spl_token::ID as TOKEN_PROGRAM_ID;
use spl_token_2022::ID as TOKEN_2022_PROGRAM_ID;
use spl_associated_token_account::get_associated_token_address;

// Program constants
pub const PROJECT_SEED: &[u8] = b"project";
pub const PROJECT_AUTHORITY_SEED: &[u8] = b"project_authority";
pub const REFERRAL_SEED: &[u8] = b"referral";
pub const REFERRAL_ATA_SEED: &[u8] = b"referral_ata";

/// Errors that can occur when creating instructions
#[derive(Debug, Clone, PartialEq)]
pub enum HelperError {
    InvalidPubkey,
    InvalidTokenProgram,
    PdaDerivationFailed,
    NameTooLong,
    InvalidShareBps,
}

impl std::fmt::Display for HelperError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HelperError::InvalidPubkey => write!(f, "Invalid pubkey provided"),
            HelperError::InvalidTokenProgram => write!(f, "Invalid token program"),
            HelperError::PdaDerivationFailed => write!(f, "Failed to derive PDA"),
            HelperError::NameTooLong => write!(f, "Name too long"),
            HelperError::InvalidShareBps => write!(f, "Invalid share basis points"),
        }
    }
}

impl std::error::Error for HelperError {}

/// Result type for helper functions
pub type HelperResult<T> = Result<T, HelperError>;

/// Parameters for initializing a project
#[derive(Debug, Clone)]
pub struct InitializeProjectParams {
    pub name: String,
    pub default_share_bps: u16,
}

/// Parameters for initializing a referral account
#[derive(Debug, Clone)]
pub struct InitializeReferralAccountParams {
    pub project_pubkey: Pubkey,
    pub partner_pubkey: Pubkey,
    pub payer_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
}

/// Parameters for initializing a referral account with name
#[derive(Debug, Clone)]
pub struct InitializeReferralAccountWithNameParams {
    pub project_pubkey: Pubkey,
    pub partner_pubkey: Pubkey,
    pub payer_pubkey: Pubkey,
    pub name: String,
}

/// Parameters for initializing a referral token account
#[derive(Debug, Clone)]
pub struct InitializeReferralTokenAccountParams {
    pub payer_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub token_program_id: Pubkey,
}

/// Parameters for claiming rewards
#[derive(Debug, Clone)]
pub struct ClaimParams {
    pub payer_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub admin_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
    pub partner_pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub token_program_id: Pubkey,
}

/// Parameters for claiming rewards with V2 instruction (using named referral accounts)
#[derive(Debug, Clone)]
pub struct ClaimV2Params {
    pub payer_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub admin_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
    pub partner_pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub token_program_id: Pubkey,
}

/// Parameters for updating a project
#[derive(Debug, Clone)]
pub struct UpdateProjectParams {
    pub admin_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub new_name: Option<String>,
    pub new_default_share_bps: Option<u16>,
}

/// Parameters for transferring project ownership
#[derive(Debug, Clone)]
pub struct TransferProjectParams {
    pub admin_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub new_admin_pubkey: Pubkey,
}

/// Parameters for updating a referral account
#[derive(Debug, Clone)]
pub struct UpdateReferralAccountParams {
    pub admin_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
    pub new_share_bps: Option<u16>,
}

/// Parameters for withdrawing from project
#[derive(Debug, Clone)]
pub struct WithdrawFromProjectParams {
    pub admin_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub amount: u64,
    pub token_program_id: Pubkey,
}

/// Parameters for creating admin token account
#[derive(Debug, Clone)]
pub struct CreateAdminTokenAccountParams {
    pub payer_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub admin_pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub token_program_id: Pubkey,
}

/// Parameters for transferring referral account
#[derive(Debug, Clone)]
pub struct TransferReferralAccountParams {
    pub admin_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
    pub new_partner_pubkey: Pubkey,
}

/// Parameters for closing referral token account
#[derive(Debug, Clone)]
pub struct CloseReferralTokenAccountParams {
    pub admin_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub token_program_id: Pubkey,
}

/// Parameters for closing referral token account V2
#[derive(Debug, Clone)]
pub struct CloseReferralTokenAccountV2Params {
    pub admin_pubkey: Pubkey,
    pub project_pubkey: Pubkey,
    pub referral_account_pubkey: Pubkey,
    pub mint_pubkey: Pubkey,
    pub token_program_id: Pubkey,
}

/// Derive the project PDA
pub fn derive_project_pda(base_pubkey: &Pubkey, program_id: &Pubkey) -> HelperResult<(Pubkey, u8)> {
    Pubkey::find_program_address(&[PROJECT_SEED, base_pubkey.as_ref()], program_id)
        .try_into()
        .map_err(|_| HelperError::PdaDerivationFailed)
}

/// Derive the project authority PDA
pub fn derive_project_authority_pda(
    project_pubkey: &Pubkey,
    program_id: &Pubkey,
) -> HelperResult<(Pubkey, u8)> {
    Pubkey::find_program_address(
        &[PROJECT_AUTHORITY_SEED, project_pubkey.as_ref()],
        program_id,
    )
    .try_into()
    .map_err(|_| HelperError::PdaDerivationFailed)
}

/// Derive the referral account PDA for regular referral accounts
pub fn derive_referral_account_pda(
    project_pubkey: &Pubkey,
    program_id: &Pubkey,
) -> HelperResult<(Pubkey, u8)> {
    // Note: This is for old-style referral accounts without names
    // For new named accounts, use derive_referral_account_with_name_pda
    Pubkey::find_program_address(&[REFERRAL_SEED, project_pubkey.as_ref()], program_id)
        .try_into()
        .map_err(|_| HelperError::PdaDerivationFailed)
}

/// Derive the referral account PDA for named referral accounts
pub fn derive_referral_account_with_name_pda(
    project_pubkey: &Pubkey,
    name: &str,
    program_id: &Pubkey,
) -> HelperResult<(Pubkey, u8)> {
    if name.chars().count() >= 20 {
        return Err(HelperError::NameTooLong);
    }

    Pubkey::find_program_address(
        &[REFERRAL_SEED, project_pubkey.as_ref(), name.as_bytes()],
        program_id,
    )
    .try_into()
    .map_err(|_| HelperError::PdaDerivationFailed)
}

/// Derive the referral token account PDA
pub fn derive_referral_token_account_pda(
    referral_account_pubkey: &Pubkey,
    mint_pubkey: &Pubkey,
    program_id: &Pubkey,
) -> HelperResult<(Pubkey, u8)> {
    Pubkey::find_program_address(
        &[
            REFERRAL_ATA_SEED,
            referral_account_pubkey.as_ref(),
            mint_pubkey.as_ref(),
        ],
        program_id,
    )
    .try_into()
    .map_err(|_| HelperError::PdaDerivationFailed)
}

/// Validate token program ID
pub fn validate_token_program(token_program_id: &Pubkey) -> HelperResult<()> {
    if *token_program_id != TOKEN_PROGRAM_ID && *token_program_id != TOKEN_2022_PROGRAM_ID {
        return Err(HelperError::InvalidTokenProgram);
    }
    Ok(())
}

/// Create an instruction to initialize a project
pub fn create_initialize_project_instruction(
    base_pubkey: Pubkey,
    admin_pubkey: Pubkey,
    payer_pubkey: Pubkey,
    params: InitializeProjectParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate inputs
    if params.default_share_bps > 10_000 {
        return Err(HelperError::InvalidShareBps);
    }
    
    if params.name.chars().count() >= 50 {
        return Err(HelperError::NameTooLong);
    }

    // Derive project PDA
    let (project_pubkey, _) = derive_project_pda(&base_pubkey, &program_id)?;

    // Create instruction data
    let instruction_data = [
        &[0x5d, 0x77, 0x84, 0xc5, 0x44, 0xbf, 0x1b, 0x05], // InitializeProject discriminator
        &params.name.len().to_le_bytes()[..4],
        params.name.as_bytes(),
        &params.default_share_bps.to_le_bytes(),
    ]
    .concat();

    let accounts = vec![
        AccountMeta::new(payer_pubkey, true),
        AccountMeta::new_readonly(base_pubkey, true),
        AccountMeta::new_readonly(admin_pubkey, false),
        AccountMeta::new(project_pubkey, false),
        AccountMeta::new_readonly(system_program::ID, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data,
    })
}

/// Create an instruction to initialize a referral account
pub fn create_initialize_referral_account_instruction(
    params: InitializeReferralAccountParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Create instruction data (empty params for basic referral account)
    let instruction_data = [0x81, 0x8c, 0x87, 0x4a, 0xf4, 0x18, 0x12, 0xe7]; // InitializeReferralAccount discriminator

    let accounts = vec![
        AccountMeta::new(params.payer_pubkey, true),
        AccountMeta::new_readonly(params.partner_pubkey, false),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new(params.referral_account_pubkey, false),
        AccountMeta::new_readonly(system_program::ID, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to initialize a referral account with name
pub fn create_initialize_referral_account_with_name_instruction(
    params: InitializeReferralAccountWithNameParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate name length
    if params.name.chars().count() >= 20 {
        return Err(HelperError::NameTooLong);
    }

    // Derive referral account PDA
    let (referral_account_pubkey, _) =
        derive_referral_account_with_name_pda(&params.project_pubkey, &params.name, &program_id)?;

    // Create instruction data
    let instruction_data = [
        &[0x3e, 0x6b, 0x1c, 0x83, 0x14, 0x5b, 0xd4, 0x79], // InitializeReferralAccountWithName discriminator
        &params.name.len().to_le_bytes()[..4],
        params.name.as_bytes(),
    ]
    .concat();

    let accounts = vec![
        AccountMeta::new(params.payer_pubkey, true),
        AccountMeta::new_readonly(params.partner_pubkey, false),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new(referral_account_pubkey, false),
        AccountMeta::new_readonly(system_program::ID, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data,
    })
}

/// Create an instruction to initialize a referral token account
pub fn create_initialize_referral_token_account_instruction(
    params: InitializeReferralTokenAccountParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate token program
    validate_token_program(&params.token_program_id)?;

    // Derive referral token account PDA
    let (referral_token_account_pubkey, _) = derive_referral_token_account_pda(
        &params.referral_account_pubkey,
        &params.mint_pubkey,
        &program_id,
    )?;

    // Create instruction data
    let instruction_data = [0x9e, 0xf0, 0xaa, 0x3a, 0xad, 0xd7, 0x0b, 0x8b]; // InitializeReferralTokenAccount discriminator

    let accounts = vec![
        AccountMeta::new(params.payer_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new_readonly(params.referral_account_pubkey, false),
        AccountMeta::new(referral_token_account_pubkey, false),
        AccountMeta::new_readonly(params.mint_pubkey, false),
        AccountMeta::new_readonly(system_program::ID, false),
        AccountMeta::new_readonly(params.token_program_id, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to claim rewards (V1)
pub fn create_claim_instruction(
    params: ClaimParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate token program
    validate_token_program(&params.token_program_id)?;

    // Derive necessary PDAs
    let (referral_token_account_pubkey, _) = derive_referral_token_account_pda(
        &params.referral_account_pubkey,
        &params.mint_pubkey,
        &program_id,
    )?;

    // For V1 claim, we need to derive partner and admin token accounts
    // This is a simplified version - in practice you'd need to handle ATA creation
    let partner_token_account = get_associated_token_address(&params.partner_pubkey, &params.mint_pubkey);
    let admin_token_account = get_associated_token_address(&params.admin_pubkey, &params.mint_pubkey);

    // Create instruction data
    let instruction_data = [0x3e, 0xc6, 0x3d, 0x79, 0x46, 0x6a, 0x55, 0x99]; // Claim discriminator

    let accounts = vec![
        AccountMeta::new(params.payer_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new_readonly(params.admin_pubkey, false),
        AccountMeta::new(admin_token_account, false),
        AccountMeta::new_readonly(params.referral_account_pubkey, false),
        AccountMeta::new(referral_token_account_pubkey, false),
        AccountMeta::new_readonly(params.partner_pubkey, false),
        AccountMeta::new(partner_token_account, false),
        AccountMeta::new_readonly(params.mint_pubkey, false),
        AccountMeta::new_readonly(params.token_program_id, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to claim rewards (V2 - for named referral accounts)
pub fn create_claim_v2_instruction(
    params: ClaimV2Params,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate token program
    validate_token_program(&params.token_program_id)?;

    // For V2, the referral token account is an ATA of the referral account
    let referral_token_account = get_associated_token_address(&params.referral_account_pubkey, &params.mint_pubkey);
    
    // Partner and admin token accounts are also ATAs
    let partner_token_account = get_associated_token_address(&params.partner_pubkey, &params.mint_pubkey);
    let admin_token_account = get_associated_token_address(&params.admin_pubkey, &params.mint_pubkey);

    // Create instruction data
    let instruction_data = [0xf6, 0x5d, 0xb0, 0x91, 0xca, 0xd6, 0x67, 0x89]; // ClaimV2 discriminator

    let accounts = vec![
        AccountMeta::new(params.payer_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new_readonly(params.admin_pubkey, false),
        AccountMeta::new(admin_token_account, false),
        AccountMeta::new_readonly(params.referral_account_pubkey, false),
        AccountMeta::new(referral_token_account, false),
        AccountMeta::new_readonly(params.partner_pubkey, false),
        AccountMeta::new(partner_token_account, false),
        AccountMeta::new_readonly(params.mint_pubkey, false),
        AccountMeta::new_readonly(params.token_program_id, false),
        AccountMeta::new_readonly(system_program::ID, false),
        AccountMeta::new_readonly(spl_associated_token_account::ID, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to update a project
pub fn create_update_project_instruction(
    params: UpdateProjectParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate inputs
    if let Some(ref name) = params.new_name {
        if name.chars().count() >= 50 {
            return Err(HelperError::NameTooLong);
        }
    }
    
    if let Some(share_bps) = params.new_default_share_bps {
        if share_bps > 10_000 {
            return Err(HelperError::InvalidShareBps);
        }
    }

    // Create instruction data
    let mut instruction_data = vec![0x18, 0x5a, 0x33, 0x18, 0xf5, 0xec, 0xaf, 0x4b]; // UpdateProject discriminator
    
    // Add name update flag and data
    if let Some(ref name) = params.new_name {
        instruction_data.push(1); // name_update = true
        instruction_data.extend_from_slice(&(name.len() as u32).to_le_bytes());
        instruction_data.extend_from_slice(name.as_bytes());
    } else {
        instruction_data.push(0); // name_update = false
    }
    
    // Add share_bps update flag and data
    if let Some(share_bps) = params.new_default_share_bps {
        instruction_data.push(1); // share_bps_update = true
        instruction_data.extend_from_slice(&share_bps.to_le_bytes());
    } else {
        instruction_data.push(0); // share_bps_update = false
    }

    let accounts = vec![
        AccountMeta::new_readonly(params.admin_pubkey, true),
        AccountMeta::new(params.project_pubkey, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data,
    })
}

/// Create an instruction to transfer project ownership
pub fn create_transfer_project_instruction(
    params: TransferProjectParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Create instruction data
    let instruction_data = [0x7c, 0x6f, 0x84, 0x47, 0x1e, 0x4b, 0x30, 0x89]; // TransferProject discriminator

    let accounts = vec![
        AccountMeta::new_readonly(params.admin_pubkey, true),
        AccountMeta::new_readonly(params.new_admin_pubkey, false),
        AccountMeta::new(params.project_pubkey, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to update a referral account
pub fn create_update_referral_account_instruction(
    params: UpdateReferralAccountParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate inputs
    if let Some(share_bps) = params.new_share_bps {
        if share_bps > 10_000 {
            return Err(HelperError::InvalidShareBps);
        }
    }

    // Create instruction data
    let mut instruction_data = vec![0x77, 0xe7, 0xca, 0x82, 0x1c, 0x55, 0xa7, 0x0b]; // UpdateReferralAccount discriminator
    
    // Add share_bps update flag and data
    if let Some(share_bps) = params.new_share_bps {
        instruction_data.push(1); // share_bps_update = true
        instruction_data.extend_from_slice(&share_bps.to_le_bytes());
    } else {
        instruction_data.push(0); // share_bps_update = false
    }

    let accounts = vec![
        AccountMeta::new_readonly(params.admin_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new(params.referral_account_pubkey, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data,
    })
}

/// Create an instruction to withdraw from project
pub fn create_withdraw_from_project_instruction(
    params: WithdrawFromProjectParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate token program
    validate_token_program(&params.token_program_id)?;

    // Derive project authority PDA
    let (project_authority_pda, _) = derive_project_authority_pda(&params.project_pubkey, &program_id)?;
    
    // Get admin token account (ATA)
    let admin_token_account = get_associated_token_address(&params.admin_pubkey, &params.mint_pubkey);

    // Create instruction data
    let mut instruction_data = vec![0xa8, 0x3e, 0x0a, 0x26, 0xeb, 0x0b, 0x45, 0x42]; // WithdrawFromProject discriminator
    instruction_data.extend_from_slice(&params.amount.to_le_bytes());

    let accounts = vec![
        AccountMeta::new_readonly(params.admin_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new(project_authority_pda, false),
        AccountMeta::new(admin_token_account, false),
        AccountMeta::new_readonly(params.mint_pubkey, false),
        AccountMeta::new_readonly(params.token_program_id, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data,
    })
}

/// Create an instruction to create admin token account
pub fn create_admin_token_account_instruction(
    params: CreateAdminTokenAccountParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate token program
    validate_token_program(&params.token_program_id)?;

    // Derive project authority PDA
    let (project_authority_pda, _) = derive_project_authority_pda(&params.project_pubkey, &program_id)?;
    
    // Get admin token account (ATA)
    let admin_token_account = get_associated_token_address(&params.admin_pubkey, &params.mint_pubkey);

    // Create instruction data
    let instruction_data = [0x48, 0xd4, 0x8e, 0x1c, 0x93, 0x84, 0x45, 0x1b]; // CreateAdminTokenAccount discriminator

    let accounts = vec![
        AccountMeta::new(params.payer_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new_readonly(params.admin_pubkey, false),
        AccountMeta::new(project_authority_pda, false),
        AccountMeta::new(admin_token_account, false),
        AccountMeta::new_readonly(params.mint_pubkey, false),
        AccountMeta::new_readonly(system_program::ID, false),
        AccountMeta::new_readonly(params.token_program_id, false),
        AccountMeta::new_readonly(spl_associated_token_account::ID, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to transfer referral account
pub fn create_transfer_referral_account_instruction(
    params: TransferReferralAccountParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Create instruction data
    let instruction_data = [0x2f, 0x45, 0x89, 0x3b, 0x1c, 0x23, 0x7a, 0x4d]; // TransferReferralAccount discriminator

    let accounts = vec![
        AccountMeta::new_readonly(params.admin_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new_readonly(params.new_partner_pubkey, false),
        AccountMeta::new(params.referral_account_pubkey, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to close referral token account
pub fn create_close_referral_token_account_instruction(
    params: CloseReferralTokenAccountParams,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate token program
    validate_token_program(&params.token_program_id)?;

    // Derive referral token account PDA
    let (referral_token_account_pda, _) = derive_referral_token_account_pda(
        &params.referral_account_pubkey,
        &params.mint_pubkey,
        &program_id,
    )?;

    // Create instruction data
    let instruction_data = [0xa5, 0x1c, 0x37, 0x95, 0x2d, 0x4a, 0x6e, 0x8f]; // CloseReferralTokenAccount discriminator

    let accounts = vec![
        AccountMeta::new_readonly(params.admin_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new_readonly(params.referral_account_pubkey, false),
        AccountMeta::new(referral_token_account_pda, false),
        AccountMeta::new_readonly(params.mint_pubkey, false),
        AccountMeta::new_readonly(params.token_program_id, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}

/// Create an instruction to close referral token account V2
pub fn create_close_referral_token_account_v2_instruction(
    params: CloseReferralTokenAccountV2Params,
    program_id: Pubkey,
) -> HelperResult<Instruction> {
    // Validate token program
    validate_token_program(&params.token_program_id)?;

    // For V2, the referral token account is an ATA of the referral account
    let referral_token_account = get_associated_token_address(&params.referral_account_pubkey, &params.mint_pubkey);

    // Create instruction data
    let instruction_data = [0xc4, 0x8a, 0x9f, 0x23, 0x5e, 0x1b, 0x7d, 0x45]; // CloseReferralTokenAccountV2 discriminator

    let accounts = vec![
        AccountMeta::new_readonly(params.admin_pubkey, true),
        AccountMeta::new_readonly(params.project_pubkey, false),
        AccountMeta::new_readonly(params.referral_account_pubkey, false),
        AccountMeta::new(referral_token_account, false),
        AccountMeta::new_readonly(params.mint_pubkey, false),
        AccountMeta::new_readonly(params.token_program_id, false),
    ];

    Ok(Instruction {
        program_id,
        accounts,
        data: instruction_data.to_vec(),
    })
}



#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_project_pda() {
        let base = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let result = derive_project_pda(&base, &program_id);
        assert!(result.is_ok());
        
        let (pda, _bump) = result.unwrap();
        assert_ne!(pda, Pubkey::default());
    }

    #[test]
    fn test_derive_referral_account_with_name_pda() {
        let project = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        let name = "test";
        
        let result = derive_referral_account_with_name_pda(&project, name, &program_id);
        assert!(result.is_ok());
        
        let (pda, _bump) = result.unwrap();
        assert_ne!(pda, Pubkey::default());
    }

    #[test]
    fn test_name_too_long_error() {
        let project = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        let long_name = "a".repeat(25); // Too long
        
        let result = derive_referral_account_with_name_pda(&project, &long_name, &program_id);
        assert_eq!(result.unwrap_err(), HelperError::NameTooLong);
    }

    #[test]
    fn test_validate_token_program() {
        assert!(validate_token_program(&TOKEN_PROGRAM_ID).is_ok());
        assert!(validate_token_program(&TOKEN_2022_PROGRAM_ID).is_ok());
        assert!(validate_token_program(&Pubkey::new_unique()).is_err());
    }

    #[test]
    fn test_create_initialize_project_instruction() {
        let base = Pubkey::new_unique();
        let admin = Pubkey::new_unique();
        let payer = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = InitializeProjectParams {
            name: "Test Project".to_string(),
            default_share_bps: 5000,
        };
        
        let result = create_initialize_project_instruction(base, admin, payer, params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 5);
    }

    #[test]
    fn test_invalid_share_bps() {
        let base = Pubkey::new_unique();
        let admin = Pubkey::new_unique();
        let payer = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = InitializeProjectParams {
            name: "Test Project".to_string(),
            default_share_bps: 15000, // Invalid: > 10,000
        };
        
        let result = create_initialize_project_instruction(base, admin, payer, params, program_id);
        assert_eq!(result.unwrap_err(), HelperError::InvalidShareBps);
    }

    #[test]
    fn test_create_update_project_instruction() {
        let admin = Pubkey::new_unique();
        let project = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = UpdateProjectParams {
            admin_pubkey: admin,
            project_pubkey: project,
            new_name: Some("Updated Project".to_string()),
            new_default_share_bps: Some(1000),
        };
        
        let result = create_update_project_instruction(params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 2);
    }

    #[test]
    fn test_create_transfer_project_instruction() {
        let admin = Pubkey::new_unique();
        let new_admin = Pubkey::new_unique();
        let project = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = TransferProjectParams {
            admin_pubkey: admin,
            project_pubkey: project,
            new_admin_pubkey: new_admin,
        };
        
        let result = create_transfer_project_instruction(params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 3);
    }

    #[test]
    fn test_create_update_referral_account_instruction() {
        let admin = Pubkey::new_unique();
        let project = Pubkey::new_unique();
        let referral_account = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = UpdateReferralAccountParams {
            admin_pubkey: admin,
            project_pubkey: project,
            referral_account_pubkey: referral_account,
            new_share_bps: Some(2500), // 25%
        };
        
        let result = create_update_referral_account_instruction(params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 3);
    }

    #[test]
    fn test_create_withdraw_from_project_instruction() {
        let admin = Pubkey::new_unique();
        let project = Pubkey::new_unique();
        let mint = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = WithdrawFromProjectParams {
            admin_pubkey: admin,
            project_pubkey: project,
            mint_pubkey: mint,
            amount: 1000000, // 1 token with 6 decimals
            token_program_id: TOKEN_PROGRAM_ID,
        };
        
        let result = create_withdraw_from_project_instruction(params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 6);
    }

    #[test]
    fn test_create_admin_token_account_instruction() {
        let payer = Pubkey::new_unique();
        let admin = Pubkey::new_unique();
        let project = Pubkey::new_unique();
        let mint = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = CreateAdminTokenAccountParams {
            payer_pubkey: payer,
            project_pubkey: project,
            admin_pubkey: admin,
            mint_pubkey: mint,
            token_program_id: TOKEN_PROGRAM_ID,
        };
        
        let result = create_admin_token_account_instruction(params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 9);
    }

    #[test]
    fn test_create_close_referral_token_account_instruction() {
        let admin = Pubkey::new_unique();
        let project = Pubkey::new_unique();
        let referral_account = Pubkey::new_unique();
        let mint = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = CloseReferralTokenAccountParams {
            admin_pubkey: admin,
            project_pubkey: project,
            referral_account_pubkey: referral_account,
            mint_pubkey: mint,
            token_program_id: TOKEN_PROGRAM_ID,
        };
        
        let result = create_close_referral_token_account_instruction(params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 6);
    }

    #[test]
    fn test_create_close_referral_token_account_v2_instruction() {
        let admin = Pubkey::new_unique();
        let project = Pubkey::new_unique();
        let referral_account = Pubkey::new_unique();
        let mint = Pubkey::new_unique();
        let program_id = Pubkey::new_unique();
        
        let params = CloseReferralTokenAccountV2Params {
            admin_pubkey: admin,
            project_pubkey: project,
            referral_account_pubkey: referral_account,
            mint_pubkey: mint,
            token_program_id: TOKEN_PROGRAM_ID,
        };
        
        let result = create_close_referral_token_account_v2_instruction(params, program_id);
        assert!(result.is_ok());
        
        let instruction = result.unwrap();
        assert_eq!(instruction.program_id, program_id);
        assert_eq!(instruction.accounts.len(), 6);
    }
}
