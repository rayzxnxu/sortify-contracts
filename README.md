# 🗂️ sortify-contracts

**Smart Contract & IPFS untuk Proyek Kuliah Sortify — Edukasi Pilah Sampah**

Repositori ini merupakan bagian dari ekosistem **Sortify**, sebuah aplikasi edukasi berbasis Web3 yang membantu pengguna belajar memilah sampah dengan benar melalui kartu digital (NFT ERC-1155). Repositori ini secara khusus mengelola pengembangan smart contract `SortifyCards`, deployment ke jaringan Ethereum Sepolia Testnet, pengelolaan metadata kartu di IPFS via Pinata, serta automated testing berbasis Hardhat.

---

### 🔗 Repositori Terkait

| Repositori                                                       | Deskripsi                                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [sortify-ai](https://github.com/rayzxnxu/sortify-ai)             | Model AI (CNN + SVM + LLM) untuk klasifikasi gambar sampah via FastAPI |
| [sortify-frontend](https://github.com/rayzxnxu/sortify-frontend) | Antarmuka Web3 (React + MetaMask + Ethers.js) untuk interaksi pengguna |

---

### 🔄 Diagram Alur Integrasi

```
┌─────────────────────────────────────┐
│          sortify-frontend           │
│   (React + MetaMask / Ethers.js)    │
└──────────────┬──────────────────────┘
               │  1. Pengguna minta mint kartu
               │     (panggil mintCard via Ethers.js)
               ▼
┌─────────────────────────────────────┐
│   Smart Contract SortifyCards       │
│   ERC-1155 — Ethereum Sepolia       │
│   0xb3805146...837674B              │
└──────────┬────────────┬─────────────┘
           │            │
           │ 2. Validasi│ 3. Emit event
           │    kuota & │    CardMinted
           │    akses   │
           ▼            ▼
┌────────────────┐  ┌────────────────────────────────┐
│ On-chain State │  │  IPFS (Pinata)                 │
│ currentSupply  │  │  Metadata JSON + Gambar kartu  │
│ maxQuota       │  │  ipfs://bafkrei...              │
│ _cardURIs      │  └────────────────────────────────┘
└────────────────┘       ▲
                         │ 4. Frontend ambil metadata
                         │    via uri(tokenId)
                         └──────────────────────────
```

---

## 📋 Spesifikasi Smart Contract Ter-deploy

| Properti                  | Nilai                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Nama Kontrak**          | `SortifyCards`                                                                                                                  |
| **Standar Token**         | ERC-1155 (Multi-Token Standard)                                                                                                 |
| **Jaringan**              | Ethereum Sepolia Testnet                                                                                                        |
| **Chain ID**              | `11155111`                                                                                                                      |
| **Alamat Kontrak**        | [`0xb3805146AA3d936934De0ebDEeb471668837674B`](https://sepolia.etherscan.io/address/0xb3805146AA3d936934De0ebDEeb471668837674B) |
| **Owner & Kurator Aktif** | `0x7DA6773D75c7aCCeCa36b8137dcd49736F7d0352`                                                                                    |

---

### 🃏 Daftar Kartu Edukasi

| Token ID | Nama Kartu        | Deskripsi                                                                        | Kuota Maks | Metadata IPFS                                                                                               |
| :------: | ----------------- | -------------------------------------------------------------------------------- | :--------: | ----------------------------------------------------------------------------------------------------------- |
|   `#1`   | **Organik**       | Sampah dari bahan hayati yang dapat terurai secara biologis (sisa makanan, daun) |    100     | [`ipfs://bafkrei...437m`](https://ipfs.io/ipfs/bafkreihvgmf3kn42uaoizn77rdctjj2haixn5qmji6a3nhukkcqb7v437m) |
|   `#2`   | **Anorganik**     | Sampah nonhayati yang tidak termasuk kelompok organik (plastik, logam)           |    100     | [`ipfs://bafkrei...lkf4`](https://ipfs.io/ipfs/bafkreihxriv2ve75shjk6boqtpcnorzumunaino75ogvegasd7px3blkf4) |
|   `#3`   | **Sampah Kertas** | Sampah berbahan kertas atau karton sebagai kelas edukasi tersendiri              |    100     | [`ipfs://bafkrei...h7ja`](https://ipfs.io/ipfs/bafkreifryq5wyvjxo7pwqn2wdtay4caucxjk2wzf7yezupcxvayi42h7ja) |

---

## ⚙️ Fitur & Fungsi Utama Smart Contract

Kontrak `SortifyCards` mewarisi `ERC1155` dan `Ownable` dari OpenZeppelin, dengan tambahan logika kontrol akses berbasis kurator.

### State Variables

| Variabel        | Tipe                          | Keterangan                                 |
| --------------- | ----------------------------- | ------------------------------------------ |
| `isCurator`     | `mapping(address => bool)`    | Status kurator per alamat                  |
| `maxQuota`      | `mapping(uint256 => uint256)` | Kuota maksimum mint per token ID           |
| `currentSupply` | `mapping(uint256 => uint256)` | Jumlah token yang sudah diterbitkan per ID |
| `_cardURIs`     | `mapping(uint256 => string)`  | URI metadata IPFS per token ID (private)   |

### Events

| Event            | Parameter                                                           | Kapan Dipancarkan                  |
| ---------------- | ------------------------------------------------------------------- | ---------------------------------- |
| `CuratorUpdated` | `address curator`, `bool status`                                    | Saat owner mengubah status kurator |
| `CardQuotaSet`   | `uint256 cardId`, `uint256 quota`                                   | Saat kuota kartu ditetapkan        |
| `CardURIUpdated` | `uint256 cardId`, `string tokenURI`                                 | Saat URI metadata kartu diperbarui |
| `CardMinted`     | `address curator`, `address to`, `uint256 cardId`, `uint256 amount` | Saat kartu berhasil diterbitkan    |

### Modifier & Kontrol Akses

| Modifier                     | Aturan                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `onlyOwner` _(dari Ownable)_ | Hanya `owner` kontrak yang dapat memanggil fungsi bertanda ini                                                        |
| `onlyCurator`                | Dapat dipanggil oleh `owner` **atau** alamat yang telah didaftarkan sebagai kurator (`isCurator[msg.sender] == true`) |

### Fungsi-Fungsi Utama

#### `setCurator(address _curator, bool _status)` — `onlyOwner`

Mendaftarkan atau mencabut status kurator pada suatu alamat. Alamat zero dilarang. Memancarkan event `CuratorUpdated`.

#### `setCardQuota(uint256 _cardId, uint256 _quota)` — `onlyCurator`

Menetapkan kuota maksimum untuk sebuah token ID. **Kuota hanya dapat diatur sekali** — jika sudah diatur sebelumnya, transaksi akan di-revert (`"Sortify: Kuota kartu sudah diatur sebelumnya"`). Kuota harus lebih dari 0. Memancarkan event `CardQuotaSet`.

#### `setCardURI(uint256 _cardId, string _tokenURI)` — `onlyCurator`

Menyimpan URI metadata IPFS untuk token ID tertentu. URI tidak boleh kosong. Memancarkan event `CardURIUpdated`.

#### `uri(uint256 _cardId)` — `public view`

Mengembalikan URI metadata token. Jika URI kustom telah diatur via `setCardURI`, maka URI tersebut dikembalikan. Jika tidak, fallback ke URI default ERC-1155 bawaan.

#### `mintCard(address _to, uint256 _cardId, uint256 _amount)` — `onlyCurator`

Menerbitkan sejumlah `_amount` token dengan ID `_cardId` ke alamat `_to`. Validasi mencakup:

- Jumlah penerbitan harus > 0
- Kuota kartu harus sudah diatur
- `currentSupply[_cardId] + _amount` tidak boleh melebihi `maxQuota[_cardId]`

Memancarkan event `CardMinted`.

---

## 🛠️ Tech Stack

| Komponen                         | Teknologi & Versi                                        |
| -------------------------------- | -------------------------------------------------------- |
| **Bahasa Smart Contract**        | Solidity `^0.8.20` (dikompilasi dengan `0.8.28`)         |
| **Framework Development**        | Hardhat `^3.21.2`                                        |
| **Plugin Hardhat**               | `@nomicfoundation/hardhat-toolbox-mocha-ethers` `^4.0.0` |
| **Ignition (Deployment Module)** | `@nomicfoundation/hardhat-ignition` `^3.1.9`             |
| **Standar Kontrak**              | OpenZeppelin Contracts `^5.6.1`                          |
| **Library Web3**                 | Ethers.js `^6.17.0`                                      |
| **Viem**                         | `^2.57.17`                                               |
| **Testing Framework**            | Mocha + Chai `^5.3.3`                                    |
| **Bahasa Scripting**             | TypeScript `~6.0.3` / JavaScript (ESM)                   |
| **Penyimpanan Metadata**         | IPFS via Pinata (gambar & metadata JSON)                 |
| **Jaringan Deploy**              | Ethereum Sepolia Testnet                                 |

---

## 📁 Struktur Folder

```
sortify-contracts/
├── contracts/
│   └── SortifyCards.sol          # Kontrak utama ERC-1155
├── scripts/
│   ├── deploy.js                 # Deploy kontrak + inisialisasi + ekspor ABI
│   ├── initContract.js           # Inisialisasi kontrak yang sudah ter-deploy
│   └── setCurator.js             # Tambah kurator baru ke kontrak
├── test/
│   └── SortifyCards.test.js      # 12 skenario automated testing
├── metadata/
│   ├── 1.json                    # Metadata lokal kartu Organik
│   ├── 2.json                    # Metadata lokal kartu Anorganik
│   └── 3.json                    # Metadata lokal kartu Sampah Kertas
├── ignition/
│   └── modules/
│       └── Counter.ts            # Modul Hardhat Ignition (referensi)
├── artifacts/                    # Output kompilasi Hardhat (auto-generated)
├── cache/                        # Cache kompilasi Hardhat (auto-generated)
├── types/                        # TypeChain type definitions (auto-generated)
├── SortifyCards-frontend.json    # ABI + alamat kontrak untuk frontend
├── hardhat.config.ts             # Konfigurasi Hardhat (Solidity, jaringan)
├── package.json                  # Dependensi proyek
├── tsconfig.json                 # Konfigurasi TypeScript
└── .gitignore
```

---

## ✅ Prasyarat

Pastikan perangkat lunak berikut telah terinstal:

- [Node.js](https://nodejs.org/) `v18` atau lebih baru
- [npm](https://www.npmjs.com/) (tersedia bersama Node.js)
- Wallet Ethereum dengan saldo Sepolia ETH (dapatkan dari [Sepolia Faucet](https://sepoliafaucet.com/))
- Akun [Pinata](https://pinata.cloud/) untuk unggah metadata/gambar ke IPFS (opsional, hanya jika menambah kartu baru)

---

## 📦 Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/rayzxnxu/sortify-contracts.git
cd sortify-contracts

# 2. Install dependensi
npm install
```

### Konfigurasi Environment

Buat file `.env` di root proyek berdasarkan template berikut (jangan pernah commit file `.env` asli ke repositori):

```env
# .env.example

# URL RPC untuk jaringan Sepolia (dari Infura, Alchemy, dsb.)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Private key akun Ethereum untuk deployment (JANGAN DIBAGIKAN)
PRIVATE_KEY=your_private_key_here

# (Opsional) API Key Pinata untuk upload file ke IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# (Opsional) API Key Etherscan untuk verifikasi kontrak
ETHERSCAN_API_KEY=your_etherscan_api_key
```

> [!CAUTION] > **JANGAN PERNAH** menyertakan nilai nyata private key, mnemonic, atau API key rahasia di file yang di-commit ke repositori. File `.env` sudah tercantum di `.gitignore`.

---

## 🚀 Cara Menjalankan

### 1. Compile Kontrak

```bash
npx hardhat compile
```

Output kompilasi akan tersimpan di folder `artifacts/`.

---

### 2. Menjalankan Automated Testing

```bash
npx hardhat test
```

Perintah ini menjalankan seluruh 12 skenario pengujian di `test/SortifyCards.test.js`:

| No. | Skenario Pengujian                                             |
| :-: | -------------------------------------------------------------- |
|  1  | ✅ Owner dapat menetapkan akun Kurator                         |
|  2  | ✅ Kurator dapat mengatur kuota kartu digital                  |
|  3  | ✅ Mint oleh akun berwenang (Kurator) berhasil                 |
|  4  | ✅ Mint tanpa hak akses (non-kurator) ditolak                  |
|  5  | ✅ Mint ditolak saat kuota kartu belum diatur                  |
|  6  | ✅ Mint ditolak saat kuota habis atau melebihi batas           |
|  7  | ✅ Mint dengan jumlah penerbitan tidak valid (0) ditolak       |
|  8  | ✅ Transfer kartu berhasil saat saldo mencukupi                |
|  9  | ✅ Transfer tanpa saldo mencukupi ditolak                      |
| 10  | ✅ Validasi penyimpanan dan pembacaan Token URI IPFS           |
| 11  | ✅ Validasi event `CardMinted` terpancar saat penerbitan kartu |
| 12  | ✅ Validasi transaction receipt dan pencatatan gas fee         |

---

### 3. Deploy ke Sepolia

Script `deploy.js` melakukan seluruh proses dalam satu langkah: deploy kontrak, set kurator (deployer), set kuota 100 untuk kartu ID 1–3, set URI metadata IPFS, dan mengekspor file frontend.

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

### 4. Inisialisasi Kontrak yang Sudah Ter-deploy

Jika kontrak sudah ter-deploy dan hanya perlu diinisialisasi ulang (set kurator, kuota, URI):

```bash
npx hardhat run scripts/initContract.js --network sepolia
```

> [!NOTE]
> Pastikan variabel `contractAddress` di dalam `scripts/initContract.js` sudah sesuai dengan alamat kontrak yang ter-deploy.

---

### 5. Menambah Kurator Baru

```bash
npx hardhat run scripts/setCurator.js --network sepolia
```

> [!NOTE]
> Edit variabel `dindaAddress` di dalam `scripts/setCurator.js` untuk menambah alamat kurator yang diinginkan.

---

### 6. Ekspor ABI & Alamat Kontrak ke Frontend

Ekspor ABI dan alamat kontrak dilakukan **otomatis** di akhir eksekusi `scripts/deploy.js` maupun `scripts/initContract.js`. File hasil ekspor tersimpan di:

```
SortifyCards-frontend.json
```

Untuk integrasi dengan repositori `sortify-frontend`, salin file tersebut ke:

```
sortify-frontend/src/contracts/SortifyCards-frontend.json
```

Format file ekspor:

```json
{
  "address": "0xb3805146AA3d936934De0ebDEeb471668837674B",
  "abi": [
    /* ... ABI ERC-1155 SortifyCards ... */
  ]
}
```

---

## ⛽ Pencatatan & Evaluasi Gas Fee

**Jaringan:** Ethereum Sepolia Testnet | **Volume Mint:** 1 unit kartu per transaksi

| Token ID | Kartu            | Tx Hash (Ringkas)                                                                                                             |    Blok    | Gas Used | Gas Price        | Tx Fee                   |   Status   |
| :------: | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | :--------: | :------: | ---------------- | ------------------------ | :--------: |
|   `#1`   | Sampah Organik   | [`0x0912cbe6...fab23c8f`](https://sepolia.etherscan.io/tx/0x0912cbe6bab264eef35be8fae1aa6afa301d800c5658a7e5a8236992fab23c8f) | 12.202.971 | 254.714  | 1,500000016 Gwei | 0,000382071004075424 ETH | ✅ Success |
|   `#2`   | Sampah Anorganik | [`0x805f6098...c8d7b278`](https://sepolia.etherscan.io/tx/0x805f60981b2b1e75576d4be575bc563dead968f9d1f3563fc4337ab7c8d7b278) | 12.202.895 | 254.714  | 1,500000017 Gwei | 0,000382071004330138 ETH | ✅ Success |
|   `#3`   | Sampah Kertas    | [`0x4216196f...e82f9dc6`](https://sepolia.etherscan.io/tx/0x4216196f9e25f4b3e7d7ccf47fa53f100f4cb1dfce5be3507284fe3de82f9dc6) | 12.203.002 | 254.714  | 1,500000017 Gwei | 0,000382071004330138 ETH | ✅ Success |

**Ringkasan:**

| Metrik                  | Nilai         |
| ----------------------- | ------------- |
| Total Transaksi         | 3             |
| Total Gas Used          | 764.142 unit  |
| Total Tx Fee            | ~0,001146 ETH |
| Rata-rata Gas per Kartu | 254.714 unit  |
| Rata-rata Fee per Kartu | ~0,000382 ETH |

---

## 👥 Tim Pengembang Sortify

| Nama               | Peran                        | Tanggung Jawab                                                                                                                           |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Sri Wahyuni**    | AI Engineer                  | Persiapan dataset, preprocessing, pelatihan CNN, implementasi SVM, integrasi LLM, evaluasi model, dan API FastAPI                        |
| **Dika Saputri**   | Blockchain & IPFS Developer  | Pengembangan smart contract ERC-1155, kontrol akses, aturan kuota, integrasi IPFS, automated testing, deployment, dan pencatatan gas fee |
| **Dinda Triamita** | Frontend & Web3 Developer    | Struktur repository, pengembangan frontend, integrasi API AI, koneksi MetaMask, Ethers.js, galeri kartu, dan riwayat transaksi           |
| **Dela Saputri**   | UI/UX Designer & Dokumentasi | Perancangan user flow, wireframe, desain Figma, pengujian usability, dokumentasi, laporan, slide presentasi, dan video demonstrasi       |
