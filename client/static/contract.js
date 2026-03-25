import { ethers } from "./ethers.min.js";

export const CONTRACT_ADDRESS = "0x5f436F27c233490c6023dDbe2800d49d781A22dD";

export const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address _owner) view returns (uint256 balance)",
    "function transfer(address _to, uint256 _value) returns (bool success)",
    "function transferFrom(address _from, address _to, uint256 _value) returns (bool success)",
    "function approve(address _spender, uint256 _value) returns (bool success)",
    "function allowance(address _owner, address _spender) view returns (uint256 remaining)",
    "function mint(address _to, uint256 _value) returns (bool success)",
    "function burn(uint256 _value) returns (bool success)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];


class ContractWrapper {
    constructor(contractAddress, contractAbi) {
        this.contractAddress = contractAddress;
        this.contractAbi = contractAbi;
        this.decimals = 0;
        this.symbol = "";
    }

    get contract() {
        const runner = (window.wallet && window.wallet.signer) ? window.wallet.signer : (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
        return new ethers.Contract(this.contractAddress, this.contractAbi, runner);
    }

    async transfer(to, amount) {
        const tx = await this.contract.transfer(to, amount);
        await tx.wait();
        return tx.hash;
    }

    async burn(amount) {
        const tx = await this.contract.burn(amount);
        await tx.wait();
        return tx.hash;
    }

    async mint(to, amount) {
        const tx = await this.contract.mint(to, amount);
        await tx.wait();
        return tx.hash;
    }

    async getBalance(address) {
        const balance = await this.contract.balanceOf(address);
        if (this.decimals === 0) {
            this.decimals = await this.contract.decimals();
        }
        return [balance, this.decimals];
    }

    async getSymbol() {
        this.symbol = await this.contract.symbol();
        return this.symbol
    }

    formatBalance(balance, decimals) {
        return ethers.formatUnits(balance, decimals);
    }
}

window.contract = new ContractWrapper(CONTRACT_ADDRESS, ERC20_ABI);