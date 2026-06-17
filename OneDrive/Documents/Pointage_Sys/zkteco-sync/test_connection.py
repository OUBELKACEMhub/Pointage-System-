# -*- coding: utf-8 -*-
"""
Test rapide de connexion a la machine ZKTeco.
Executez ce script d'abord pour verifier que la machine repond.

Usage : python test_connection.py
"""

import os
import sys

# Force UTF-8 sur Windows
sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from zk import ZK

load_dotenv()

IP   = os.getenv("ZKTECO_IP",      "192.168.1.100")
PORT = int(os.getenv("ZKTECO_PORT", "4370"))

print(f"\nConnexion a la machine ZKTeco ({IP}:{PORT})...\n")

zk   = ZK(IP, port=PORT, timeout=10, password=0, ommit_ping=False)
conn = None

try:
    conn = zk.connect()
    print("[OK] Connexion reussie !\n")

    try:
        info = conn.get_firmware_version()
        print(f"  Firmware    : {info}")
    except Exception:
        print("  Firmware    : (non disponible)")

    users = conn.get_users()
    print(f"  Utilisateurs enregistres : {len(users)}")
    for u in users[:10]:
        print(f"    - UID={u.uid}  user_id={u.user_id}  nom={u.name}")
    if len(users) > 10:
        print(f"    ... et {len(users) - 10} autre(s)")

    logs = conn.get_attendance()
    print(f"\n  Pointages stockes : {len(logs)}")
    for l in logs[:10]:
        print(f"    - user_id={l.user_id}  timestamp={l.timestamp}")
    if len(logs) > 10:
        print(f"    ... et {len(logs) - 10} autre(s)")

except Exception as e:
    print(f"[ERREUR] Echec de connexion : {e}")
    print("\nVerifiez :")
    print("  1. L'IP de la machine dans le fichier .env")
    print("  2. Que le PC et la machine sont sur le meme reseau")
    print("  3. Que le port 4370 n'est pas bloque par le pare-feu")

finally:
    if conn:
        conn.disconnect()
        print("\nDeconnecte.")
