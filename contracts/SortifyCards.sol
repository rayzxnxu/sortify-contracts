// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SortifyCards is ERC1155, Ownable {
    mapping(address => bool) public isCurator;
    mapping(uint256 => uint256) public maxQuota;
    mapping(uint256 => uint256) public currentSupply;
    mapping(uint256 => string) private _cardURIs;

    event CuratorUpdated(address indexed curator, bool status);
    event CardQuotaSet(uint256 indexed cardId, uint256 quota);
    event CardURIUpdated(uint256 indexed cardId, string tokenURI);
    event CardMinted(address indexed curator, address indexed to, uint256 indexed cardId, uint256 amount);

    modifier onlyCurator() {
        require(isCurator[msg.sender] || msg.sender == owner(), "Sortify: Anda bukan kurator");
        _;
    }

    constructor() ERC1155("") Ownable(msg.sender) {}

    function setCurator(address _curator, bool _status) external onlyOwner {
        require(_curator != address(0), "Sortify: Alamat kurator tidak valid");
        isCurator[_curator] = _status;
        emit CuratorUpdated(_curator, _status);
    }

    function setCardQuota(uint256 _cardId, uint256 _quota) external onlyCurator {
        require(_quota > 0, "Sortify: Kuota harus lebih dari 0");
        require(maxQuota[_cardId] == 0, "Sortify: Kuota kartu sudah diatur sebelumnya");
        maxQuota[_cardId] = _quota;
        emit CardQuotaSet(_cardId, _quota);
    }

    function setCardURI(uint256 _cardId, string calldata _tokenURI) external onlyCurator {
        require(bytes(_tokenURI).length > 0, "Sortify: URI tidak boleh kosong");
        _cardURIs[_cardId] = _tokenURI;
        emit CardURIUpdated(_cardId, _tokenURI);
    }

    function uri(uint256 _cardId) public view override returns (string memory) {
        string memory customURI = _cardURIs[_cardId];
        if (bytes(customURI).length > 0) {
            return customURI;
        }
        return super.uri(_cardId);
    }

    function mintCard(address _to, uint256 _cardId, uint256 _amount) external onlyCurator {
        require(_amount > 0, "Sortify: Jumlah penerbitan tidak valid");
        require(maxQuota[_cardId] > 0, "Sortify: Kuota kartu ini belum diatur");
        require(currentSupply[_cardId] + _amount <= maxQuota[_cardId], "Sortify: Kuota kartu tidak mencukupi");

        currentSupply[_cardId] += _amount;
        _mint(_to, _cardId, _amount, "");
        emit CardMinted(msg.sender, _to, _cardId, _amount);
    }
}