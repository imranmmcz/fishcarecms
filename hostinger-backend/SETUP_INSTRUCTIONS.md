# FishCare Pro - Hostinger Backend Quick Setup

## 🚀 Quick Setup Guide

### Step 1: Database Setup
1. **MySQL-এ লগইন করুন**
2. **Database তৈরি করুন**: `CREATE DATABASE fishcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. **Schema ইমপোর্ট করুন**: `mysql -u USER -p fishcare_db < database/complete_schema.sql`

### Step 2: Environment Configuration
```bash
cp .env.example .env
nano .env
```

নিচের তথ্যগুলো পূরণ করুন:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fishcare_db
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your-random-secret
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

**JWT Secret জেনারেট করুন:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start Server

**Development:**
```bash
npm run dev
```

**Production with PM2:**
```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 5: Verify Installation
```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-23T...",
  "environment": "production",
  "version": "1.0.0"
}
```

## 📊 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | নতুন ইউজার রেজিস্ট্রেশন |
| POST | /api/auth/signin | লগইন |
| GET | /api/auth/me | বর্তমান ইউজার তথ্য |
| PUT | /api/auth/password | পাসওয়ার্ড পরিবর্তন |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | সকল পণ্য |
| GET | /api/products/:id | একটি পণ্য |
| POST | /api/products | পণ্য তৈরি (Admin) |
| PUT | /api/products/:id | পণ্য আপডেট (Admin) |
| DELETE | /api/products/:id | পণ্য মুছুন (Admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | সকল অর্ডার |
| POST | /api/orders | নতুন অর্ডার |
| PATCH | /api/orders/:id/status | স্ট্যাটাস আপডেট |
| PATCH | /api/orders/:id/shipping | শিপিং আপডেট |

### Market Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/market-prices | বাজার দর |
| POST | /api/market-prices | দাম যোগ করুন |

### Farming
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/farming/ponds | পুকুর ব্যবস্থাপনা |
| GET/POST | /api/farming/incomes | আয় হিসাব |
| GET/POST | /api/farming/expenses | ব্যয় হিসাব |
| GET/POST | /api/farming/samplings | স্যাম্পলিং |

## 🔐 Default Admin
- **Email:** admin@fishcare.com
- **Password:** admin123

⚠️ **প্রথম লগইনের পর অবশ্যই পাসওয়ার্ড পরিবর্তন করুন!**

## 📖 বিস্তারিত গাইড
সম্পূর্ণ ডেপ্লয়মেন্ট গাইডের জন্য দেখুন: **HOSTINGER_DEPLOYMENT_GUIDE.md**
