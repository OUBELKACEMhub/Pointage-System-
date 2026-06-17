# -*- coding: utf-8 -*-
"""Synchro unique — recupere les pointages et les envoie a Laravel (sans boucle)."""

import os, sys
sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
import requests
from zk import ZK

load_dotenv()

IP     = os.getenv("ZKTECO_IP",      "192.168.1.201")
PORT   = int(os.getenv("ZKTECO_PORT", "4370"))
URL    = os.getenv("API_URL",         "http://localhost:8000/api/sync/logs")
SECRET = os.getenv("API_SYNC_SECRET", "")

print(f"Connexion ZKTeco {IP}:{PORT} ...")
zk = ZK(IP, port=PORT, timeout=10, password=0, ommit_ping=False)
conn = None

try:
    conn = zk.connect()
    conn.disable_device()
    attendances = conn.get_attendance()
    print(f"  {len(attendances)} pointage(s) recupere(s)")

    logs = [{"zkteco_uid": str(r.user_id), "punched_at": r.timestamp.strftime("%Y-%m-%d %H:%M:%S")} for r in attendances]
finally:
    if conn:
        conn.enable_device()
        conn.disconnect()

print(f"\nEnvoi vers {URL} ...")
resp = requests.post(URL, json={"logs": logs}, headers={"X-Sync-Secret": SECRET, "Accept": "application/json"}, timeout=15)
print(f"  Status HTTP : {resp.status_code}")
print(f"  Reponse    : {resp.json()}")
