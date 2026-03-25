from flask import Flask, render_template, request, redirect, url_for, session
from functools import wraps

# Initialize Flask app
# Assuming the dist folder has been moved to static/dist manually if using default static path
app = Flask(__name__)

# Basic SQLAlchemy Setup (SQLite for local testing)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///defi.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'super_secret_development_key'

try:
    from flask_sqlalchemy import SQLAlchemy
    from werkzeug.security import generate_password_hash, check_password_hash
    db = SQLAlchemy(app)

    # 1) Database Model that tracks name, email, and password hash
    class User(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(100), nullable=False)
        email = db.Column(db.String(120), unique=True, nullable=False)
        address = db.Column(db.String(42), unique=True, nullable=True)
        password_hash = db.Column(db.String(256), nullable=False)
        is_admin = db.Column(db.Boolean, default=False)

    def init_db():
        from db_init import initialize_database
        initialize_database(db, app, User)
except ImportError:
    print("Warning: flask_sqlalchemy or werkzeug not installed. Database will not route properly.")
    db = None
    def init_db():
        pass


def is_user_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # If request is API/JSON, return a 401 error
            if request.is_json or request.path.startswith('/api/'):
                return {"error": "Authentication required"}, 401
            # Otherwise, redirect to the login page
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def is_user_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # If request is API/JSON, return a 401 error
            if request.is_json or request.path.startswith('/api/'):
                return {"error": "Authentication required"}, 401
            # Otherwise, redirect to the login page
            return redirect(url_for('login'))
            
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            if request.is_json or request.path.startswith('/api/'):
                return {"error": "Unauthorized: Admin access required"}, 403
            return redirect(url_for('index'))
            
        return f(*args, **kwargs)
    return decorated_function

# 2) Serve each template to their API endpoint
@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Support both JSON requests and traditional form data
        data = request.json if request.is_json else request.form
        email = data.get('email')
        password = data.get('password')
        action = data.get('action', 'login')
        
        if not email or not password:
            return {"error": "Email and password required"}, 400
            
        if action == 'register':
            if db:
                if User.query.filter_by(email=email).first():
                    return {"error": "User already exists"}, 400
                new_user = User(
                    name=email.split('@')[0],
                    email=email,
                    password_hash=generate_password_hash(password)
                )
                db.session.add(new_user)
                db.session.commit()
                session['user_id'] = new_user.id
            return {"message": "Registered successfully"}
            
        else: # default login action
            if db:
                user = User.query.filter_by(email=email).first()
                if user and check_password_hash(user.password_hash, password):
                    session['user_id'] = user.id
                    return {"message": "Logged in successfully"}
                else:
                    return {"error": "Invalid credentials"}, 401
            return {"error": "Database error"}, 500
            
    return render_template('login.html')

@app.route('/logout')
@is_user_login
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/api/me')
@is_user_login
def me():
    user = User.query.get(session['user_id'])
    return {
        "email": user.email,
        "name": user.name,
        "address": user.address,
    }

@app.route('/api/update-wallet', methods=['POST'])
@is_user_login
def update_wallet():
    data = request.json
    user = User.query.get(session['user_id'])
    user.address = data.get('address')
    db.session.commit()
    return {"success": True}

@app.route('/wallet')
def wallet():
    return render_template('wallet.html')

@app.route('/transfer')
def transfer():
    return render_template('transfer.html')

@app.route('/burn')
def burn():
    return render_template('burn.html')

@app.route('/mint')
@is_user_admin
def mint():
    return render_template('mint.html')

# Initialize DB unconditionally on startup
init_db()

if __name__ == '__main__':
    # Run server locally setup
    app.run(debug=True, port=5000)