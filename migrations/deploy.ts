import * as anchor from "@project-serum/anchor";
import { Program, web3 } from "@project-serum/anchor";
import { MarketcapGame } from "../target/types/marketcap_game";

async function main() {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the program to deploy
  const program = anchor.workspace.MarketcapGame as Program<anchor.Idl>; // Change to `anchor.Idl` to satisfy the constraint

  console.log("Deploying program...");

  // Generate keypairs for state and token accounts
  const stateKeypair = web3.Keypair.generate();

  // Deploy the program
  try {
    const transaction = await program.methods.initializeGame(new anchor.BN(60))
      .accounts({
        gameAccount: stateKeypair.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
        // Removed `rent` as it's not a valid property in this context
      })
      .signers([stateKeypair])
      .rpc();
    
    console.log("Program deployed successfully. Transaction Signature:", transaction);
  } catch (error) {
    console.error("Failed to deploy program:", error);
  }
}

console.log("Starting deployment...");
main().then(() => {
  console.log("Deployment script finished.");
}).catch(error => {
  console.error("Deployment script encountered an error:", error);
});
