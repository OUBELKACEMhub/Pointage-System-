"""
ZKPointe — Script de synchronisation ZKTeco → Laravel
------------------------------------------------------
Tourne en arrière-plan sur le PC du réseau local.
Se connecte à la pointeuse toutes les SYNC_INTERVAL secondes,
récupère les nouveaux pointages et les envoie à l'API Laravel.
"""

import os
import time
import logging
from datetime import datetime

import requests
from dotenv import load_dotenv
from zk import ZK, const

# ── Configuration ────────────────────────────────────────────────────────────

load_dotenv()

ZKTECO_IP     = os.getenv("ZKTECO_IP",      "192.168.1.100")
ZKTECO_PORT   = int(os.getenv("ZKTECO_PORT", "4370"))
API_URL       = os.getenv("API_URL",         "http://localhost:8000/api/sync/logs")
API_SECRET    = os.getenv("API_SYNC_SECRET", "")
SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", "300"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("zkpointe")

# ── Connexion ZKTeco ─────────────────────────────────────────────────────────

def get_attendance_logs():
    """
    Se connecte à la machine ZKTeco, récupère tous les logs de présence
    et retourne une liste de dicts {zkteco_uid, punched_at}.
    """
    zk = ZK(
        ZKTECO_IP,
        port=ZKTECO_PORT,
        timeout=10,
        password=0,         # mot de passe machine (0 = aucun par défaut)
        force_udp=False,
        ommit_ping=False,
    )

    conn = None
    try:
        log.info(f"Connexion à la machine ZKTeco ({ZKTECO_IP}:{ZKTECO_PORT})…")
        conn = zk.connect()
        conn.disable_device()   # suspend les pontages pendant la lecture

        attendances = conn.get_attendance()
        log.info(f"{len(attendances)} pointage(s) trouvé(s) sur la machine.")

        logs = []
        for record in attendances:
            logs.append({
                "zkteco_uid": str(record.user_id),
                "punched_at": record.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            })

        return logs

    except Exception as e:
        log.error(f"Erreur de connexion ZKTeco : {e}")
        return []

    finally:
        if conn:
            conn.enable_device()
            conn.disconnect()
            log.info("Déconnecté de la machine.")

# ── Envoi vers l'API Laravel ─────────────────────────────────────────────────

def send_to_api(logs: list) -> bool:
    """
    Envoie les logs à l'API Laravel en un seul appel POST.
    Retourne True si l'envoi a réussi.
    """
    if not logs:
        log.info("Aucun log à envoyer.")
        return True

    try:
        response = requests.post(
            API_URL,
            json={"logs": logs},
            headers={
                "X-Sync-Secret": API_SECRET,
                "Accept":        "application/json",
            },
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        log.info(f"API : {data.get('inserted', 0)} nouveau(x) pointage(s) enregistré(s).")
        return True

    except requests.exceptions.ConnectionError:
        log.error(f"Impossible de joindre l'API Laravel ({API_URL}). Laravel est-il démarré ?")
    except requests.exceptions.HTTPError as e:
        log.error(f"Erreur HTTP de l'API : {e.response.status_code} — {e.response.text}")
    except Exception as e:
        log.error(f"Erreur lors de l'envoi à l'API : {e}")

    return False

# ── Boucle principale ─────────────────────────────────────────────────────────

def main():
    log.info("=" * 55)
    log.info("  ZKPointe Sync — Démarrage")
    log.info(f"  Machine  : {ZKTECO_IP}:{ZKTECO_PORT}")
    log.info(f"  API      : {API_URL}")
    log.info(f"  Intervalle : {SYNC_INTERVAL}s ({SYNC_INTERVAL // 60} min)")
    log.info("=" * 55)

    while True:
        log.info("── Cycle de synchronisation ──")
        logs = get_attendance_logs()
        send_to_api(logs)
        log.info(f"Prochain cycle dans {SYNC_INTERVAL // 60} minute(s)… (Ctrl+C pour arrêter)\n")
        time.sleep(SYNC_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("Arrêt du script par l'utilisateur.")
