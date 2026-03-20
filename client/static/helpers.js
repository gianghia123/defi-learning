// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function api(method, url, body) {
    const opts = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
}

function flash(msg, isError = false) {
    const el = document.getElementById("flash-msg");
    if (!el) return;
    el.textContent = msg;
    el.className = "flash " + (isError ? "flash-error" : "flash-ok");
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
}

function currentPage() {
    const sec = document.querySelector("section[data-page]");
    return sec ? sec.dataset.page : null;
}

function shortenAddr(addr) {
    if (!addr || addr.length < 12) return addr || "";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
}

// ---------------------------------------------------------------------------
// Logout button
// ---------------------------------------------------------------------------
function initLogout() {
    const btn = document.getElementById("logout-btn");
    if (!btn) {
        console.log("No button exists on this page");
        return; // Crucial: stop execution here so we don't error out!
    }

    // Setting .onclick directly so it shows up when you run btn.onclick in console
    btn.onclick = async () => {
        await api("POST", "/logout");
        window.location.href = "/login";
    };
}
