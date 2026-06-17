"""
Test rapide de connexion à la machine ZKTeco.
Exécutez ce script d'abord pour vérifier que la machine répond.

Usage : python test_connection.py
"""

import os
from dotenv import load_dotenv
from zk import ZK

load_dotenv()

IP   = os.getenv("ZKTECO_IP",   "192.168.1.100")
PORT = int(os.getenv("ZKTECO_PORT", "4370"))

print(f"\n🔌 Tentative de connexion à {IP}:{PORT}…\n")

zk   = ZK(IP, port=PORT, timeout=10, password=0, ommit_ping=False)
conn = None

try:
    conn = zk.connect()
    print("✅ Connexion réussie !\n")

    info = conn.get_firmware_version()
    print(f"  Firmware    : {info}")

    users = conn.get_users()
    print(f"  Utilisateurs enregistrés : {len(users)}")
    for u in users[:5]:
        print(f"    - UID={u.uid}  user_id={u.user_id}  nom={u.name}")
    if len(users) > 5:
        print(f"    … et {len(users) - 5} autre(s)")

    logs = conn.get_attendance()
    print(f"\n  Pointages stockés : {len(logs)}")
    for l in logs[:5]:
        print(f"    - user_id={l.user_id}  timestamp={l.timestamp}")
    if len(logs) > 5:
        print(f"    … et {len(logs) - 5} autre(s)")

except Exception as e:
    print(f"❌ Échec de connexion : {e}")
    print("\nVérifiez :")
    print("  1. L'IP de la machine dans le fichier .env")
    print("  2. Que le PC et la machine sont sur le même réseau")
    print("  3. Que le port 4370 n'est pas bloqué par le pare-feu")

finally:
    if conn:
        conn.disconnect()
        print("\nDéconnecté.")
