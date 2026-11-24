import { network } from "hardhat";
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const { ethers } = await network.getOrCreate();
const [deployer] = await ethers.getSigners();

console.log("=== Memulai Deploy Kontrak SortifyCards ===");
console.log(`Deployer / Owner: ${deployer.address}`);

// 1. Deploy kontrak SortifyCards
const SortifyCards = await ethers.getContractFactory("SortifyCards");
const sortifyCards = await SortifyCards.deploy();
await sortifyCards.waitForDeployment();

const contractAddress = await sortifyCards.getAddress();
const deployReceipt = await sortifyCards.deploymentTransaction().wait();

console.log(`SortifyCards berhasil di-deploy ke alamat: ${contractAddress}`);
console.log(`Gas used saat deployment: ${deployReceipt.gasUsed.toString()}`);

// 2. Set deployer sebagai kurator agar bisa minting kartu
console.log("\n--- Mengatur Kurator ---");
const txCurator = await sortifyCards.setCurator(deployer.address, true);
await txCurator.wait();
console.log(`setCurator untuk ${deployer.address}: true (sukses)`);

// 3. Set kuota kartu untuk ID 1, 2, dan 3 dengan nilai 100
console.log("\n--- Mengatur Kuota Kartu ---");
const cardIds = [1, 2, 3];
const quotaValue = 100;

for (const id of cardIds) {
    const txQuota = await sortifyCards.setCardQuota(id, quotaValue);
    await txQuota.wait();
    console.log(`setCardQuota untuk ID ${id}: ${quotaValue} (sukses)`);
}

// 4. Set token URI untuk ID 1, 2, dan 3 (CID JSON baru dari Pinata)
console.log("\n--- Mengatur URI Kartu ---");
const cardURIs = {
    1: "ipfs://bafkreihvgmf3kn42uaoizn77rdctjj2haixn5qmji6a3nhukkcqb7v437m",
    2: "ipfs://bafkreihxriv2ve75shjk6boqtpcnorzumunaino75ogvegasd7px3blkf4",
    3: "ipfs://bafkreifryq5wyvjxo7pwqn2wdtay4caucxjk2wzf7yezupcxvayi42h7ja",
};

for (const id of cardIds) {
    const uri = cardURIs[id];
    const txURI = await sortifyCards.setCardURI(id, uri);
    await txURI.wait();
    console.log(`setCardURI untuk ID ${id}: ${uri} (sukses)`);
}

// 5. Ekspor alamat kontrak dan ABI ke SortifyCards-frontend.json di root folder
console.log("\n--- Mengekspor Konfigurasi Frontend ---");
const artifactPath = path.resolve(
    rootDir,
    "artifacts/contracts/SortifyCards.sol/SortifyCards.json"
);

const artifactRaw = await fs.readFile(artifactPath, "utf-8");
const artifact = JSON.parse(artifactRaw);

const frontendData = {
    address: contractAddress,
    abi: artifact.abi,
};

const frontendOutputPath = path.resolve(rootDir, "SortifyCards-frontend.json");
await fs.writeFile(
    frontendOutputPath,
    JSON.stringify(frontendData, null, 2),
    "utf-8"
);

console.log(`File frontend berhasil dibuat di: ${frontendOutputPath}`);
console.log("=== Deployment dan Inisialisasi Selesai ===");