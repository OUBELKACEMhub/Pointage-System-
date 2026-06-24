# ZKPointe — Système de Gestion des Présences

Application web de gestion des pointages ZKTeco pour entreprises.  
**Stack** : Laravel 12 · React · MySQL · Python (sync ZKTeco)

---

## Prérequis

### Windows
| Logiciel | Version | Lien |
|----------|---------|------|
| XAMPP | 8.2+ | [xampp.org](https://www.apachefriends.org) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Python | 3.10+ | [python.org](https://python.org) |

### Linux (Parrot OS / Ubuntu / Debian)
```bash
# PHP 8.2
sudo apt install php8.2 php8.2-mysql php8.2-mbstring php8.2-zip php8.2-bcmath php8.2-xml -y

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# MySQL
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo mysql_secure_installation

# Python
sudo apt install python3 python3-pip -y
```

---

## Installation

### 1. Cloner le projet
```bash
git clone https://github.com/OUBELKACEMhub/Pointage-System-.git
cd Pointage-System-
```

### 2. Backend Laravel
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Modifier `backend/.env` :
```env
DB_HOST=127.0.0.1
DB_DATABASE=zkpointe
DB_USERNAME=root
DB_PASSWORD=          # vide pour XAMPP / mettre mot de passe MySQL si configuré
```

```bash
php artisan migrate
php artisan db:seed
```

### 3. Frontend React
```bash
cd frontend
npm install
npm run build
```

Créer le fichier `frontend/.env.production` :
```env
VITE_API_URL=http://localhost:8000/api
```

Rebuilder après :
```bash
npm run build
```

### 4. Sync ZKTeco (Python)
```bash
cd zkteco-sync
pip install -r requirements.txt    # Windows
pip3 install -r requirements.txt   # Linux
```

Créer le fichier `zkteco-sync/.env` :
```env
ZKTECO_IP=192.168.X.X      # IP de la pointeuse → écran → Menu → Réseau
ZKTECO_PORT=4370
API_URL=http://localhost:8000/api/sync/logs
API_SYNC_SECRET=zkpointe_secret
SYNC_INTERVAL=3
```

---

## Démarrage

### Windows
Double-cliquer sur **`start.bat`**

> Lance automatiquement le backend + frontend et ouvre le navigateur.

### Linux
```bash
# Terminal 1 — Backend
cd backend
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2 — Frontend
cd frontend
npx serve dist -p 3000

# Terminal 3 — Sync ZKTeco
cd zkteco-sync
python3 sync.py
```

Accéder à l'application : **http://localhost:3000**

---

## Configuration initiale dans l'app

1. **Se connecter**
   - Email : `admin@zkpointe.ma`
   - Mot de passe : `password`
   - Changer le mot de passe : sidebar → **Changer mot de passe**

2. **Créer un horaire** → page Horaires
   - Heure d'arrivée, heure de départ, tolérance retard (minutes)

3. **Ajouter les employés** → page Employés
   - Le numéro de badge doit correspondre à celui enregistré dans la pointeuse

4. **Seuil d'alerte absences** → Dashboard → icône ⚙
   - Nombre max d'absences par mois avant alerte (défaut : 3)

---

## Docker (optionnel)

```bash
# Installer Docker Desktop puis :
docker compose up
```

Tout démarre automatiquement sur **http://localhost:3000**

---

## Structure du projet

```
Pointage_Sys/
├── backend/           Laravel 12 API
├── frontend/          React + Vite
├── zkteco-sync/       Script Python sync pointeuse
├── docker-compose.yml
├── start.bat          Lanceur Windows (double-clic)
└── install.bat        Installation automatique Windows
```

---

## Connexion réseau

La pointeuse ZKTeco doit être sur le même réseau local que le PC serveur.

Vérifier l'IP de la pointeuse : **écran → Menu → Communication → Adresse IP**

```
[Pointeuse ZKTeco] ──RJ45──► [Switch/Routeur] ◄──WiFi/RJ45── [PC Serveur]
```
