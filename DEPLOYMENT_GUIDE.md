# 🚀 FishCare Pro - Deployment Guide

## 📌 বর্তমান সেটআপ

এই অ্যাপ্লিকেশনটি দুটি অংশে বিভক্ত:

### 1️⃣ Frontend (Lovable)
- **Preview URL:** https://fishcal.lovable.app
- **Platform:** Lovable.dev
- **Auto-deploy:** GitHub push-এ স্বয়ংক্রিয় deploy

### 2️⃣ Backend (Hostinger)
- **API URL:** https://blog.fishcare.com.bd/api
- **Database:** MySQL (u109046763_cal)
- **Platform:** Hostinger VPS/Shared Hosting

---

## 🔧 Lovable থেকে Preview দেখা

### এডমিন প্যানেল অ্যাক্সেস
```
https://fishcal.lovable.app/admin
```

### এডমিন লগইন ক্রেডেনশিয়াল
```
Email: admin@fishcare.com
Password: admin123
```

> ⚠️ **গুরুত্বপূর্ণ:** প্রথম লগইনের পর পাসওয়ার্ড পরিবর্তন করুন!

### সকল এডমিন রাউট
| পেজ | URL |
|-----|-----|
| ড্যাশবোর্ড | /admin |
| পণ্য ম্যানেজমেন্ট | /admin/products |
| অর্ডার ম্যানেজমেন্ট | /admin/orders |
| ইনভেন্টরি | /admin/inventory |
| ব্যবহারকারী | /admin/users |
| বাজার দর | /admin/market-prices |
| পেজ বিল্ডার | /admin/page-builder |
| বিজ্ঞাপন সেটিংস | /admin/ads |
| সেটিংস | /admin/settings |
| রিপোর্ট | /admin/reports |
| ডেটাবেস এক্সপোর্ট | /admin/database-export |

---

## 🌐 GitHub থেকে Hostinger-এ Deploy

### ফোল্ডার স্ট্রাকচার
```
your-repo/
├── src/                    # Frontend React code
├── public/                 # Static files
├── hostinger-backend/      # ← Backend code for Hostinger
│   ├── config/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── ...
```

### Step 1: Backend Deploy (Hostinger)

1. **Hostinger-এ SSH/FTP দিয়ে সংযোগ করুন**

2. **Backend ফাইল আপলোড করুন**
   ```bash
   # hostinger-backend ফোল্ডারের সব ফাইল আপলোড করুন
   # Location: public_html/cal/ (বা আপনার পছন্দের ফোল্ডার)
   ```

3. **Environment Setup**
   ```bash
   cd public_html/cal
   cp .env.example .env
   # .env ফাইলে ডেটাবেস credentials সেট করুন
   ```

4. **Dependencies Install**
   ```bash
   npm install
   ```

5. **Database Setup**
   - phpMyAdmin-এ যান
   - `database/schema.sql` ইম্পোর্ট করুন
   - `database/ecommerce_schema.sql` ইম্পোর্ট করুন
   - `database/reviews_schema.sql` ইম্পোর্ট করুন

6. **Server Start (PM2)**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Step 2: Frontend Deploy (Lovable)

Frontend স্বয়ংক্রিয়ভাবে Lovable-এ deploy হয়।
- GitHub-এ push করলে Lovable auto-deploy করে
- Manual: Lovable editor → Publish বাটন

---

## 🔗 Custom Domain Setup (মেইন হোস্টিং)

### Frontend (fishcal.lovable.app → yourdomain.com)
1. Lovable Settings → Domains
2. Connect Domain → yourdomain.com
3. DNS Records যোগ করুন:
   - A Record: @ → 185.158.133.1
   - A Record: www → 185.158.133.1
   - TXT Record: _lovable → lovable_verify=ABC

### Backend API Domain
Backend API আলাদা domain বা subdomain-এ থাকবে:
```
https://api.yourdomain.com  (recommended)
বা
https://blog.fishcare.com.bd/api (বর্তমান)
```

---

## 🔄 API Configuration

Frontend এবং Backend সংযোগের জন্য:

### src/lib/api-client.ts
```typescript
// Production API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://blog.fishcare.com.bd/api';
```

### Environment Variables (.env)
```env
# Frontend (Lovable)
VITE_API_URL=https://blog.fishcare.com.bd/api

# Backend (Hostinger)
DB_HOST=mysql.hostinger.com
DB_PORT=3306
DB_NAME=u109046763_cal
DB_USER=u109046763_cal
DB_PASSWORD=your_password
JWT_SECRET=your_secret
FRONTEND_URL=https://fishcal.lovable.app
```

---

## 📊 Database Tables

| Table | বিবরণ |
|-------|--------|
| users | ব্যবহারকারী এবং অ্যাডমিন |
| products | পণ্য তালিকা |
| orders | অর্ডার |
| order_items | অর্ডার আইটেম |
| order_status_history | অর্ডার স্ট্যাটাস ইতিহাস |
| market_prices | মাছের বাজার দর |
| companies | কোম্পানি/সাপ্লায়ার |
| brands | ব্র্যান্ড |
| purchase_orders | ক্রয় অর্ডার |
| purchase_order_items | ক্রয় অর্ডার আইটেম |
| product_reviews | পণ্য রিভিউ |
| ad_settings | বিজ্ঞাপন সেটিংস |
| page_content | পেজ কন্টেন্ট |
| system_settings | সিস্টেম সেটিংস |
| smtp_settings | SMTP সেটিংস |
| email_logs | ইমেইল লগ |

---

## 🛡️ CORS Configuration

Backend `.htaccess` এ CORS সেটআপ করা আছে:
- ✅ fishcal.lovable.app
- ✅ *.lovableproject.com (Lovable preview)
- ✅ blog.fishcare.com.bd

---

## 🐛 Troubleshooting

### API কানেকশন সমস্যা
```bash
# API Health Check
curl https://blog.fishcare.com.bd/api/health
```

### CORS Error
Backend `.htaccess` এ আপনার domain যোগ করুন।

### Login সমস্যা
1. Browser console চেক করুন
2. Network tab-এ API response দেখুন
3. localStorage-এ `auth_token` আছে কিনা চেক করুন

---

## 📞 সাপোর্ট

- **Backend Docs:** hostinger-backend/README.md
- **MySQL Guide:** MYSQL_MIGRATION_GUIDE.md
- **Hostinger Setup:** hostinger-backend/SETUP_INSTRUCTIONS.md
