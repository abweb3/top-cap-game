use anchor_lang::prelude::*;

use crate::InitializeGame;

pub fn initialize_game(ctx: Context<InitializeGame>, initial_supply: u64) -> Result<()> {
    let game_account = &mut ctx.accounts.game_account;
    game_account.top_market_cap = initial_supply;
    game_account.bottom_market_cap = initial_supply;
    game_account.daily_top_wins = 0;
    game_account.daily_bottom_wins = 0;
    game_account.fees_collected = 0;
    game_account.last_daily_settlement = Clock::get()?.unix_timestamp;
    game_account.last_weekly_settlement = Clock::get()?.unix_timestamp;
    Ok(())
}
