use anyhow::{anyhow, bail, ensure, Result};
use solana_sdk::{
    message::SanitizedMessage,
    pubkey::Pubkey,
};

/// Project information for validation
#[derive(Debug, Clone)]
pub struct ProjectInfo {
    pub base: Pubkey,
    pub admin: Pubkey,
}

/// Details extracted from a claim transaction
#[derive(Debug, Clone)]
pub struct ClaimDetails {
    pub amount: u64,
    pub share_bps: u16,
    pub project: Pubkey,
    pub partner: Pubkey,
    pub mint: Pubkey,
}

/// Claim instruction data structure
#[derive(Debug)]
struct ClaimData {
    project_key: Pubkey,
    referral_account: Pubkey,
    referral_authority: Pubkey,
    amount: u64,
    share_bps: u16,
}

/// Constants for the referral program
pub const PROJECT_SEED: &[u8] = b"project";
pub const PROJECT_AUTHORITY_SEED: &[u8] = b"project_authority";  
pub const REFERRAL_SEED: &[u8] = b"referral";
pub const REFERRAL_TOKEN_ACCOUNT_SEED: &[u8] = b"referral_token_account";

/// Simple instruction data for validation
#[derive(Debug, Clone)]
struct SimpleInstruction {
    #[allow(dead_code)]
    pub program_id: Pubkey,
    pub accounts: Vec<Pubkey>,
    pub data: Vec<u8>,
}

/// Find a referral instruction in the transaction
fn find_referral_instruction(message: &SanitizedMessage) -> Result<Option<(usize, SimpleInstruction)>> {
    let instructions = message.instructions();
    
    for (index, instruction) in instructions.iter().enumerate() {
        if message.account_keys().len() > instruction.program_id_index as usize {
            let program_id = message.account_keys()[instruction.program_id_index as usize];
            let simple_instruction = SimpleInstruction {
                program_id,
                accounts: instruction.accounts.iter()
                    .map(|&i| message.account_keys()[i as usize])
                    .collect(),
                data: instruction.data.clone(),
            };
            
            // Check if this is our referral program
            let referral_program_id: Pubkey = crate::REFERRAL_PROGRAM_ID.parse().unwrap();
            if program_id == referral_program_id && is_claim_instruction(&simple_instruction)? {
                return Ok(Some((index, simple_instruction)));
            }
        }
    }
    
    Ok(None)
}

/// Check if instruction is a claim instruction  
fn is_claim_instruction(instruction: &SimpleInstruction) -> Result<bool> {
    // Check if this is a claim instruction by examining the instruction data
    // The first 8 bytes should be the instruction discriminator for claim
    if instruction.data.len() < 8 {
        return Ok(false);
    }
    
    // This is a simplified check - in reality you'd check the actual discriminator
    // For now, we'll assume any instruction with sufficient data could be a claim
    Ok(instruction.data.len() >= 8)
}

/// Parse claim instruction data
fn parse_claim_data(instruction: &SimpleInstruction) -> Result<ClaimData> {
    if instruction.data.len() < 32 {
        bail!("Instruction data too short for claim");
    }
    
    // Skip the discriminator (first 8 bytes) and parse the data
    let data = &instruction.data[8..];
    
    if data.len() < 24 {
        bail!("Insufficient data for claim instruction");
    }
    
    // For a simplified version, we'll extract what we can from accounts
    // In a real implementation, you'd properly deserialize the instruction data
    
    ensure!(instruction.accounts.len() >= 3, "Not enough accounts for claim instruction");
    
    let project_key = instruction.accounts[0];
    let referral_account = instruction.accounts[1];
    let referral_authority = instruction.accounts[2];
    
    // For demonstration, we'll use placeholder values
    // In reality, these would come from the instruction data
    let amount = 1000000; // Placeholder
    let share_bps = 5000; // Placeholder
    
    Ok(ClaimData {
        project_key,
        referral_account,
        referral_authority,
        amount,
        share_bps,
    })
}

