use jupiter_referral_sdk::{
    create_initialize_project_instruction,
    create_initialize_referral_account_instruction, 
    create_initialize_referral_account_with_name_instruction,
    create_initialize_referral_token_account_instruction,
    create_claim_instruction,
    create_claim_v2_instruction,
    InitializeProjectParams,
    InitializeReferralAccountParams,
    InitializeReferralAccountWithNameParams,
    InitializeReferralTokenAccountParams,
    ClaimParams,
    ClaimV2Params,
    helper_derive_project_pda,
    helper_derive_referral_account_pda,
    derive_referral_account_with_name_pda,
    helper_derive_referral_token_account_pda,
    REFERRAL_PROGRAM_ID
};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Jupiter Referral Helper Usage Examples");
    println!("=====================================");

    // Program ID
    let program_id = Pubkey::from_str(REFERRAL_PROGRAM_ID)?;
    println!("Using program ID: {}", program_id);

    // Example keys
    let payer = Pubkey::new_unique();
    let base = Pubkey::new_unique();
    let admin = Pubkey::new_unique();
    let partner = Pubkey::new_unique();
    let sol_mint = Pubkey::from_str("So11111111111111111111111111111111111111112")?;

    println!("\n1. Creating Initialize Project Instruction");
    println!("------------------------------------------");
    
    let project_params = InitializeProjectParams {
        name: "Test Project".to_string(),
        default_share_bps: 500, // 5%
    };

    let project_instruction = create_initialize_project_instruction(
        base, admin, payer, project_params, program_id
    )?;
    println!("✓ Created initialize project instruction");
    println!("  - Accounts: {}", project_instruction.accounts.len());
    println!("  - Data length: {}", project_instruction.data.len());

    // Derive project PDA for next steps
    let (project_pda, _) = helper_derive_project_pda(&base, &program_id)?;
    println!("  - Project PDA: {}", project_pda);

    println!("\n2. Creating Initialize Referral Account Instruction");
    println!("---------------------------------------------------");
    
    let referral_account = Pubkey::new_unique();
    let referral_params = InitializeReferralAccountParams {
        project_pubkey: project_pda,
        partner_pubkey: partner,
        payer_pubkey: payer,
        referral_account_pubkey: referral_account,
    };

    let referral_instruction = create_initialize_referral_account_instruction(referral_params, program_id)?;
    println!("✓ Created initialize referral account instruction");
    println!("  - Accounts: {}", referral_instruction.accounts.len());
    println!("  - Data length: {}", referral_instruction.data.len());

    println!("\n3. Creating Initialize Referral Account with Name Instruction");
    println!("-------------------------------------------------------------");
    
    let referral_with_name_params = InitializeReferralAccountWithNameParams {
        project_pubkey: project_pda,
        partner_pubkey: partner,
        payer_pubkey: payer,
        name: "Partner Alpha".to_string(),
    };

    let referral_with_name_instruction = create_initialize_referral_account_with_name_instruction(referral_with_name_params, program_id)?;
    println!("✓ Created initialize referral account with name instruction");
    println!("  - Accounts: {}", referral_with_name_instruction.accounts.len());
    println!("  - Data length: {}", referral_with_name_instruction.data.len());

    // Derive referral account PDA for next step
    let (referral_pda, _) = derive_referral_account_with_name_pda(&project_pda, "Partner Alpha", &program_id)?;
    println!("  - Referral Account PDA: {}", referral_pda);

    println!("\n4. Creating Initialize Referral Token Account Instruction");
    println!("---------------------------------------------------------");
    
    let token_account_params = InitializeReferralTokenAccountParams {
        payer_pubkey: payer,
        project_pubkey: project_pda,
        referral_account_pubkey: referral_pda,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let token_account_instruction = create_initialize_referral_token_account_instruction(token_account_params, program_id)?;
    println!("✓ Created initialize referral token account instruction");
    println!("  - Accounts: {}", token_account_instruction.accounts.len());
    println!("  - Data length: {}", token_account_instruction.data.len());

    // Derive referral token account PDA for claiming
    let (referral_token_pda, _) = helper_derive_referral_token_account_pda(&referral_pda, &sol_mint, &program_id)?;
    println!("  - Referral Token Account PDA: {}", referral_token_pda);

    println!("\n5. Creating Claim Instruction");
    println!("-----------------------------");
    
    let claim_params = ClaimParams {
        payer_pubkey: payer,
        project_pubkey: project_pda,
        admin_pubkey: admin,
        referral_account_pubkey: referral_pda,
        partner_pubkey: partner,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let claim_instruction = create_claim_instruction(claim_params, program_id)?;
    println!("✓ Created claim instruction");
    println!("  - Accounts: {}", claim_instruction.accounts.len());
    println!("  - Data length: {}", claim_instruction.data.len());

    println!("\n6. Creating Claim V2 Instruction");
    println!("--------------------------------");
    
    let claim_v2_params = ClaimV2Params {
        payer_pubkey: payer,
        project_pubkey: project_pda,
        admin_pubkey: admin,
        referral_account_pubkey: referral_pda,
        partner_pubkey: partner,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let claim_v2_instruction = create_claim_v2_instruction(claim_v2_params, program_id)?;
    println!("✓ Created claim v2 instruction");
    println!("  - Accounts: {}", claim_v2_instruction.accounts.len());
    println!("  - Data length: {}", claim_v2_instruction.data.len());

    println!("\n7. PDA Derivation Examples");
    println!("--------------------------");

    // Show all PDA derivations
    let (project_derived, project_bump) = helper_derive_project_pda(&base, &program_id)?;
    println!("✓ Project PDA: {} (bump: {})", project_derived, project_bump);

    let (referral_derived, referral_bump) = helper_derive_referral_account_pda(&project_derived, &partner)?;
    println!("✓ Referral Account PDA: {} (bump: {})", referral_derived, referral_bump);

    let (referral_named_derived, referral_named_bump) = derive_referral_account_with_name_pda(&project_derived, "Test Partner", &program_id)?;
    println!("✓ Named Referral PDA: {} (bump: {})", referral_named_derived, referral_named_bump);

    let (token_account_derived, token_bump) = helper_derive_referral_token_account_pda(&referral_derived, &sol_mint, &program_id)?;
    println!("✓ Referral Token Account PDA: {} (bump: {})", token_account_derived, token_bump);

    println!("\n✅ All helper functions working correctly!");
    println!("Ready to integrate with your Solana application.");

    Ok(())
}
