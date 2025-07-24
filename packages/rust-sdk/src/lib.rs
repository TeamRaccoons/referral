//! # Jupiter Referral Program Rust SDK
//!
//! A simplified Rust SDK for validating and working with Jupiter Referral Program transactions.
//! This SDK provides utilities for transaction validation and key operations.

pub mod validation;
pub mod transaction;
pub mod helper;

pub use validation::{ClaimDetails, derive_project_pda, derive_project_authority_pda, derive_referral_account_pda, derive_referral_token_account_pda, validate_claim_transaction, extract_claim_details};
pub use transaction::sanitized_transaction_from_base64;
pub use helper::{
    InitializeProjectParams, InitializeReferralAccountParams, InitializeReferralAccountWithNameParams,
    InitializeReferralTokenAccountParams, ClaimParams, ClaimV2Params, UpdateProjectParams,
    TransferProjectParams, UpdateReferralAccountParams, WithdrawFromProjectParams,
    CreateAdminTokenAccountParams, TransferReferralAccountParams, CloseReferralTokenAccountParams,
    CloseReferralTokenAccountV2Params, HelperError, HelperResult,
    create_initialize_project_instruction, create_initialize_referral_account_instruction,
    create_initialize_referral_account_with_name_instruction, create_initialize_referral_token_account_instruction,
    create_claim_instruction, create_claim_v2_instruction, create_update_project_instruction,
    create_transfer_project_instruction, create_update_referral_account_instruction,
    create_withdraw_from_project_instruction, create_admin_token_account_instruction,
    create_transfer_referral_account_instruction, create_close_referral_token_account_instruction,
    create_close_referral_token_account_v2_instruction,
    derive_project_pda as helper_derive_project_pda, derive_project_authority_pda as helper_derive_project_authority_pda,
    derive_referral_account_pda as helper_derive_referral_account_pda, derive_referral_account_with_name_pda,
    derive_referral_token_account_pda as helper_derive_referral_token_account_pda, validate_token_program
};

// Program ID constants  
#[cfg(not(feature = "mainnet"))]
pub const REFERRAL_PROGRAM_ID: &str = "9vhgK3i91cTwTHQag85zoA3PmJUTfgvgYFc9AJPRNhGn";

#[cfg(feature = "mainnet")]
pub const REFERRAL_PROGRAM_ID: &str = "REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3";
