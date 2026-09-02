import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  let provider;
  let signer;

  if (hre.network.name === "sepolia") {
    if (!process.env.ALCHEMY_SEPOLIA_URL || !process.env.SEPOLIA_PRIVATE_KEY) {
      throw new Error("Please set ALCHEMY_SEPOLIA_URL and SEPOLIA_PRIVATE_KEY in your .env file");
    }
    provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
    signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
    console.log(`Deploying to Sepolia with account: ${signer.address}`);
  } else {
    // Default to local node
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    signer = await provider.getSigner(0);
    console.log(`Deploying to Localhost with account: ${await signer.getAddress()}`);
  }

  // Load the compiled artifact
  const artifact = await hre.artifacts.readArtifact("PaymentProcessor");

  // Deploy using ethers directly
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`PaymentProcessor deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
