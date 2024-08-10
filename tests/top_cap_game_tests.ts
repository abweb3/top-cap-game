import * as anchor from "@project-serum/anchor";
import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import { createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
    // Generate the payer keypair which will be used for mint creation
    const payer = Keypair.generate();

    // Create the mint accounts
    bottomToken = await createMintAccount(provider, payer);
    topToken = await createMintAccount(provider, payer);

    // Generate the state and user account keypairs
    state = Keypair.generate();
    userAccount = Keypair.generate();

    // Initialize the program's state
    await program.methods
      .initialize(new anchor.BN(60), new anchor.BN(1000))
      .accounts({
        state: state.publicKey, // State public key
        bottomToken: bottomToken, // Bottom token mint
        topToken: topToken, // Top token mint
        user: provider.wallet.publicKey, // User public key
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([state])
      .rpc();

    // Initialize the tokens in the program
    await program.methods
      .initializeTokens()
      .accounts({
        bottomToken: bottomToken, // Bottom token mint
        topToken: topToken, // Top token mint
        user: provider.wallet.publicKey, // User public key
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
        state: state.publicKey, // State public key
        bottomToken: bottomToken, // Bottom token mint
        topToken: topToken, // Top token mint
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
        state: state.publicKey, // State public key
        bottomToken: bottomToken, // Bottom token mint
        topToken: topToken, // Top token mint
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
        state: state.publicKey, // State public key
        rewardsAccount: provider.wallet.publicKey, // Wallet public key
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const stateAccount = await program.account.state.fetch(state.publicKey);
    console.log("State after rewards distribution:", stateAccount);
    assert.isAbove(stateAccount.rewardPool.toNumber(), 0);
  });

  // Function to create a mint account
  async function createMintAccount(
    provider: anchor.AnchorProvider,
    payer: Keypair // Use the Keypair as the payer for mint creation
  ): Promise<PublicKey> {
    const mint = await createMint(
      provider.connection,
      payer, // The payer must be a Keypair
      provider.wallet.publicKey, // The mint authority can be a PublicKey
      null,
      9,
      TOKEN_PROGRAM_ID
    );
    return mint;
  }
});
