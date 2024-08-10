use anchor_lang::prelude::*;
// use anchor_lang::prelude::ErrorCode;
use crate::{error::CustomErrorCode, SettleWeeklyEpoch, Token};

pub fn settle_weekly_epoch(ctx: Context<SettleWeeklyEpoch>) -> Result<()> {
    let game_account = &mut ctx.accounts.game_account;

    let current_time = Clock::get()?.unix_timestamp;

    require!(current_time >= game_account.last_weekly_settlement + 604800, CustomErrorCode::TooEarly);

    let _weekly_winner = if game_account.daily_top_wins > game_account.daily_bottom_wins {
        Token::Top
    } else {
        Token::Bottom
    };

    game_account.weekly_winner = ctx.accounts.user.key();

    // Logic to distribute 80% of the fees
    let weekly_share = game_account.fees_collected * 4 / 5; // 80% of the total fees
    game_account.fees_collected -= weekly_share;
    **ctx.accounts.user.try_borrow_mut_lamports()? += weekly_share;

    // Reset the counters for the next week
    game_account.daily_top_wins = 0;
    game_account.daily_bottom_wins = 0;
    game_account.last_weekly_settlement = current_time;

    Ok(())
}
