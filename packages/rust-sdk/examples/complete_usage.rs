use jupiter_referral_sdk::{
    // All instruction creation functions
    create_initialize_project_instruction,
    create_update_project_instruction,
    create_transfer_project_instruction,
    create_initialize_referral_account_instruction, 
    create_initialize_referral_account_with_name_instruction,
    create_update_referral_account_instruction,
    create_transfer_referral_account_instruction,
    create_initialize_referral_token_account_instruction,
    create_claim_instruction,
    create_claim_v2_instruction,
    create_withdraw_from_project_instruction,
    create_admin_token_account_instruction,
    create_close_referral_token_account_instruction,
    create_close_referral_token_account_v2_instruction,
    // Parameter structs
    InitializeProjectParams,
    UpdateProjectParams,
    TransferProjectParams,
    InitializeReferralAccountParams,
    InitializeReferralAccountWithNameParams,
    UpdateReferralAccountParams,
    TransferReferralAccountParams,
    InitializeReferralTokenAccountParams,
    ClaimParams,
    ClaimV2Params,
    WithdrawFromProjectParams,
    CreateAdminTokenAccountParams,
    CloseReferralTokenAccountParams,
    CloseReferralTokenAccountV2Params,
    // PDA derivation helpers
    helper_derive_project_pda,
    helper_derive_project_authority_pda,
    helper_derive_referral_account_pda,
    derive_referral_account_with_name_pda,
    helper_derive_referral_token_account_pda,
    REFERRAL_PROGRAM_ID
};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Complete Jupiter Referral Helper Usage Examples");
    println!("==================================================");

    // Program ID
    let program_id = Pubkey::from_str(REFERRAL_PROGRAM_ID)?;
    println!("Using program ID: {}", program_id);

    // Example keys
    let payer = Pubkey::new_unique();
    let base = Pubkey::new_unique();
    let admin = Pubkey::new_unique();
    let new_admin = Pubkey::new_unique();
    let partner = Pubkey::new_unique();
    let new_partner = Pubkey::new_unique();
    let sol_mint = Pubkey::from_str("So11111111111111111111111111111111111111112")?;

    println!("\n🏗️  PROJECT MANAGEMENT INSTRUCTIONS");
    println!("=====================================");

    println!("\n1. Initialize Project");
    println!("--------------------");
    let project_params = InitializeProjectParams {
        name: "Jupiter DEX Referral Program".to_string(),
        default_share_bps: 500, // 5%
    };

    let init_project_ix = create_initialize_project_instruction(
        base, admin, payer, project_params, program_id
    )?;
    println!("✓ Created initialize project instruction");
    println!("  - Accounts: {}", init_project_ix.accounts.len());
    println!("  - Data length: {}", init_project_ix.data.len());

    // Derive project PDA for next steps
    let (project_pda, project_bump) = helper_derive_project_pda(&base, &program_id)?;
    println!("  - Project PDA: {} (bump: {})", project_pda, project_bump);

    println!("\n2. Update Project");
    println!("----------------");
    let update_project_params = UpdateProjectParams {
        admin_pubkey: admin,
        project_pubkey: project_pda,
        new_name: Some("Updated Jupiter DEX Referral".to_string()),
        new_default_share_bps: Some(750), // Update to 7.5%
    };

    let update_project_ix = create_update_project_instruction(update_project_params, program_id)?;
    println!("✓ Created update project instruction");
    println!("  - Accounts: {}", update_project_ix.accounts.len());

    println!("\n3. Transfer Project Ownership");
    println!("----------------------------");
    let transfer_project_params = TransferProjectParams {
        admin_pubkey: admin,
        project_pubkey: project_pda,
        new_admin_pubkey: new_admin,
    };

    let transfer_project_ix = create_transfer_project_instruction(transfer_project_params, program_id)?;
    println!("✓ Created transfer project instruction");
    println!("  - Accounts: {}", transfer_project_ix.accounts.len());

    println!("\n💼 REFERRAL ACCOUNT MANAGEMENT");
    println!("==============================");

    println!("\n4. Initialize Referral Account");
    println!("------------------------------");
    let referral_account = Pubkey::new_unique();
    let referral_params = InitializeReferralAccountParams {
        project_pubkey: project_pda,
        partner_pubkey: partner,
        payer_pubkey: payer,
        referral_account_pubkey: referral_account,
    };

    let init_referral_ix = create_initialize_referral_account_instruction(referral_params, program_id)?;
    println!("✓ Created initialize referral account instruction");
    println!("  - Accounts: {}", init_referral_ix.accounts.len());

    println!("\n5. Initialize Named Referral Account");
    println!("------------------------------------");
    let named_referral_params = InitializeReferralAccountWithNameParams {
        project_pubkey: project_pda,
        partner_pubkey: partner,
        payer_pubkey: payer,
        name: "TopTrader_Partner".to_string(),
    };

    let init_named_referral_ix = create_initialize_referral_account_with_name_instruction(named_referral_params, program_id)?;
    println!("✓ Created initialize named referral account instruction");
    println!("  - Accounts: {}", init_named_referral_ix.accounts.len());

    // Derive named referral account PDA
    let (named_referral_pda, named_referral_bump) = derive_referral_account_with_name_pda(&project_pda, "TopTrader_Partner", &program_id)?;
    println!("  - Named Referral PDA: {} (bump: {})", named_referral_pda, named_referral_bump);

    println!("\n6. Update Referral Account");
    println!("-------------------------");
    let update_referral_params = UpdateReferralAccountParams {
        admin_pubkey: new_admin, // Using new admin from transfer
        project_pubkey: project_pda,
        referral_account_pubkey: named_referral_pda,
        new_share_bps: Some(1000), // Update to 10%
    };

    let update_referral_ix = create_update_referral_account_instruction(update_referral_params, program_id)?;
    println!("✓ Created update referral account instruction");
    println!("  - Accounts: {}", update_referral_ix.accounts.len());

    println!("\n7. Transfer Referral Account");
    println!("---------------------------");
    let transfer_referral_params = TransferReferralAccountParams {
        admin_pubkey: new_admin,
        project_pubkey: project_pda,
        referral_account_pubkey: named_referral_pda,
        new_partner_pubkey: new_partner,
    };

    let transfer_referral_ix = create_transfer_referral_account_instruction(transfer_referral_params, program_id)?;
    println!("✓ Created transfer referral account instruction");
    println!("  - Accounts: {}", transfer_referral_ix.accounts.len());

    println!("\n💰 TOKEN ACCOUNT & CLAIMS MANAGEMENT");
    println!("====================================");

    println!("\n8. Create Admin Token Account");
    println!("-----------------------------");
    let admin_token_params = CreateAdminTokenAccountParams {
        payer_pubkey: payer,
        project_pubkey: project_pda,
        admin_pubkey: new_admin,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let admin_token_ix = create_admin_token_account_instruction(admin_token_params, program_id)?;
    println!("✓ Created admin token account instruction");
    println!("  - Accounts: {}", admin_token_ix.accounts.len());

    println!("\n9. Initialize Referral Token Account");
    println!("-----------------------------------");
    let referral_token_params = InitializeReferralTokenAccountParams {
        payer_pubkey: payer,
        project_pubkey: project_pda,
        referral_account_pubkey: named_referral_pda,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let init_referral_token_ix = create_initialize_referral_token_account_instruction(referral_token_params, program_id)?;
    println!("✓ Created initialize referral token account instruction");
    println!("  - Accounts: {}", init_referral_token_ix.accounts.len());

    // Derive referral token account PDA
    let (referral_token_pda, referral_token_bump) = helper_derive_referral_token_account_pda(&named_referral_pda, &sol_mint, &program_id)?;
    println!("  - Referral Token PDA: {} (bump: {})", referral_token_pda, referral_token_bump);

    println!("\n10. Claim Referral Rewards (V1)");
    println!("-------------------------------");
    let claim_params = ClaimParams {
        payer_pubkey: payer,
        project_pubkey: project_pda,
        admin_pubkey: new_admin,
        referral_account_pubkey: named_referral_pda,
        partner_pubkey: new_partner,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let claim_ix = create_claim_instruction(claim_params, program_id)?;
    println!("✓ Created claim instruction");
    println!("  - Accounts: {}", claim_ix.accounts.len());

    println!("\n11. Claim Referral Rewards (V2)");
    println!("-------------------------------");
    let claim_v2_params = ClaimV2Params {
        payer_pubkey: payer,
        project_pubkey: project_pda,
        admin_pubkey: new_admin,
        referral_account_pubkey: named_referral_pda,
        partner_pubkey: new_partner,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let claim_v2_ix = create_claim_v2_instruction(claim_v2_params, program_id)?;
    println!("✓ Created claim v2 instruction");
    println!("  - Accounts: {}", claim_v2_ix.accounts.len());

    println!("\n12. Withdraw from Project");
    println!("-------------------------");
    let withdraw_params = WithdrawFromProjectParams {
        admin_pubkey: new_admin,
        project_pubkey: project_pda,
        mint_pubkey: sol_mint,
        amount: 1_000_000, // 1 SOL (6 decimals)
        token_program_id: spl_token::ID,
    };

    let withdraw_ix = create_withdraw_from_project_instruction(withdraw_params, program_id)?;
    println!("✓ Created withdraw from project instruction");
    println!("  - Accounts: {}", withdraw_ix.accounts.len());

    println!("\n🧹 CLEANUP INSTRUCTIONS");
    println!("======================");

    println!("\n13. Close Referral Token Account (V1)");
    println!("-------------------------------------");
    let close_token_params = CloseReferralTokenAccountParams {
        admin_pubkey: new_admin,
        project_pubkey: project_pda,
        referral_account_pubkey: named_referral_pda,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let close_token_ix = create_close_referral_token_account_instruction(close_token_params, program_id)?;
    println!("✓ Created close referral token account instruction");
    println!("  - Accounts: {}", close_token_ix.accounts.len());

    println!("\n14. Close Referral Token Account (V2)");
    println!("-------------------------------------");
    let close_token_v2_params = CloseReferralTokenAccountV2Params {
        admin_pubkey: new_admin,
        project_pubkey: project_pda,
        referral_account_pubkey: named_referral_pda,
        mint_pubkey: sol_mint,
        token_program_id: spl_token::ID,
    };

    let close_token_v2_ix = create_close_referral_token_account_v2_instruction(close_token_v2_params, program_id)?;
    println!("✓ Created close referral token account v2 instruction");
    println!("  - Accounts: {}", close_token_v2_ix.accounts.len());

    println!("\n🧮 PDA DERIVATION SUMMARY");
    println!("========================");
    
    let (project_authority_pda, project_authority_bump) = helper_derive_project_authority_pda(&project_pda, &program_id)?;
    
    println!("✓ Project PDA: {} (bump: {})", project_pda, project_bump);
    println!("✓ Project Authority PDA: {} (bump: {})", project_authority_pda, project_authority_bump);
    println!("✓ Named Referral PDA: {} (bump: {})", named_referral_pda, named_referral_bump);
    println!("✓ Referral Token PDA: {} (bump: {})", referral_token_pda, referral_token_bump);

    println!("\n🎉 SUCCESS! All 14/14 referral program instructions are now supported!");
    println!("====================================================================");
    println!("The Jupiter Referral Rust SDK now provides complete coverage of:");
    println!("📋 Project management (initialize, update, transfer)");
    println!("👥 Referral account management (initialize, update, transfer)");
    println!("💰 Token account & claims (initialize, claim v1/v2, withdraw)");
    println!("🧹 Cleanup operations (close token accounts v1/v2)");
    println!("🔧 Admin operations (create admin token account)");
    println!("");
    println!("Ready for production use in your Solana applications! 🚀");

    Ok(())
}
