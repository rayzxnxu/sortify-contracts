import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("SortifyCards - 12 Skenario Automated Testing", function () {
  let sortify, owner, curator, user, otherUser;

  beforeEach(async function () {
    [owner, curator, user, otherUser] = await ethers.getSigners();
    const Sortify = await ethers.getContractFactory("SortifyCards");
    sortify = await Sortify.deploy();
  });

  it("1. Owner dapat menetapkan akun Kurator", async function () {
    await sortify.setCurator(curator.address, true);
    expect(await sortify.isCurator(curator.address)).to.equal(true);
  });

  it("2. Kurator dapat mengatur kuota kartu digital", async function () {
    await sortify.setCurator(curator.address, true);
    await sortify.connect(curator).setCardQuota(1, 100);
    expect(await sortify.maxQuota(1)).to.equal(100n);
  });

  it("3. Mint oleh akun berwenang (Kurator) berhasil", async function () {
    await sortify.setCurator(curator.address, true);
    await sortify.connect(curator).setCardQuota(1, 50);

    await sortify.connect(curator).mintCard(user.address, 1, 10);
    expect(await sortify.balanceOf(user.address, 1)).to.equal(10n);
    expect(await sortify.currentSupply(1)).to.equal(10n);
  });

  it("4. Mint tanpa hak akses (non-kurator) ditolak", async function () {
    await sortify.setCardQuota(1, 50);

    await expect(
      sortify.connect(user).mintCard(user.address, 1, 1)
    ).to.be.revertedWith("Sortify: Anda bukan kurator");
  });

  it("5. Mint ditolak saat kuota kartu belum diatur", async function () {
    await sortify.setCurator(curator.address, true);

    await expect(
      sortify.connect(curator).mintCard(user.address, 99, 1)
    ).to.be.revertedWith("Sortify: Kuota kartu ini belum diatur");
  });

  it("6. Mint ditolak saat kuota habis atau melebihi batas", async function () {
    await sortify.setCurator(curator.address, true);
    await sortify.connect(curator).setCardQuota(1, 5);
    await sortify.connect(curator).mintCard(user.address, 1, 5);

    await expect(
      sortify.connect(curator).mintCard(user.address, 1, 1)
    ).to.be.revertedWith("Sortify: Kuota kartu tidak mencukupi");
  });

  it("7. Mint dengan jumlah penerbitan tidak valid (0) ditolak", async function () {
    await sortify.setCurator(curator.address, true);
    await sortify.connect(curator).setCardQuota(1, 10);

    await expect(
      sortify.connect(curator).mintCard(user.address, 1, 0)
    ).to.be.revertedWith("Sortify: Jumlah penerbitan tidak valid");
  });

  it("8. Transfer kartu berhasil saat saldo mencukupi", async function () {
    await sortify.setCardQuota(1, 10);
    await sortify.mintCard(user.address, 1, 3);

    await sortify.connect(user).safeTransferFrom(user.address, otherUser.address, 1, 2, "0x");
    expect(await sortify.balanceOf(user.address, 1)).to.equal(1n);
    expect(await sortify.balanceOf(otherUser.address, 1)).to.equal(2n);
  });

  it("9. Transfer tanpa saldo mencukupi ditolak", async function () {
    await expect(
      sortify.connect(user).safeTransferFrom(user.address, otherUser.address, 1, 1, "0x")
    ).to.be.revertedWithCustomError(sortify, "ERC1155InsufficientBalance");
  });

  it("10. Validasi penyimpanan dan pembacaan Token URI IPFS", async function () {
    const sampleURI = "ipfs://bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";
    await sortify.setCardURI(1, sampleURI);

    expect(await sortify.uri(1)).to.equal(sampleURI);
  });

  it("11. Validasi event CardMinted terpancar saat penerbitan kartu", async function () {
    await sortify.setCardQuota(2, 20);

    await expect(sortify.mintCard(user.address, 2, 4))
      .to.emit(sortify, "CardMinted")
      .withArgs(owner.address, user.address, 2n, 4n);
  });

  it("12. Validasi transaction receipt dan pencatatan gas fee", async function () {
    await sortify.setCardQuota(3, 30);

    const tx = await sortify.mintCard(user.address, 3, 1);
    const receipt = await tx.wait();

    expect(receipt.status).to.equal(1);
    expect(receipt.gasUsed).to.be.greaterThan(0n);

    const gasCostWei = receipt.gasUsed * receipt.gasPrice;
    console.log(`      -> Gas Used (Mint): ${receipt.gasUsed.toString()} units | Biaya: ${ethers.formatEther(gasCostWei)} ETH`);
  });
});