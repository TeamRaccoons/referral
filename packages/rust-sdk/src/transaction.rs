use anyhow::{anyhow, Result};
use base64::prelude::*;
use solana_sdk::{
    message::{
        v0::LoadedAddresses, SanitizedMessage, SanitizedVersionedMessage, SimpleAddressLoader, 
        VersionedMessage,
    },
    transaction::{SanitizedTransaction, VersionedTransaction, MessageHash},
};

/// Contains transaction details for validation
#[derive(Debug)]
pub struct TransactionDetails {
    pub versioned_transaction: VersionedTransaction,
    pub sanitized_message: SanitizedMessage,
}

/// Deserialize a base64-encoded transaction into transaction details
pub fn deserialize_transaction_base64_into_transaction_details(
    transaction: &str,
) -> Result<TransactionDetails> {
    let base64_decoded_tx = BASE64_STANDARD
        .decode(transaction)
        .map_err(|error| anyhow!("Invalid transaction: {error}"))?;
        
    let versioned_transaction = bincode::deserialize::<VersionedTransaction>(&base64_decoded_tx)
        .map_err(|error| anyhow!("Invalid transaction: {error}"))?;

    // Check the instructions
    let sanitized_message =
        versioned_message_to_sanitized_message(versioned_transaction.message.clone())?;

    Ok(TransactionDetails {
        versioned_transaction,
        sanitized_message,
    })
}

/// Convert a versioned message to a sanitized message
pub fn versioned_message_to_sanitized_message(
    versioned_message: VersionedMessage,
) -> Result<SanitizedMessage> {
    let sanitized_versioned_message = SanitizedVersionedMessage::try_new(versioned_message)
        .map_err(|error| anyhow!("Failed to sanitize versioned message: {error}"))?;

    let sanitized_message = SanitizedMessage::try_new(
        sanitized_versioned_message,
        SimpleAddressLoader::Enabled(LoadedAddresses::default()),
    )
    .map_err(|error| anyhow!("Failed to create sanitized message: {error}"))?;

    Ok(sanitized_message)
}

/// Create a sanitized transaction from base64 encoded transaction data
pub fn sanitized_transaction_from_base64(data: &str) -> Result<SanitizedTransaction> {
    let base64_decoded_tx = BASE64_STANDARD
        .decode(data)
        .map_err(|error| anyhow!("Invalid transaction: {error}"))?;
        
    let versioned_transaction = bincode::deserialize::<VersionedTransaction>(&base64_decoded_tx)
        .map_err(|error| anyhow!("Invalid transaction: {error}"))?;

    // Create sanitized transaction
    let sanitized_tx = SanitizedTransaction::try_create(
        versioned_transaction,
        MessageHash::Compute, // message hash mode
        Some(true), // verify signatures
        SimpleAddressLoader::Disabled,
    )
    .map_err(|error| anyhow!("Failed to create sanitized transaction: {error}"))?;
    
    Ok(sanitized_tx)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_invalid_base64() {
        let result = deserialize_transaction_base64_into_transaction_details("invalid_base64!");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid transaction"));
    }
}
