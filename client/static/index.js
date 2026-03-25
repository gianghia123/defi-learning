document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            if (response.status === 401) {
                // Not logged in, redirect to login
                window.location.href = '/login';
                return;
            }
            throw new Error('Failed to fetch user data');
        }

        const data = await response.json();

        if (window.wallet) {
            await window.wallet.restore();
        }

        document.getElementById('name').textContent = data.name || '---';

        // Populate Email
        document.getElementById('email').textContent = data.email || '---';

        // Populate Wallet Address Placeholder
        if (data.address) {
            const [balance, decimals] = await window.contract.getBalance(data.address);
            const symbol = await window.contract.getSymbol();
            const formattedBalance = window.contract.formatBalance(balance, decimals);

            document.getElementById('wallet-address').textContent = data.address;
            document.getElementById('balance').textContent = formattedBalance + ' ' + symbol;
        } else {
            document.getElementById('wallet-address').textContent = 'Not linked';
            document.getElementById('balance').textContent = '---';
        }

    } catch (error) {
        console.error('Error fetching profile data:', error);
        document.getElementById('email').textContent = 'Error loading data';
        document.getElementById('wallet-address').textContent = 'Error loading data';
        document.getElementById('balance').textContent = 'Error loading data';
    }
});
