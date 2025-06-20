use jupiter_referral_sdk::{
    sanitized_transaction_from_base64, extract_claim_details, validate_claim_transaction,
    derive_project_pda, derive_referral_account_pda, REFERRAL_PROGRAM_ID,
};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Example base64 transaction (this would come from your webhook)
    let example_tx_base64 = "your_base64_transaction_here";
    
    // Example project and partner pubkeys
    let project_base = Pubkey::from_str("11111111111111111111111111111112")?;
    let partner = Pubkey::from_str("11111111111111111111111111111113")?;
    let mint = Pubkey::from_str("So11111111111111111111111111111111111111112")?; // SOL mint
    
    println!("Jupiter Referral SDK Example");
    println!("Program ID: {}", REFERRAL_PROGRAM_ID);
    
    // Derive expected PDAs
    let (project_pda, project_bump) = derive_project_pda(&project_base);
    let (referral_account, referral_bump) = derive_referral_account_pda(&project_pda, &partner);
    
    println!("Project PDA: {} (bump: {})", project_pda, project_bump);
    println!("Referral Account: {} (bump: {})", referral_account, referral_bump);
    
    // In a real application, you would:
    // 1. Receive transaction from webhook
    // 2. Parse it using sanitized_transaction_from_base64
    // 3. Validate using validate_claim_transaction or extract_claim_details
    
    println!("\nTo use with a real transaction:");
    println!("1. Parse transaction: sanitized_transaction_from_base64(tx_base64)");
    println!("2. Extract details: extract_claim_details(&transaction)");
    println!("3. Validate: validate_claim_transaction(&transaction, &project_base, &partner, &mint)");
    
    Ok(())
}
