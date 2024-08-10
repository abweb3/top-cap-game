use anchor_lang::prelude::*;

#[error_code]
pub enum CustomErrorCode {
    #[msg("Too early to settle the epoch.")]
    TooEarly,
}
