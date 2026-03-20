/* Define an object for managing wallets */

const ERC20_ABI = [
    // Read-Only Functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",

    // Authenticated Functions
    "function transfer(address to, uint256 amount) returns (bool)",
    "function authorize(address spender, uint256 amount) returns (bool)", // sometimes called approve
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint256 amount)",
    "event Approval(address indexed owner, address indexed spender, uint256 amount)"
];

const WalletManager = {
    provider: null,
    signer: null,
    contractAddress: "0x5f436F27c233490c6023dDbe2800d49d781A22dD",
    contract: null,
    address: null,

    async init() {
        if (window.ethereum == null) {
            console.log("You haven't installed MetaMask! Please install it.");
            return;
        } else {
            this.provider = new ethers.BrowserProvider(window.ethereum);
        }
        this.contract = new ethers.Contract(this.contractAddress, ERC20_ABI, this.provider);

        // Check if wallet is already connected from a previous page and it is the same as the one in the database
        const { ok, data: user } = await api("GET", "/api/me");
        const accounts = await this.provider.send("eth_accounts", []);

        // Safely check if the request was OK, if the user has an address saved somewhere in accounts.
        // If yes, then set the signer and address and contract to the correct address inside accounts.
        if (ok && user.address && accounts.length > 0) {
            this.signer = await this.provider.getSigner();
            this.address = accounts[0];
            this.contract = new ethers.Contract(this.contractAddress, ERC20_ABI, this.signer);

            // Re-render the current page to reflect the active connection
            const page = currentPage();
            if (page === 'dashboard') initDashboard();
            if (page === 'wallet') initWallet();
            if (page === 'transfer' || page === 'burn') { // reload selects
                const sel = document.getElementById(page + "-from");
                if (sel && sel.options.length === 1) {
                    const opt = document.createElement("option");
                    opt.value = this.address; opt.textContent = this.address;
                    sel.appendChild(opt);
                }
            }
        }
    },

    async connect() {
        if (!this.provider) return;

        await this.provider.send("eth_requestAccounts", []);
        this.signer = await this.provider.getSigner();
        this.address = await this.signer.getAddress();
        await fetch("/api/add-wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: this.address }),
        });
        flash("Connect successfully!");

        // Refresh the page data if you want automatically when connected
        if (currentPage() === 'dashboard') initDashboard();
    },

    async getWallets() {
        if (!this.signer) return [];
        return [this.address];
    },

    async getBalanceOf() {
        if (!this.contract || !this.address) return "0";
        // MetaMask/Ethers returns balances as a BigInt. We format it to standard decimals (18 defaults for ERC20).
        const rawBalance = await this.contract.balanceOf(this.address);
        return ethers.formatUnits(rawBalance, 18);
    },

    async transfer(to, amount) {
        amountInEther = ethers.parseUnits(amount, 9);
        const tx = await this.contract.transfer(to, amountInEther);
        await tx.wait();
        flash("Transfer successfully!");
        return tx.hash;
    },

    async burn(amount) {
        amountInEther = ethers.parseUnits(amount, 9);
        const tx = await this.contract.burn(amountInEther);
        await tx.wait();
        flash("Burn successfully!");
        return tx.hash;
    }
};

// Expose the global connect function to HTML button
window.connectWallet = () => WalletManager.connect();
