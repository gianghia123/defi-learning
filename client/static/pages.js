// ---------------------------------------------------------------------------
// Page initialisers
// ---------------------------------------------------------------------------

// -- Login ------------------------------------------------------------------
function initLogin() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = form.username.value.trim();
        const password = form.password.value.trim();
        const { ok, data } = await api("POST", "/login", { username, password });
        if (ok) {
            window.location.href = "/dashboard";
        } else {
            flash(data?.error || "Login failed", true);
        }
    });
}

// -- Register ---------------------------------------------------------------
function initRegister() {
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = form.username.value.trim();
        const password = form.password.value.trim();
        const password2 = form.password2.value.trim();
        if (password !== password2) {
            flash("Passwords do not match", true);
            return;
        }
        const { ok, data } = await api("POST", "/register", { username, password });
        if (ok) {
            flash("Account created! Please log in.");
            setTimeout(() => (window.location.href = "/login"), 1000);
        } else {
            flash(data?.error || "Registration failed", true);
        }
    });
}

// -- Dashboard --------------------------------------------------------------
async function initDashboard() {
    // User info
    const { ok, data: user } = await api("GET", "/api/me");
    if (!ok) return;

    document.getElementById("dash-username").textContent = user.username;
    document.getElementById("dash-role").textContent = user.is_admin ? "Administrator" : "User";

    // Wallets (from local storage placeholder)
    const wallets = await WalletManager.getWallets();
    const walletList = document.getElementById("dash-wallets");
    if (wallets.length === 0) {
        walletList.innerHTML = '<li class="empty">No wallets linked. <a href="/wallet">Add one →</a></li>';
    } else {
        walletList.innerHTML = wallets
            .map((w) => `<li><code>${w}</code></li>`)
            .join("");
    }

    // Balance placeholder
    const balDiv = document.getElementById("dash-balances");
    if (wallets.length > 0) {
        // We await the Promise here, OUTSIDE of the string literal
        const balance = await WalletManager.getBalanceOf();

        balDiv.innerHTML =
            `<div class="balance-row">
                <code>${shortenAddr(wallets[0])}</code> 
                <code>${balance} Tokens</code>
            </div>`;
    }

    // Transactions
    const { data: txns } = await api("GET", "/api/transactions");
    const tbody = document.querySelector("#dash-transactions tbody");
    if (!txns || txns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No transactions yet.</td></tr>';
    } else {
        tbody.innerHTML = txns
            .map(
                (t) =>
                    `<tr>
                        <td>${t.tx_type}</td>
                        <td><code>${shortenAddr(t.from_addr)}</code></td>
                        <td><code>${shortenAddr(t.to_addr)}</code></td>
                        <td>${t.amount}</td>
                        <td><code>${shortenAddr(t.tx_hash)}</code></td>
                        <td>${t.created_at || ""}</td>
                    </tr>`
            )
            .join("");
    }
}

// -- Wallet -----------------------------------------------------------------
async function initWallet() {
    const wallets = await WalletManager.getWallets();
    const ul = document.getElementById("wallet-list");
    if (wallets.length === 0) {
        ul.innerHTML = '<li class="empty">No wallets linked yet.</li>';
    } else {
        ul.innerHTML = wallets
            .map(
                (w) =>
                    `<li><code>${w}</code></li>`
            )
            .join("");
    }
}


// -- Transfer ---------------------------------------------------------------
async function initTransfer() {
    // Populate wallet dropdown
    const wallets = await WalletManager.getWallets();
    const sel = document.getElementById("transfer-from");
    wallets.forEach((w) => {
        const opt = document.createElement("option");
        opt.value = w;
        opt.textContent = w;
        sel.appendChild(opt);
    });

    document.getElementById("transfer-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const from = sel.value;
        const to = document.getElementById("transfer-to").value.trim();
        const amount = document.getElementById("transfer-amount").value.trim();

        const txHash = await WalletManager.transfer(to, amount);

        // Log to backend
        await api("POST", "/api/transactions", {
            type: "transfer",
            from,
            to,
            amount,
            tx_hash: txHash,
        });
    });
}

// -- Burn -------------------------------------------------------------------
async function initBurn() {
    const wallets = await WalletManager.getWallets();
    const sel = document.getElementById("burn-from");
    wallets.forEach((w) => {
        const opt = document.createElement("option");
        opt.value = w;
        opt.textContent = w;
        sel.appendChild(opt);
    });

    document.getElementById("burn-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const from = sel.value;
        const amount = document.getElementById("burn-amount").value.trim();

        const txHash = await WalletManager.burn(amount);

        // Log to backend
        await api("POST", "/api/transactions", {
            type: "burn",
            from,
            to: "0x0000000000000000000000000000000000000000",
            amount,
            tx_hash: txHash,
        });
    });
}

// -- Mint (admin) -----------------------------------------------------------
function initMint() {
    document.getElementById("mint-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const to = document.getElementById("mint-to").value.trim();
        const amount = document.getElementById("mint-amount").value.trim();

        const { ok, data } = await api("POST", "/api/mint", { to, amount });
        if (ok) {
            flash(data?.message || "Minted successfully!");
        } else {
            flash(data?.error || "Mint failed", true);
        }
    });
}

// ---------------------------------------------------------------------------
// Router — detect page and run corresponding init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    // Initialize Web3 if present
    if (typeof WalletManager !== 'undefined') {
        await WalletManager.init();
    }

    // Set up logout handlers
    initLogout();

    const page = currentPage();
    const inits = {
        login: initLogin,
        register: initRegister,
        dashboard: initDashboard,
        wallet: initWallet,
        transfer: initTransfer,
        burn: initBurn,
        mint: initMint,
    };

    if (page && inits[page]) {
        inits[page]();
    }
});
