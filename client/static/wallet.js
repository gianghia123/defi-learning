import { minimizeAddress } from './utils.js';

document.addEventListener("DOMContentLoaded", async () => {
    const connectBtn = document.getElementById("connect-wallet-btn");
    const title = document.getElementById("wallet-title");
    const subtitle = document.getElementById("wallet-subtitle");
    const actionContainer = document.getElementById("wallet-action-container");

    // Check if the WalletManager object exists in window.wallet
    if (window.wallet) {
        const isConnected = await window.wallet.restore();

        if (isConnected) {
            title.textContent = "Wallet Connected";
            subtitle.textContent = "Your WalletManager web3 connection is active.";
            const address = window.wallet.address;
            const [balance, decimals] = await window.contract.getBalance(address);
            const symbol = await window.contract.getSymbol();
            const formattedBalance = window.contract.formatBalance(balance, decimals);

            actionContainer.innerHTML = `
                <div class="toast toast-primary text-left" style="margin: 0 auto; max-width: 300px;">
                    <div><strong>Address:</strong> <span id="display-address">${minimizeAddress(address)}</span></div>
                    <div><strong>Balance:</strong> <span id="display-balance">${formattedBalance} ${symbol}</span></div>
                </div>
                <button class="btn btn-sm mt-2" id="disconnect-wallet-btn">Disconnect</button>
            `;

            document.getElementById("disconnect-wallet-btn").addEventListener("click", () => {
                window.wallet.disconnect();
                window.location.reload();
            });
        } else {
            // Not connected yet
            if (connectBtn) {
                connectBtn.addEventListener("click", async () => {
                    try {
                        const address = await window.wallet.connect();
                        const data = await fetch("/api/update-wallet", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ address }),
                        }).then(res => res.json());
                        if (data.success) {
                            window.location.href = "/index";
                        } else {
                            throw new Error("Failed to update wallet: " + data.message);
                        }
                    } catch (err) {
                        alert("Failed to connect: " + err.message);
                    }
                });
            }
        }
    }
});
