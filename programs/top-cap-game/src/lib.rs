use anchor_lang::prelude::*;
pub mod instructions;
pub mod error;

declare_id!("2Mwjugz5ULsLFiArfw6d1xHrGnuCfzW3CXor2x9SBziB");

#[program]
pub mod marketcap_game {
    use super::*;

    pub fn initialize_game(ctx: Context<InitializeGame>, initial_supply: u64) -> Result<()> {
        instructions::initialize_game(ctx, initial_supply)
    }

    pub fn update_market_cap(ctx: Context<UpdateMarketCap>, token: Token, market_cap: u64) -> Result<()> {
        instructions::update_market_cap(ctx, token, market_cap)
    }

    pub fn settle_daily_epoch(ctx: Context<SettleDailyEpoch>) -> Result<()> {
        instructions::settle_daily_epoch(ctx)
    }

    pub fn settle_weekly_epoch(ctx: Context<SettleWeeklyEpoch>) -> Result<()> {
        instructions::settle_weekly_epoch(ctx)
    }
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(init, payer = user, space = 8 + 112)]
    pub game_account: Account<'info, GameAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMarketCap<'info> {
    #[account(mut)]
    pub game_account: Account<'info, GameAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleDailyEpoch<'info> {
    #[account(mut)]
    pub game_account: Account<'info, GameAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleWeeklyEpoch<'info> {
    #[account(mut)]
    pub game_account: Account<'info, GameAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
pub struct GameAccount {
    pub top_market_cap: u64,
    pub bottom_market_cap: u64,
    pub daily_top_wins: u8,
    pub daily_bottom_wins: u8,
    pub daily_winner: Pubkey,
    pub weekly_winner: Pubkey,
    pub fees_collected: u64,
    pub last_daily_settlement: i64,
    pub last_weekly_settlement: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum Token {
    Top,
    Bottom,
}