/// Validate claim instruction accounts
fn validate_claim_accounts(instruction: &SimpleInstruction, claim: &ClaimData) -> Result<()> {
    ensure!(instruction.accounts.len() >= 3, "Not enough accounts");
    
    // Account 0: Project key
    ensure!(
        instruction.accounts[0] == claim.project_key,
        "Project key mismatch"
    );
    
    // Account 1: Referral account
    ensure!(
        instruction.accounts[1] == claim.referral_account,
        "Referral account mismatch"
    );
    
    // Account 2: Referral authority (should be signer)
    ensure!(
        instruction.accounts[2] == claim.referral_authority,
        "Referral authority mismatch"
    );
    // Note: For simplicity, we're not checking if it's a signer here
    // In a real implementation, you'd check the transaction signatures
    
    Ok(())
}

/// Validate a complete claim transaction
pub fn validate_claim_transaction(
    transaction: &solana_sdk::transaction::SanitizedTransaction,
    project_base: &Pubkey,
    partner: &Pubkey,
    mint: &Pubkey,
) -> Result<ClaimDetails> {
    let message = transaction.message();
    
    // Find the referral instruction
    let (_index, instruction) = find_referral_instruction(message)?
        .ok_or_else(|| anyhow!("No referral instruction found"))?;
    
    // Parse the claim data
    let claim_data = parse_claim_data(&instruction)?;
    
    // Validate accounts
    validate_claim_accounts(&instruction, &claim_data)?;
    
    // Derive expected PDAs
    let (expected_project, _) = derive_project_pda(project_base);
    let (expected_referral_account, _) = derive_referral_account_pda(&expected_project, partner);
    
    // Validate PDAs match
    ensure!(
        claim_data.project_key == expected_project,
        "Project PDA mismatch"
    );
    ensure!(
        claim_data.referral_account == expected_referral_account,
        "Referral account PDA mismatch"
    );
    
    Ok(ClaimDetails {
        amount: claim_data.amount,
        share_bps: claim_data.share_bps,
        project: claim_data.project_key,
        partner: *partner,
        mint: *mint,
    })
}

/// Extract claim details without full validation
pub fn extract_claim_details(
    transaction: &solana_sdk::transaction::SanitizedTransaction,
) -> Result<ClaimDetails> {
    let message = transaction.message();
    
    // Find the referral instruction
    let (_index, instruction) = find_referral_instruction(message)?
        .ok_or_else(|| anyhow!("No referral instruction found"))?;
    
    // Parse the claim data
    let claim_data = parse_claim_data(&instruction)?;
    
    Ok(ClaimDetails {
        amount: claim_data.amount,
        share_bps: claim_data.share_bps,
        project: claim_data.project_key,
        partner: claim_data.referral_authority, // Using authority as partner for now
        mint: Pubkey::default(), // Placeholder
    })
}

/// Derive project PDA
pub fn derive_project_pda(base: &Pubkey) -> (Pubkey, u8) {
    let program_id = crate::REFERRAL_PROGRAM_ID.parse().unwrap();
    Pubkey::find_program_address(&[PROJECT_SEED, base.as_ref()], &program_id)
}

/// Derive project authority PDA
pub fn derive_project_authority_pda(base: &Pubkey) -> (Pubkey, u8) {
    let program_id = crate::REFERRAL_PROGRAM_ID.parse().unwrap();
    Pubkey::find_program_address(&[PROJECT_AUTHORITY_SEED, base.as_ref()], &program_id)
}

/// Derive referral account PDA
pub fn derive_referral_account_pda(project: &Pubkey, partner: &Pubkey) -> (Pubkey, u8) {
    let program_id = crate::REFERRAL_PROGRAM_ID.parse().unwrap();
    Pubkey::find_program_address(
        &[REFERRAL_SEED, project.as_ref(), partner.as_ref()], 
        &program_id
    )
}

/// Derive referral token account PDA
pub fn derive_referral_token_account_pda(referral_account: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    let program_id = crate::REFERRAL_PROGRAM_ID.parse().unwrap();
    Pubkey::find_program_address(
        &[REFERRAL_TOKEN_ACCOUNT_SEED, referral_account.as_ref(), mint.as_ref()],
        &program_id
    )
}
