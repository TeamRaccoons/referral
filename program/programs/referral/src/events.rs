use anchor_lang::prelude::*;

#[event]
pub struct InitializeProjectEvent {
    pub project: Pubkey,
    pub admin: Pubkey,
    pub name: String,
    pub default_share_bps: u16,
}

#[event]
pub struct UpdateProjectEvent {
    pub project: Pubkey,
    pub name: String,
    pub default_share_bps: u16,
}

#[event]
pub struct InitializeReferralAccountEvent {
    pub project: Pubkey,
    pub partner: Pubkey,
    pub referral_account: Pubkey,
    pub share_bps: u16,
    pub name: Option<String>,
}

#[event]
pub struct UpdateReferralAccountEvent {
    pub referral_account: Pubkey,
    pub share_bps: u16,
}

#[event]
pub struct InitializeReferralTokenAccountEvent {
    pub project: Pubkey,
    pub referral_account: Pubkey,
    pub referral_token_account: Pubkey,
    pub mint: Pubkey,
}

#[event]
pub struct ClaimEvent {
    pub project: Pubkey,
    pub project_admin_token_account: Pubkey,
    pub referral_account: Pubkey,
    pub referral_token_account: Pubkey,
    pub partner_token_account: Pubkey,
    pub mint: Pubkey,
    pub referral_amount: u64,
    pub project_amount: u64,
}
