use anchor_lang::prelude::*;

use crate::{Token, UpdateMarketCap};

pub fn update_market_cap(ctx: Context<UpdateMarketCap>, token: Token, market_cap: u64) -> Result<()> {
    let game_account = &mut ctx.accounts.game_account;

    match token {
        Token::Top => game_account.top_market_cap = market_cap,
        Token::Bottom => game_account.bottom_market_cap = market_cap,
    }

    Ok(())
}
