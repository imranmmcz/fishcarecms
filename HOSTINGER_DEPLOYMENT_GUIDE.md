# 🚀 Hostinger Deployment Guide — FishCare Pro

Complete end-to-end guide for deploying the **full webapp** (React frontend + Node/Express + MySQL backend) to Hostinger using the `hostinger-backend/` folder as the backend service.

---

## 📦 Architecture on Hostinger

```
┌─────────────────────────────────────────────────────────┐
│ Hostinger Domain  (e.g. https://fishcare.com.bd)        │
│                                                         │
│  public_html/                                           │
│   ├── index.html  + assets/   ← built React frontend    │
│   ├── .htaccess               ← SPA routing + /api proxy│
│   └── …                                                 │
│                                                         │
│  /home/user/fishcare-api/  (NOT under public_html)      │
│   └── hostinger-backend/      ← Node.js Express API     │
│       └── runs on 127.0.0.1:3001 via PM2                │
│                                                         │
│  MySQL (Hostinger hPanel → Databases)                   │
│   └── uXXXXXXXXX_fcare                                  │
└─────────────────────────────────────────────────────────┘
```

Apache (Hostinger's default) serves the static React build and reverse-proxies every `/api/*` request to the Node process via the `.htaccess` rules already shipped in `hostinger-backend/.htaccess`.

---

## 1. Prerequisites

- Hostinger **Business** or **Cloud / VPS** plan (Premium does NOT support Node.js).
- SSH access enabled (hPanel → Advanced → SSH Access).
- A domain pointed to the Hostinger hosting (e.g. `fishcare.com.bd`).
- Node.js 18+ available (`node -v` on the server).

---

## 2. Create the MySQL database

1. hPanel → **Databases → MySQL Databases**
2. Create a database, user, and password. Note them down (host is usually `localhost`).
3. Grant the user **ALL PRIVILEGES** on that database.

No need to import any SQL manually — on first boot the backend auto-runs every file in `hostinger-backend/database/` (via `AUTO_INIT_DB=true`).

---

## 3. Deploy the backend (Node.js / Express)

SSH into the server:

```bash
ssh u123456789@fishcare.com.bd
cd ~
# Upload the hostinger-backend folder (git clone / scp / File Manager)
cd hostinger-backend
npm ci --omit=dev
cp .env.example .env
nano .env            # fill in DB_*, JWT_SECRET, FRONTEND_URL, ALLOWED_ORIGINS
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start with PM2 (persistent + autorestart):
```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup            # follow the printed command (sudo …)
pm2 logs fishcare-api  # tail to confirm DB connect + "🚀 running on port 3001"
```

Sanity check:
```bash
curl http://127.0.0.1:3001/api/health
# → { "status": "ok", "environment": "production", ... }
```

---

## 4. Build & deploy the React frontend

On your local machine (or CI):

```bash
cp .env.production.example .env.production
# edit VITE_API_URL=https://fishcare.com.bd/api
npm ci
npm run build          # outputs dist/
```

Upload the **contents** of `dist/` to Hostinger `public_html/`:
- via File Manager → Upload + Extract zip, or
- via SFTP / rsync:
  ```bash
  rsync -avz --delete dist/ u123456789@fishcare.com.bd:~/domains/fishcare.com.bd/public_html/
  ```

Then copy `hostinger-backend/.htaccess` into the same `public_html/` so Apache:
- proxies `/api/*` → `http://127.0.0.1:3001/api/*`
- proxies `/uploads/*` from the Node app
- falls back to `index.html` for SPA routes
- sets strict CORS / security headers

```bash
cp ~/hostinger-backend/.htaccess ~/domains/fishcare.com.bd/public_html/.htaccess
```

> **Note:** The `.htaccess` requires Apache `mod_rewrite`, `mod_proxy`, `mod_proxy_http`, `mod_headers` — all enabled by default on Hostinger.

---

## 5. Verify the full stack

| Check | URL | Expected |
|---|---|---|
| Frontend loads | `https://fishcare.com.bd/` | React app renders |
| SPA deep link | `https://fishcare.com.bd/admin` | No 404 on refresh |
| API proxy | `https://fishcare.com.bd/api/health` | `{ "status": "ok" }` |
| Login | POST `/api/auth/signin` | JWT returned |
| Uploads | `https://fishcare.com.bd/uploads/...` | static file served |

---

## 6. SSL / HTTPS

hPanel → **SSL** → enable **Free Lifetime SSL** for the domain. The shipped `.htaccess` already sets HSTS (`Strict-Transport-Security`) — make sure SSL is active first or browsers will hard-pin HTTP failure for a year.

---

## 7. Routine operations

```bash
pm2 status                    # backend status
pm2 restart fishcare-api      # after .env or code change
pm2 logs fishcare-api --lines 200
pm2 monit                     # live CPU/memory
```

**Update flow:**
```bash
# backend
cd ~/hostinger-backend && git pull && npm ci --omit=dev && pm2 restart fishcare-api
# frontend
npm run build && rsync -avz --delete dist/ user@host:~/domains/.../public_html/
```

---

## 8. Backups

- **Database** — hPanel → Backups → Auto MySQL backup (daily). Manual: `mysqldump -u USER -p DBNAME > backup-$(date +%F).sql`.
- **Uploads** — `tar czf uploads-$(date +%F).tgz hostinger-backend/uploads/`.
- The app also includes an in-app Google Drive backup (`/admin/backup`).

---

## 9. Hardening checklist

- ✅ Real `.env` lives OUTSIDE `public_html/` (only built `dist/` is web-served).
- ✅ `.htaccess` blocks `.env`, `.sql`, `.log`, `.bak`, `.config` from the web.
- ✅ `JWT_SECRET` is 64 random bytes, unique per environment.
- ✅ MySQL user has only the privileges it needs on its own database.
- ✅ `ALLOWED_ORIGINS` is restricted to your real frontend domain(s).
- ✅ PM2 + `pm2 startup` so the API restarts after a server reboot.
- ✅ SSL enabled + HSTS active.
- ✅ Rotate default `admin@fishcare.com / admin123` credentials on first login.

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/health` returns 404 | `.htaccess` not in `public_html/`, or `mod_proxy` disabled — check hPanel modules. |
| CORS error in browser | Add the exact frontend origin to `ALLOWED_ORIGINS` in `.env`, then `pm2 restart`. |
| `ECONNREFUSED 127.0.0.1:3001` | Node app not running. `pm2 logs fishcare-api` — usually DB credentials wrong. |
| Bengali text → `?????` in DB | Confirm DB created with `utf8mb4 / utf8mb4_unicode_ci` (auto-init does this). |
| Login locked out | Wait 15 min, or `pm2 restart fishcare-api` to flush in-memory lockouts. |
| 500 on first request | First boot is applying schema — tail `pm2 logs` until `✅ Database bootstrap complete`. |

---

## 📁 What lives where

| Path | Purpose |
|---|---|
| `hostinger-backend/server.js` | Express entry, CORS, rate limiting, routes |
| `hostinger-backend/config/database.js` | MySQL pool (utf8mb4, +06:00 TZ) |
| `hostinger-backend/config/initDatabase.js` | Auto-creates DB + applies all `database/*.sql` |
| `hostinger-backend/database/*.sql` | Idempotent schema (safe to re-run) |
| `hostinger-backend/routes/` | Auth, users, products, orders, farming, etc. |
| `hostinger-backend/.htaccess` | Apache: SPA + `/api` proxy + security headers |
| `hostinger-backend/ecosystem.config.js` | PM2 process definition |
| `.env.production.example` | Frontend build env (set `VITE_API_URL`) |

You are now ready to ship 🚢

---

## 11. 🤖 Auto-deploy on `git push` (GitHub Actions → Hostinger)

The workflow `.github/workflows/deploy-hostinger.yml` automatically deploys both **frontend** and **backend** to Hostinger every time you push to `main`.

### What it does

| Job | Steps |
|---|---|
| `deploy-frontend` | `npm ci` → `npm run build` → `rsync dist/ → public_html/` (with `.htaccess`) |
| `deploy-backend` | `rsync hostinger-backend/ → server` (preserves `.env` + uploads) → `npm ci` → `pm2 restart fishcare-api` → health check |

Both jobs run in parallel, and a `concurrency` guard prevents two deployments from overlapping.

### One-time setup

#### a) Generate a deploy SSH key (local machine)
```bash
ssh-keygen -t ed25519 -f ~/.ssh/hostinger_deploy -C "github-actions"
# Add the PUBLIC key to Hostinger
ssh-copy-id -i ~/.ssh/hostinger_deploy.pub -p 65002 u123456789@fishcare.com.bd
# Test
ssh -i ~/.ssh/hostinger_deploy -p 65002 u123456789@fishcare.com.bd "echo ok"
```

#### b) Add GitHub repository secrets

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Example | Purpose |
|---|---|---|
| `HOSTINGER_SSH_HOST` | `fishcare.com.bd` | SSH hostname |
| `HOSTINGER_SSH_PORT` | `65002` | hPanel → Advanced → SSH Access |
| `HOSTINGER_SSH_USER` | `u123456789` | Your Hostinger SSH user |
| `HOSTINGER_SSH_KEY` | *(paste the entire `~/.ssh/hostinger_deploy` PRIVATE key)* | Auth for rsync/ssh |
| `HOSTINGER_PUBLIC_HTML_PATH` | `/home/u123456789/domains/fishcare.com.bd/public_html` | Where the React build goes |
| `HOSTINGER_BACKEND_PATH` | `/home/u123456789/hostinger-backend` | Backend folder on the server |
| `VITE_API_URL` | `https://fishcare.com.bd/api` | Baked into the build + used for health check |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Lovable Cloud URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOi…` | Lovable Cloud anon key |
| `VITE_SUPABASE_PROJECT_ID` | `cozwxamdldjkeeffjvvf` | Lovable Cloud project ref |

> The backend `.env` on the server is **never** overwritten by deploys — the rsync excludes it. Edit it once on the server and PM2 will pick up changes on the next restart.

#### c) First run

Push any commit to `main` (or trigger manually via **Actions → Deploy to Hostinger → Run workflow**). Watch the Actions tab — both jobs should turn green within ~2 minutes. The final step `curl /api/health` confirms the live API is responding.

### Rolling back

- **Frontend**: re-run a previous successful workflow from the Actions tab (or `git revert` and push).
- **Backend**: SSH in → `cd ~/hostinger-backend && git checkout <prev-sha> && pm2 restart fishcare-api` — or simply re-run the prior green workflow.

### Safety notes

- The PRIVATE deploy key never leaves GitHub Secrets; it's loaded into an in-memory `ssh-agent` per job.
- `rsync --delete` is scoped to `dist/` and `hostinger-backend/` — it cannot touch `.env`, `uploads/`, or anything outside those paths.
- Use a **dedicated** Hostinger SSH key for CI (don't reuse your personal key) so you can revoke it independently.