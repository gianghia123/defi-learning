from werkzeug.security import generate_password_hash

def initialize_database(db, app, User):
    with app.app_context():
        db.create_all()
        # Populate database with dummy users if none exist
        if not User.query.filter_by(email='alice@defi.local').first():
            dummy_admin = User(
                name='Alice',
                email='alice@defi.local',
                password_hash=generate_password_hash('supersecret123'),
                is_admin=True
            )
            dummy_normal = User(
                name='Bob',
                email='bob@defi.local',
                password_hash=generate_password_hash('supersecret123')
            )
            db.session.add(dummy_admin)
            db.session.add(dummy_normal)
            db.session.commit()
            print("Database initialized and populated with dummy users: admin@defi.local, user@defi.local")
