# new.fishcare.com.bd — Auto Deploy (Frontend + Backend একই সাবডোমেইনে)

এই গাইড অনুসরণ করলে GitHub `main` branch এ push করার সাথে সাথেই
`https://new.fishcare.com.bd/` (frontend) এবং `https://new.fishcare.com.bd/api` (backend)
উভয়ই স্বয়ংক্রিয়ভাবে Hostinger এ deploy হবে।

## Architecture

```
/home/<user>/domains/new.fishcare.com.bd/public_html/     ← Frontend (React build)
                                              ├── index.html
                                              ├── assets/
                                              ├── .htaccess          ← /api → 127.0.0.1:3001 proxy
                                              ├── api/               ← Backend Node.js (PM2)
                                              │   ├── server.js
                                              │   ├── routes/...
                                              │   └── uploads/
                                              └── uploads/           ← (frontend rsync এ preserved)
```

Backend আলাদা subdomain নয় — main subdomain এর ভেতরে `/api` folder হিসেবে থাকবে।
Apache `.htaccess` এর `RewriteRule ^api(.*)$ http://127.0.0.1:3001/api$1 [P,L]` সব
`/api/*` request Node.js এ proxy করবে।

## GitHub Secrets — যা যা সেট করতে হবে

GitHub → Repo → Settings → Secrets and variables → Actions → **New repository secret**

| Secret | Value |
|---|---|
| `HOSTINGER_SSH_HOST` | আপনার Hostinger server IP (hPanel → SSH Access) |
| `HOSTINGER_SSH_PORT` | সাধারণত `65002` |
| `HOSTINGER_SSH_USER` | hPanel এ প্রদর্শিত SSH username (e.g. `u109046763`) |
| `HOSTINGER_SSH_KEY` | Private key (নীচে "SSH Key" section দেখুন) |
| `HOSTINGER_PUBLIC_HTML_PATH` | `/home/u109046763/domains/new.fishcare.com.bd/public_html` |
| `HOSTINGER_BACKEND_PATH` | `/home/u109046763/domains/new.fishcare.com.bd/public_html/api` |
| `VITE_API_URL` | `https://new.fishcare.com.bd/api` |
| `VITE_SUPABASE_URL` | `https://cozwxamdldjkeeffjvvf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | আপনার anon key |
| `VITE_SUPABASE_PROJECT_ID` | `cozwxamdldjkeeffjvvf` |

> ⚠️ `HOSTINGER_BACKEND_PATH` অবশ্যই `HOSTINGER_PUBLIC_HTML_PATH` এর ভেতরের `api`
> folder হতে হবে — এটাই user-এর requested layout। Workflow ইতিমধ্যে frontend rsync থেকে
> `api/` ও `uploads/` exclude করে, তাই backend deploy এর সময় ভুলেও override হবে না।

## SSH Key (একবার সেটআপ)

লোকাল মেশিনে:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/hostinger_deploy -N ""
cat ~/.ssh/hostinger_deploy.pub    # এটা Hostinger এ paste
cat ~/.ssh/hostinger_deploy        # এটা GitHub Secret HOSTINGER_SSH_KEY এ paste
```

Hostinger hPanel → **Advanced → SSH Access → Manage SSH Keys** → public key add করুন।

## Hostinger এ প্রথমবার Subdomain তৈরি

1. hPanel → **Domains → Subdomains** → `new` subdomain create for `fishcare.com.bd`
   → Document root: `domains/new.fishcare.com.bd/public_html`
2. hPanel → **SSL** → `new.fishcare.com.bd` এ Let's Encrypt SSL install
3. SSH এ login করে একবারই MySQL credentials বসান:
   ```bash
   ssh -p 65002 u109046763@<HOST>
   mkdir -p ~/domains/new.fishcare.com.bd/public_html/api
   cd ~/domains/new.fishcare.com.bd/public_html/api
   cat > .env <<'EOF'
   NODE_ENV=production
   PORT=3001
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=u109046763_cal
   DB_USER=u109046763_cal
   DB_PASSWORD=<your-mysql-password>
   JWT_SECRET=<64-byte-random-hex>
   FRONTEND_URL=https://new.fishcare.com.bd
   EOF
   chmod 600 .env
   ```
   > `.env` file rsync এ preserved থাকবে (workflow এ `--exclude='.env'` আছে)।
4. একবারই PM2 setup:
   ```bash
   npm install -g pm2
   cd ~/domains/new.fishcare.com.bd/public_html/api
   npm ci --omit=dev
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup    # যে command output হবে সেটা রান করুন
   ```

## Auto-Deploy কীভাবে কাজ করে

`.github/workflows/deploy-hostinger.yml` — `main` branch এ push হলে:

1. **deploy-frontend job**: `npm ci` → `npm run build` → `dist/` কে rsync করে
   `public_html/` এ। `api/` ও `uploads/` folder skip করে (delete হবে না)।
2. **deploy-backend job**: `hostinger-backend/` কে rsync করে `public_html/api/` এ,
   তারপর `npm ci --omit=dev` চালিয়ে `pm2 restart fishcare-api` করে।
3. প্রত্যেক job এর আগে snapshot backup হয় — deploy fail করলে auto rollback।
4. Health check: frontend `https://new.fishcare.com.bd/index.html`, backend
   `https://new.fishcare.com.bd/api/health`।

## Verify

Push করার পর GitHub → **Actions** tab এ green ✅ দেখলে:
```bash
curl -I https://new.fishcare.com.bd/                # 200 OK, HTML
curl    https://new.fishcare.com.bd/api/health      # {"status":"ok",...}
```

## Troubleshooting

- **502 Bad Gateway on /api** → PM2 down। SSH এ `pm2 status`, `pm2 logs fishcare-api`।
- **CORS error** → `hostinger-backend/.htaccess` এ `new.fishcare.com.bd` origin আছে (নতুন যুক্ত)। redeploy করুন।
- **Frontend deploy backend মুছে ফেলছে** → workflow এর rsync exclude নিশ্চিত করুন:
  `--exclude='api' --exclude='api/**' --exclude='uploads' --exclude='uploads/**'` (updated)।
- **Actions run হচ্ছে না** → Repo → Settings → Actions → General → "Allow all actions" enabled কিনা check করুন। আর push অবশ্যই `main` branch এ হতে হবে।
