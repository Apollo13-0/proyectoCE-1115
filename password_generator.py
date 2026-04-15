
import bcrypt

users = [
    ("admin@hospital.local", "Admin2026!"),
    ("carlos.rojas@correo.com", "CarlosRojas2026!"),
    ("maria.gomez@correo.com", "MariaGomez2026!"),
    ("laura.solis@hospital.local", "LauraSolis2026!"),
    ("diego.mora@hospital.local", "DiegoMora2026!"),
    ("sofia.arce@hospital.local", "SofiaArce2026!"),
    ("jorge.vega@hospital.local", "JorgeVega2026!"),
    ("elena.ruiz@hospital.local", "ElenaRuiz2026!"),
]

for email, password in users:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
    print(f"-- {email} -> {password}")
    print()