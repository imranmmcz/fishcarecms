# ✅ FishCareCMS — Auto Deploy + MySQL Final Checklist

এই checklist অনুসরণ করলে GitHub `main` branch এ push করলেই
`https://new.fishcare.com.bd/` (frontend) + `https://new.fishcare.com.bd/api`
(Node.js + MySQL backend) স্বয়ংক্রিয়ভাবে Hostinger এ deploy হবে।

---

## ধাপ ১ — GitHub Repository যাচাই

1. Lovable Editor → বাম দিকের `+` মেনু → **GitHub → Connect project** ক্লিক করুন।
2. যে repository তে sync হচ্ছে সেটার URL কপি করে ব্রাউজারে খুলে নিশ্চিত করুন:
   - `.github/workflows/deploy-hostinger.yml` ফাইলটি সেখানে আছে
   - `hostinger-backend/` folder সেখানে আছে
3. যদি না থাকে → Lovable এ GitHub disconnect করে আবার connect করুন
   (এতে বর্তমান codebase পুরোপুরি push হবে)।

> `imranmmcz/fishcarecms` public URL এ **404** দেখাচ্ছে — অর্থাৎ ওটা private,
> নাম ভিন্ন, অথবা repository নেই। আসল synced repo টাই ব্যবহার করুন।

---

## ধাপ ২ — GitHub Actions Secrets (একবার সেট করবেন)

GitHub → Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `HOSTINGER_SSH_HOST` | Server IP (hPanel → SSH Access এ দেখা যায়) |
| `HOSTINGER_SSH_PORT` | সাধারণত `65002` |
| `HOSTINGER_SSH_USER` | hPanel এর SSH username (যেমন `u109046763`) |
| `HOSTINGER_SSH_KEY` | Ed25519 private key (নীচে দেখুন) |
| `HOSTINGER_PUBLIC_HTML_PATH` | `/home/u109046763/domains/new.fishcare.com.bd/public_html` |
| `HOSTINGER_BACKEND_PATH` | `/home/u109046763/domains/new.fishcare.com.bd/public_html/api` |
| `VITE_API_URL` | `https://new.fishcare.com.bd/api` |
| `VITE_SUPABASE_URL` | `https://cozwxamdldjkeeffjvvf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Lovable Cloud এর anon key |
| `VITE_SUPABASE_PROJECT_ID` | `cozwxamdldjkeeffjvvf` |

### SSH Key তৈরি (একবারই)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/hostinger_deploy -N ""
cat ~/.ssh/hostinger_deploy.pub   # public → Hostinger এ paste
cat ~/.ssh/hostinger_deploy       # private → GitHub Secret HOSTINGER_SSH_KEY এ paste
```

Hostinger hPanel → **Advanced → SSH Access → Manage SSH Keys** → public key add করুন।

---

## ধাপ ৩ — Hostinger এ Subdomain + MySQL (একবার সেটআপ)

### 3.1 Subdomain + SSL
1. hPanel → **Domains → Subdomains** → `new` subdomain create for `fishcare.com.bd`
   → document root: `domains/new.fishcare.com.bd/public_html`
2. hPanel → **SSL** → `new.fishcare.com.bd` এ Let's Encrypt install

### 3.2 MySQL Database তৈরি
hPanel → **Databases → MySQL Databases** → New Database তৈরি করুন:
- Database name: (উদাহরণ) `u109046763_fishcare`
- Username: `u109046763_fishcare`
- Strong password সেট করুন এবং কপি করে রাখুন

> Schema auto-create হবে — server boot এ `hostinger-backend/config/initDatabase.js`
> সব `.sql` ফাইল idempotently apply করবে (`CREATE TABLE IF NOT EXISTS`)।

### 3.3 প্রথমবার SSH এ Backend .env বসানো

```bash
ssh -p 65002 u109046763@<HOST>
mkdir -p ~/domains/new.fishcare.com.bd/public_html/api
cd ~/domains/new.fishcare.com.bd/public_html/api

cat > .env <<'EOF'
NODE_ENV=production
PORT=3001
AUTO_INIT_DB=true

DB_HOST=localhost
DB_PORT=3306
DB_NAME=u109046763_fishcare
DB_USER=u109046763_fishcare
DB_PASSWORD=<your-strong-mysql-password>

JWT_SECRET=<paste-64-byte-hex>
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://new.fishcare.com.bd
ALLOWED_ORIGINS=https://new.fishcare.com.bd,https://fishcare.com.bd,https://www.fishcare.com.bd
EOF
chmod 600 .env
```

JWT_SECRET generate:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> `.env` GitHub Actions rsync থেকে excluded — deploy এ overwrite হবে না।

### 3.4 PM2 setup (একবারই)

```bash
npm install -g pm2
cd ~/domains/new.fishcare.com.bd/public_html/api
npm ci --omit=dev
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # যে command output হবে সেটা রুট হিসেবে রান করুন
```

---

## ধাপ ৪ — Deploy Trigger + Verify

1. Lovable এ যেকোনো ছোট পরিবর্তন করুন → auto GitHub push হবে।
2. GitHub → **Actions** tab → "Deploy to Hostinger" job green ✅ হওয়া পর্যন্ত অপেক্ষা করুন।
3. Verify:
   ```bash
   curl -I  https://new.fishcare.com.bd/            # 200 OK
   curl     https://new.fishcare.com.bd/api/health  # {"status":"ok",...}
   ```

---

## ধাপ ৫ — Frontend কে MySQL এ switch করা

Admin panel এ login করে যান:

- **`/admin/database-config`** — কোন module Supabase / MySQL এ চলবে toggle করুন।
- **`/admin/data-migration`** — Supabase থেকে সমস্ত data একবারে MySQL এ import করুন
  (idempotent — বারবার চালালেও duplicate হবে না)।

MySQL-ready modules (ইতিমধ্যে full support):
`products, product_variations, categories, brands, customers, orders, order_items,`
`pos_sales, pos_sale_items, pos_shifts, pos_expenses, stock_adjustments,`
`purchase_orders, purchase_order_items, farmer_ponds, farmer_incomes,`
`farmer_expenses, farmer_samplings, farming_alerts`.

---

## Troubleshooting

| সমস্যা | সমাধান |
|---|---|
| Actions run হচ্ছেই না | Repo → Settings → Actions → General → "Allow all actions" enable |
| Workflow file GitHub এ নেই | Lovable → GitHub disconnect → reconnect |
| SSH failed | GitHub Secret এ `HOSTINGER_SSH_KEY` full private key (BEGIN/END সহ) আছে কিনা |
| 502 on `/api` | SSH এ `pm2 status`, `pm2 logs fishcare-api` |
| MySQL connect fail | Backend `.env` এ DB creds check — `pm2 logs` এ error দেখা যাবে |
| CORS blocked | `.env` এ `ALLOWED_ORIGINS` এ frontend origin আছে কিনা → PM2 restart |
| Frontend deploy করলে `api/` মুছে যাচ্ছে | ঠিক আছে — workflow ইতিমধ্যে `--exclude='api'` করে |

সব ঠিকঠাক থাকলে প্রতিটা Lovable edit **~2-3 মিনিটে** live হবে।
