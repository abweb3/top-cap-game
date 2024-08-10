use anchor_lang::prelude::*;
// use anchor_lang::prelude::ErrorCode;
use crate::error::CustomErrorCode;
use crate::SettleDailyEpoch;

pub fn settle_daily_epoch(ctx: Context<SettleDailyEpoch>) -> Result<()> {
    let game_account = &mut ctx.accounts.game_account;

    let current_time = Clock::get()?.unix_timestamp;

    require!(current_time >= game_account.last_daily_settlement + 86400, CustomErrorCode::TooEarly);

    if game_account.top_market_cap > game_account.bottom_market_cap {
        game_account.daily_top_wins += 1;
        game_account.daily_winner = ctx.accounts.user.key();
    } else {
        game_account.daily_bottom_wins += 1;
        game_account.daily_winner = ctx.accounts.user.key();
    }

    game_account.last_daily_settlement = current_time;

    // Logic to distribute 35% of the fees
    let fee_share = game_account.fees_collected / 20; // 5% of the total fees
    game_account.fees_collected -= fee_share;
    **ctx.accounts.user.try_borrow_mut_lamports()? += fee_share;

    Ok(())
}