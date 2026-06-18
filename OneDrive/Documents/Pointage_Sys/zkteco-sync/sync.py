# -*- coding: utf-8 -*-
"""
ZKPointe - Sync ZKTeco -> Laravel (optimisé)
- Connexion persistante pour éviter le overhead de reconnexion
- Pointages : vérifiés toutes les SYNC_INTERVAL secondes
- Employés   : synchronisés toutes les 60 secondes
"""

import os
import sys
import time
import logging

sys.stdout.reconfigure(encoding='utf-8')

import requests
from dotenv import load_dotenv
from zk import ZK

load_dotenv()

ZKTECO_IP     = os.getenv("ZKTECO_IP",      "192.168.1.100")
ZKTECO_PORT   = int(os.getenv("ZKTECO_PORT", "4370"))
API_BASE      = os.getenv("API_URL", "http://localhost:8000/api/sync/logs").rsplit("/logs", 1)[0]
API_LOGS_URL  = API_BASE + "/logs"
API_EMP_URL   = API_BASE + "/employees"
API_SECRET    = os.getenv("API_SYNC_SECRET", "")
SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", "3"))
EMP_INTERVAL  = 60   # resync employés toutes les 60s

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("zkpointe")

HEADERS = {"X-Sync-Secret": API_SECRET, "Accept": "application/json"}


def send_employees(users: list):
    if not users:
        return
    try:
        r = requests.post(API_EMP_URL, json={"users": users}, headers=HEADERS, timeout=10)
        r.raise_for_status()
        created = r.json().get("created", 0)
        if created > 0:
            log.info(f"{created} nouvel(s) employe(s) cree(s).")
    except Exception as e:
        log.error(f"Erreur sync employes : {e}")


def send_logs(logs: list):
    if not logs:
        return
    try:
        r = requests.post(API_LOGS_URL, json={"logs": logs}, headers=HEADERS, timeout=10)
        r.raise_for_status()
        inserted = r.json().get("inserted", 0)
        if inserted > 0:
            log.info(f"{inserted} nouveau(x) pointage(s) enregistre(s).")
    except requests.exceptions.ConnectionError:
        log.error(f"Impossible de joindre l'API ({API_LOGS_URL})")
    except Exception as e:
        log.error(f"Erreur sync pointages : {e}")


def connect_zk():
    """Crée et retourne une connexion ZKTeco."""
    zk = ZK(ZKTECO_IP, port=ZKTECO_PORT, timeout=10, password=0,
            force_udp=False, ommit_ping=False)
    conn = zk.connect()
    conn.disable_device()
    return conn


def run():
    log.info("=" * 50)
    log.info(f"  ZKPointe Sync")
    log.info(f"  Machine   : {ZKTECO_IP}:{ZKTECO_PORT}")
    log.info(f"  API       : {API_BASE}")
    log.info(f"  Intervalle: {SYNC_INTERVAL}s  (employes: {EMP_INTERVAL}s)")
    log.info("=" * 50)

    known_punches  = set()   # (uid, punched_at) déjà envoyés
    first_cycle    = True
    last_emp_sync  = 0       # timestamp du dernier sync employés
    conn           = None

    while True:
        cycle_start = time.time()
        try:
            # ── Connexion (ou reconnexion si perdue) ─────────────────────────
            if conn is None:
                log.info("Connexion a la machine ZKTeco...")
                conn = connect_zk()
                log.info("Connecte.")

            # ── 1. Employés (toutes les EMP_INTERVAL secondes) ───────────────
            now = time.time()
            if now - last_emp_sync >= EMP_INTERVAL:
                users = conn.get_users()
                all_users = [
                    {"uid": str(u.user_id), "name": u.name or f"Employe {u.user_id}"}
                    for u in users if u.user_id
                ]
                send_employees(all_users)
                last_emp_sync = time.time()
                log.info(f"{len(all_users)} employe(s) synchronise(s).")

            # ── 2. Pointages ─────────────────────────────────────────────────
            attendances = conn.get_attendance()

            if first_cycle:
                # Premier cycle : charger les pointages existants sans les envoyer
                for r in attendances:
                    known_punches.add((str(r.user_id), r.timestamp.strftime("%Y-%m-%d %H:%M:%S")))
                log.info(f"{len(known_punches)} pointages existants charges (ignores).")
                first_cycle = False
                # Forcer un sync employés au 1er cycle
                last_emp_sync = 0
            else:
                new_logs = []
                for r in attendances:
                    key = (str(r.user_id), r.timestamp.strftime("%Y-%m-%d %H:%M:%S"))
                    if key not in known_punches:
                        new_logs.append({"zkteco_uid": key[0], "punched_at": key[1]})
                        known_punches.add(key)

                if new_logs:
                    log.info(f"{len(new_logs)} nouveau(x) pointage(s) detecte(s).")
                    send_logs(new_logs)

        except Exception as e:
            log.error(f"Erreur : {e}")
            # Forcer une reconnexion au prochain cycle
            if conn:
                try:
                    conn.enable_device()
                    conn.disconnect()
                except Exception:
                    pass
            conn = None

        # ── Attente jusqu'au prochain cycle ──────────────────────────────────
        elapsed = time.time() - cycle_start
        wait    = max(0, SYNC_INTERVAL - elapsed)
        if wait > 0:
            time.sleep(wait)


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        log.info("Arret par l'utilisateur.")
        raise SystemExit(0)
