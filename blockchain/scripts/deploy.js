import hre from "hardhat";
import { ethers } from "ethers";
import "dotenv/config";

async function main() {
  let provider;
  let signer;

  const isSepolia = process.argv.includes("sepolia") || hre.network?.name === "sepolia";

  if (isSepolia) {
    const rpcUrl = process.env.ALCHEMY_SEPOLIA_URL;
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
      throw new Error(
        "Missing environment variables! Please ensure ALCHEMY_SEPOLIA_URL and SEPOLIA_PRIVATE_KEY are defined in your blockchain/.env file."
      );
    }
    provider = new ethers.JsonRpcProvider(rpcUrl);
    signer = new ethers.Wallet(privateKey, provider);
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
