# Jupiter Referral Program Rust SDK

A comprehensive Rust SDK for the Jupiter Referral Program on Solana. This SDK provides transaction validation, instruction creation helpers, and PDA derivation utilities - making it ideal for backend services, webhooks, analytics, and client applications.

## Features

- **🔧 Instruction Helpers**: Create Jupiter Referral Program instructions easily
- **✅ Transaction Validation**: Validate referral claim transactions and extract details
- **🏗️ PDA Derivation**: Helper functions for deriving program-derived addresses
- **📊 Transaction Parsing**: Parse and decode Solana transactions from base64
- **⚡ Lightweight**: Minimal dependencies focused on essential functionality

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
jupiter-referral-sdk = { path = "../rust-sdk" }
```

## Examples

For comprehensive usage examples, see the `examples/` directory:

```bash
# Complete demonstration of all 14 instructions
cargo run --example complete_usage

# Basic helper usage patterns  
cargo run --example helper_usage

# Transaction validation examples
cargo run --example validate_transaction
```

## Core Concepts

### Instruction Helper Functions

The SDK provides helper functions for creating **ALL 14** Jupiter Referral Program instructions, similar to the OrderEngine helper pattern:

#### 🏗️ Project Management
- **`create_initialize_project_instruction`**: Initialize a new referral project
- **`create_update_project_instruction`**: Update project settings (name, default share)
- **`create_transfer_project_instruction`**: Transfer project ownership to new admin

#### 👥 Referral Account Management  
- **`create_initialize_referral_account_instruction`**: Create a referral account for a partner
- **`create_initialize_referral_account_with_name_instruction`**: Create a named referral account
- **`create_update_referral_account_instruction`**: Update referral account settings
- **`create_transfer_referral_account_instruction`**: Transfer referral account to new partner

#### 💰 Token Accounts & Claims
- **`create_initialize_referral_token_account_instruction`**: Set up token accounts for fee collection
- **`create_claim_instruction`**: Claim accumulated referral fees (V1)
- **`create_claim_v2_instruction`**: Claim fees using V2 instruction format
- **`create_withdraw_from_project_instruction`**: Withdraw funds from project treasury
- **`create_admin_token_account_instruction`**: Create admin token account for project

#### 🧹 Cleanup Operations
- **`create_close_referral_token_account_instruction`**: Close referral token account (V1)
- **`create_close_referral_token_account_v2_instruction`**: Close referral token account (V2)

Each helper function:
- ✅ Validates input parameters
- ✅ Derives necessary PDAs automatically  
- ✅ Sets up correct account metadata
- ✅ Returns ready-to-use `Instruction` objects

### Transaction Validation Approach

This SDK follows Jupiter's OrderEngine SDK pattern, focusing on validation rather than client operations. It's designed for:
- **Webhook validators**: Validate incoming transactions in real-time
- **Analytics services**: Parse and analyze referral claim transactions  
- **Monitoring tools**: Track referral activity and payments
- **Backend services**: Validate transactions before processing rewards

### Program IDs

The SDK uses different program IDs for different networks:
- **Devnet/Localnet**: `9vhgK3i91cTwTHQag85zoA3PmJUTfgvgYFc9AJPRNhGn`
- **Mainnet**: `REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3`

### Share Basis Points (BPS)

Share percentages are represented in basis points where:
- 1 BPS = 0.01%
- 100 BPS = 1%
- 10,000 BPS = 100%

For example, a 50% referral share would be `5000` BPS.

## API Reference

### `validation` module

#### `validate_claim_transaction`
```rust
pub fn validate_claim_transaction(
    transaction: &SanitizedTransaction,
    project_base: &Pubkey,
    partner: &Pubkey,
    mint: &Pubkey,
) -> anyhow::Result<ClaimDetails>
```
Validates a complete claim transaction with all expected accounts and returns claim details.

#### `extract_claim_details` 
```rust
pub fn extract_claim_details(
    transaction: &SanitizedTransaction,
) -> anyhow::Result<ClaimDetails>
```
Extracts claim details from a transaction without full validation.

#### PDA Derivation Functions
```rust
pub fn derive_project_pda(base: &Pubkey) -> (Pubkey, u8)
pub fn derive_project_authority_pda(base: &Pubkey) -> (Pubkey, u8)  
pub fn derive_referral_account_pda(project: &Pubkey, partner: &Pubkey) -> (Pubkey, u8)
pub fn derive_referral_token_account_pda(referral_account: &Pubkey, mint: &Pubkey) -> (Pubkey, u8)
```

### `transaction` module

#### `sanitized_transaction_from_base64`
```rust
pub fn sanitized_transaction_from_base64(data: &str) -> anyhow::Result<SanitizedTransaction>
```
Parses a base64-encoded transaction into a `SanitizedTransaction`.

### Types

#### `ClaimDetails`
```rust
pub struct ClaimDetails {
    pub amount: u64,
    pub share_bps: u16,
    pub project: Pubkey,
    pub partner: Pubkey,
    pub mint: Pubkey,
}
```

## Testing

Test the SDK:

```bash
cargo test
```

Build the SDK:

```bash  
cargo build
```

Check compilation:

```bash
cargo check
```
