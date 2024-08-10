import * as anchor from "@project-serum/anchor";
import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { before, describe, it } from "mocha";

describe("top-cap-game", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TopCapGame as anchor.Program;

  let state: Keypair;
  let bottomToken: PublicKey;
  let topToken: PublicKey;
  let userAccount: Keypair;

  before(async () => {
    bottomToken = await createMintAccount(provider);
    topToken = await createMintAccount(provider);

    state = anchor.web3.Keypair.generate();
    userAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(new anchor.BN(60), new anchor.BN(1000))
      .accounts({
        state: state.publicKey,
        bottomToken: bottomToken,
        topToken: topToken,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([state])
      .rpc();

    await program.methods
      .initializeTokens()
      .accounts({
        bottomToken: bottomToken,
        topToken: topToken,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([userAccount])
      .rpc();
  });

  it("Initializes the state", async () => {
    const stateAccount = await program.account.state.fetch(state.publicKey);
    console.log("State:", stateAccount);
    assert.equal(stateAccount.epochDuration.toNumber(), 60);
    assert.equal(stateAccount.maxReward.toNumber(), 1000);
  });

  it("Settles a daily epoch", async () => {
    await program.methods
      .settleDailyEpoch()
      .accounts({
        state: state.publicKey,
        bottomToken: bottomToken,
        topToken: topToken,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();

    const stateAccount = await program.account.state.fetch(state.publicKey);
    console.log("State after daily epoch settle:", stateAccount);
    assert.isAtLeast(stateAccount.dailyTopWins.toNumber(), 0);
    assert.isAtLeast(stateAccount.dailyBottomWins.toNumber(), 0);
  });

  it("Settles a weekly epoch", async () => {
    await program.methods
      .settleWeeklyEpoch()
      .accounts({
        state: state.publicKey,
        bottomToken: bottomToken,
        topToken: topToken,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .rpc();

    const stateAccount = await program.account.state.fetch(state.publicKey);
    console.log("State after weekly epoch settle:", stateAccount);
    assert.isNotNull(stateAccount.weeklyWinner);
  });

  it("Distributes rewards", async () => {
    await program.methods
      .distributeRewards()
      .accounts({
        state: state.publicKey,
        rewardsAccount: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const stateAccount = await program.account.state.fetch(state.publicKey);
    console.log("State after rewards distribution:", stateAccount);
    assert.isAbove(stateAccount.rewardPool.toNumber(), 0);
  });

  async function createMintAccount(
    provider: anchor.AnchorProvider
  ): Promise<PublicKey> {
    const mint = await createMint(
      provider.connection,
      provider.wallet.payer as Keypair,
      provider.wallet.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );
    return mint;
  }
});
