import { network } from "hardhat";
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const { ethers } = await network.getOrCreate();

console.log("=== Memulai Deploy Kontrak SortifyCards ===");

// 1. Deploy kontrak SortifyCards
const SortifyCards = await ethers.getContractFactory("SortifyCards");
const sortifyCards = await SortifyCards.deploy();
await sortifyCards.waitForDeployment();

const contractAddress = await sortifyCards.getAddress();
const deployReceipt = await sortifyCards.deploymentTransaction().wait();

console.log(`SortifyCards berhasil di-deploy ke alamat: ${contractAddress}`);
console.log(`Gas used saat deployment: ${deployReceipt.gasUsed.toString()}`);

// 2. Set kuota kartu untuk ID 1, 2, dan 3 dengan nilai 100
console.log("\n--- Mengatur Kuota Kartu ---");
const cardIds = [1, 2, 3];
const quotaValue = 100;

for (const id of cardIds) {
    const txQuota = await sortifyCards.setCardQuota(id, quotaValue);
    await txQuota.wait();
    console.log(`setCardQuota untuk ID ${id}: ${quotaValue} (sukses)`);
}

// 3. Set token URI untuk ID 1, 2, dan 3
// Ganti teks placeholder dengan CID lengkap masing-masing file JSON dari Pinata
console.log("\n--- Mengatur URI Kartu ---");
const cardURIs = {
    1: "ipfs://bafkreifob2cryllsifx6jj2ypjsl4n4d2rigid7y7wgpun6itgw3wntbae",
    2: "ipfs://bafkreiezw7uhdptbgfptsh3yfagiyze23cvwswfkg6kswf4r4fuhlapxrm",
    3: "ipfs://bafkreiaqm344aiib44rds55krur7lcx2r7lpsrnc6bdek4svp72nav4xpe",
};

for (const id of cardIds) {
    const uri = cardURIs[id];
    const txURI = await sortifyCards.setCardURI(id, uri);
    await txURI.wait();
    console.log(`setCardURI untuk ID ${id}: ${uri} (sukses)`);
}

// 4. Ekspor alamat kontrak dan ABI ke SortifyCards-frontend.json di root folder
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