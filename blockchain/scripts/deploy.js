import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);

  // Load the compiled artifact
  const artifact = await hre.artifacts.readArtifact("PaymentProcessor");

  // Deploy using ethers directly
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`PaymentProcessor deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
