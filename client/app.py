"""
DeFi Learning — Flask Backend
Handles: user auth, wallet management, admin minting, transaction logging.
Token operations (transfer, burn, balance) are frontend-handled (MetaMask/web3).
"""

import os
import sqlite3
from functools import wraps

from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Secure backend wallet setup
w3 = Web3(Web3.HTTPProvider(os.getenv("RPC_URL", "http://127.0.0.1:8545")))
admin_private_key = os.getenv("ADMIN_PRIVATE_KEY")
if admin_private_key:
    admin_account = w3.eth.account.from_key(admin_private_key)

ERC20_MINT_ABI = '[{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
CONTRACT_ADDRESS = "0x5f436F27c233490c6023dDbe2800d49d781A22dD"

from flask import (
    Flask,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")
DATABASE = os.path.join(app.root_path, "defi.db")


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT    UNIQUE NOT NULL,
            password_hash TEXT  NOT NULL,
            is_admin    INTEGER NOT NULL DEFAULT 0,
            address     TEXT    UNIQUE
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            tx_type     TEXT    NOT NULL,
            from_addr   TEXT,
            to_addr     TEXT,
            amount      TEXT,
            tx_hash     TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    is_admin_exist = db.execute("SELECT * FROM users WHERE username = ?", ("admin",)).fetchone()
    if not is_admin_exist:
        db.execute("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)",
                   ("admin", generate_password_hash("password123"), 1))
    db.commit()


# ---------------------------------------------------------------------------
# Auth decorator
# ---------------------------------------------------------------------------

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            if request.is_json or request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        db = get_db()
        user = db.execute("SELECT is_admin FROM users WHERE id = ?",
                          (session["user_id"],)).fetchone()
        if not user or not user["is_admin"]:
            if request.is_json or request.path.startswith("/api/"):
                return jsonify({"error": "Admin access required"}), 403
            return redirect(url_for("dashboard_page"))
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    if "user_id" in session:
        return redirect(url_for("dashboard_page"))
    return redirect(url_for("login_page"))


@app.route("/login")
def login_page():
    return render_template("login.html")


@app.route("/register")
def register_page():
    return render_template("register.html")


@app.route("/dashboard")
@login_required
def dashboard_page():
    return render_template("dashboard.html")


@app.route("/wallet")
@login_required
def wallet_page():
    return render_template("wallet.html")


@app.route("/transfer")
@login_required
def transfer_page():
    return render_template("transfer.html")


@app.route("/burn")
@login_required
def burn_page():
    return render_template("burn.html")


@app.route("/mint")
@login_required
@admin_required
def mint_page():
    return render_template("mint.html")


# ---------------------------------------------------------------------------
# Auth API
# ---------------------------------------------------------------------------

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() if request.is_json else request.form
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        if request.is_json:
            return jsonify({"error": "Username and password are required"}), 400
        return redirect(url_for("register_page"))

    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, generate_password_hash(password)),
        )
        db.commit()
    except sqlite3.IntegrityError:
        if request.is_json:
            return jsonify({"error": "Username already taken"}), 409
        return redirect(url_for("register_page"))

    if request.is_json:
        return jsonify({"message": "Registered successfully"}), 201
    return redirect(url_for("login_page"))


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() if request.is_json else request.form
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE username = ?",
                      (username,)).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        if request.is_json:
            return jsonify({"error": "Invalid credentials"}), 401
        return redirect(url_for("login_page"))

    session.clear()
    session["user_id"] = user["id"]

    if request.is_json:
        return jsonify({"message": "Logged in", "is_admin": bool(user["is_admin"])})
    return redirect(url_for("dashboard_page"))


@app.route("/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    if request.is_json:
        return jsonify({"message": "Logged out"})
    return redirect(url_for("login_page"))


# ---------------------------------------------------------------------------
# User info API
# ---------------------------------------------------------------------------

@app.route("/api/me")
@login_required
def me():
    db = get_db()
    user = db.execute("SELECT id, username, is_admin, address FROM users WHERE id = ?",
                      (session["user_id"],)).fetchone()
    return jsonify({
        "username": user["username"],
        "is_admin": bool(user["is_admin"]),
        "address": user["address"],
    })

@app.route("/api/add-wallet", methods=["POST"])
@login_required
def add_wallet():
    # Add the wallet's address to the user.
    data = request.get_json() or {}
    address = data.get("address", "").strip()
    if not address:
        return jsonify({"error": "Address is required"}), 400
    db = get_db()
    db.execute("UPDATE users SET address = ? WHERE id = ?", (address, session["user_id"]))
    db.commit()
    return jsonify({"message": "Wallet added successfully"})


# ---------------------------------------------------------------------------
# Transaction log API  (backend just records what the frontend did on-chain)
# ---------------------------------------------------------------------------

@app.route("/api/transactions", methods=["POST"])
@login_required
def log_transaction():
    """Frontend reports a completed on-chain transaction to the backend."""
    data = request.get_json() or {}
    tx_type = data.get("type", "").strip()        # transfer | burn
    from_addr = data.get("from", "").strip()
    to_addr = data.get("to", "").strip()
    amount = str(data.get("amount", "")).strip()
    tx_hash = data.get("tx_hash", "").strip()

    if tx_type not in ("transfer", "burn"):
        return jsonify({"error": "Invalid transaction type"}), 400

    db = get_db()
    db.execute(
        "INSERT INTO transactions (user_id, tx_type, from_addr, to_addr, amount, tx_hash) VALUES (?, ?, ?, ?, ?, ?)",
        (session["user_id"], tx_type, from_addr, to_addr, amount, tx_hash),
    )
    db.commit()
    return jsonify({"message": "Transaction logged"}), 201


@app.route("/api/transactions")
@login_required
def get_transactions():
    db = get_db()
    rows = db.execute(
        "SELECT tx_type, from_addr, to_addr, amount, tx_hash, created_at "
        "FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (session["user_id"],),
    ).fetchall()
    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------------
# Admin: Mint  (placeholder — would talk to a backend-controlled wallet)
# ---------------------------------------------------------------------------

@app.route("/api/mint", methods=["POST"])
@admin_required
def mint():
    """Placeholder: admin mints tokens to an address."""
    data = request.get_json() or {}
    to_addr = data.get("to", "").strip()
    amount = data.get("amount", "").strip()

    if not to_addr or not amount:
        return jsonify({"error": "Recipient address and amount are required"}), 400

    if not admin_private_key:
        return jsonify({"error": "Admin wallet not configured securely on server"}), 500

    try:
        amount_in_wei = w3.to_wei(float(amount), 'ether')
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ERC20_MINT_ABI)
        nonce = w3.eth.get_transaction_count(admin_account.address)

        mint_txn = contract.functions.mint(to_addr, amount_in_wei).build_transaction({
            'chainId': int(os.getenv("CHAIN_ID", 31337)),
            'gas': 2000000,
            'maxFeePerGas': w3.to_wei('2', 'gwei'),
            'maxPriorityFeePerGas': w3.to_wei('1', 'gwei'),
            'nonce': nonce,
        })

        signed_txn = w3.eth.account.sign_transaction(mint_txn, private_key=admin_private_key)
        tx_hash_bytes = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        tx_hash = w3.to_hex(tx_hash_bytes)

        return jsonify({
            "message": f"Minted {amount} tokens to {to_addr}",
            "tx_hash": tx_hash,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

with app.app_context():
    init_db()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
