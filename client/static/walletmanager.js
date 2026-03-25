import { ethers } from "./ethers.min.js";

class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
    }

    async connect() {
        let storedAddress = null;
        try {
            const response = await fetch('/api/me');
            if (response.ok) {
                const data = await response.json();
                storedAddress = data.address;
            }
        } catch (err) {
            console.error("Could not fetch user profile details", err);
        }

        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner(); // triggers popup
        const address = await this.signer.getAddress();
        
        if (storedAddress && storedAddress.toLowerCase() !== address.toLowerCase()) {
            throw new Error(`Connected wallet address does not match the stored address.`);
        }
        
        this.address = address;
        localStorage.setItem('wallet', this.address);
        this._attachListeners();
        return this.address;
    }

    async restore() {
        if (!localStorage.getItem('wallet')) return false;
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts.length) {
            localStorage.removeItem('wallet');
            return false;
        }
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.address = accounts[0];
        this._attachListeners();
        return true;
    }

    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        localStorage.removeItem('wallet');
    }

    _attachListeners() {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (!accounts.length) return this.disconnect();
            this.address = accounts[0];
        });
        window.ethereum.on('chainChanged', () => window.location.reload());
        window.ethereum.on('disconnect', () => this.disconnect());
    }
}

window.wallet = new WalletManager();