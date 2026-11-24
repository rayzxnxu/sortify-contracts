import { network } from "hardhat";
import fs from "node:fs/promises";
import path from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const rootDir = process.cwd();
const { ethers } = await network.getOrCreate();
const [deployer] = await ethers.getSigners();

const contractAddress = "0xb3805146AA3d936934De0ebDEeb471668837674B";
const sortifyCards = await ethers.getContractAt("SortifyCards", contractAddress);

console.log(`=== Melanjutkan Inisialisasi Kontrak: ${contractAddress} ===`);

// 1. Set deployer sebagai kurator
console.log("\n--- Mengatur Kurator ---");
const txCurator = await sortifyCards.setCurator(deployer.address, true);
await txCurator.wait(1);
console.log(`setCurator untuk ${deployer.address}: true (sukses)`);
await sleep(5000);

// 2. Set kuota kartu untuk ID 1, 2, dan 3
console.log("\n--- Mengatur Kuota Kartu ---");
const cardIds = [1, 2, 3];
const quotaValue = 100;

for (const id of cardIds) {
    const txQuota = await sortifyCards.setCardQuota(id, quotaValue);
    await txQuota.wait(1);
    console.log(`setCardQuota untuk ID ${id}: ${quotaValue} (sukses)`);
    await sleep(5000);
}

// 3. Set token URI untuk ID 1, 2, dan 3
console.log("\n--- Mengatur URI Kartu ---");
const cardURIs = {
    1: "ipfs://bafkreihvgmf3kn42uaoizn77rdctjj2haixn5qmji6a3nhukkcqb7v437m",
    2: "ipfs://bafkreihxriv2ve75shjk6boqtpcnorzumunaino75ogvegasd7px3blkf4",
    3: "ipfs://bafkreifryq5wyvjxo7pwqn2wdtay4caucxjk2wzf7yezupcxvayi42h7ja",
};

for (const id of cardIds) {
    const uri = cardURIs[id];
    const txURI = await sortifyCards.setCardURI(id, uri);
    await txURI.wait(1);
    console.log(`setCardURI untuk ID ${id}: ${uri} (sukses)`);
    await sleep(5000);
}

// 4. Ekspor alamat kontrak dan ABI ke SortifyCards-frontend.json
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
console.log("=== Inisialisasi Selesai ===");