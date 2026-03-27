import { convertToAttoHUST } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const mintBtn = document.getElementById('mint-btn');
    if (!mintBtn) return;

    mintBtn.addEventListener('click', async () => {
        const toAccount = document.getElementById('mint-to').value.trim();
        const amountStr = document.getElementById('mint-amount').value.trim();
        const denominator = document.getElementById('mint-denominator').value;

        if (!toAccount || !amountStr) {
            alert("Please provide both target address and amount to mint.");
            return;
        }

        let amountAttoHust = 0n;
        try {
            amountAttoHust = convertToAttoHUST(amountStr, denominator);
        } catch (e) {
            alert("Invalid amount format.");
            return;
        }

        try {
            mintBtn.disabled = true;
            mintBtn.textContent = 'Minting...';

            const payload = {
                to_account: toAccount,
                amount: amountAttoHust.toString()
            };

            const response = await fetch('/api/mint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                alert("Mint successful!" + (data.tx_hash ? " Transaction hash: " + data.tx_hash : ""));
                document.getElementById('mint-to').value = '';
                document.getElementById('mint-amount').value = '';
            } else {
                let errMessage = response.statusText;
                try {
                    const errData = await response.json();
                    if (errData.error) errMessage = errData.error;
                } catch (e) { }
                alert("Mint failed: " + errMessage);
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred while minting.");
        } finally {
            mintBtn.disabled = false;
            mintBtn.textContent = 'Mint Tokens';
        }
    });
});
