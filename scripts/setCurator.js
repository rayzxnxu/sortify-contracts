import fs from "node:fs";
import { network } from "hardhat";

async function main() {
    // Ganti dengan alamat publik MetaMask milik Dinda
    const dindaAddress = "0x26B014fa42cb4EA038ec891FB71213b250f32297";

    const contractData = JSON.parse(
        fs.readFileSync("./SortifyCards-frontend.json", "utf8")
    );

    const { ethers } = await network.getOrCreate();
    const [owner] = await ethers.getSigners();

    console.log("Akun Owner:", owner.address);
    console.log("Kontrak Sepolia:", contractData.address);

    const sortifyCards = new ethers.Contract(
        contractData.address,
        contractData.abi,
        owner
    );

    // Menyesuaikan otomatis jika fungsi setCurator memakai 1 atau 2 parameter
    const setCuratorFn = contractData.abi.find(
        (item) => item.type === "function" && item.name === "setCurator"
    );

    const tx =
        setCuratorFn && setCuratorFn.inputs.length === 2
            ? await sortifyCards.setCurator(dindaAddress, true)
            : await sortifyCards.setCurator(dindaAddress);

    console.log("Mengirim transaksi ke Sepolia, hash:", tx.hash);
    await tx.wait();

    console.log(`Sukses! ${dindaAddress} resmi terdaftar sebagai kurator.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
