# FishCare Pro - Hostinger Backend Setup

## 🚀 Quick Setup Guide

### Step 1: Database Setup
1. **phpMyAdmin ওপেন করুন**: Hostinger hPanel → Databases → phpMyAdmin
2. **Database নির্বাচন করুন**: `u109046763_cal`
3. **SQL Tab এ যান**: Import → Browse → `database/schema.sql` আপলোড করুন
4. **Execute করুন**: Go বাটনে ক্লিক করুন

### Step 2: Environment Configuration
`.env` ফাইলটি সার্ভারে আপলোড করুন (ইতিমধ্যে কনফিগার করা আছে):

```env
DB_HOST=mysql.hostinger.com
DB_PORT=3306
DB_NAME=u109046763_cal
DB_USER=u109046763_cal
DB_PASSWORD=I1912.gp
JWT_SECRET=fishcare-bd-secret-key-2025-production
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://fishcal.lovable.app
```

### Step 3: Install Dependencies
```bash
cd public_html/cal
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
**API Health Check:**
```
https://blog.fishcare.com.bd/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-23T..."
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

### Market Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/market-prices | সকল বাজার দাম |
| POST | /api/market-prices | দাম যোগ করুন (Admin) |
| PUT | /api/market-prices/:id | দাম আপডেট (Admin) |
| DELETE | /api/market-prices/:id | দাম মুছুন (Admin) |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/settings | সিস্টেম সেটিংস |
| PUT | /api/settings/:key | সেটিং আপডেট (Admin) |
| GET | /api/ad-settings | বিজ্ঞাপন সেটিংস |
| PUT | /api/ad-settings | বিজ্ঞাপন আপডেট (Admin) |

## 🔐 Default Admin Credentials
- **Email:** admin@fishcare.com
- **Password:** admin123

⚠️ **গুরুত্বপূর্ণ:** প্রথম লগইনের পর পাসওয়ার্ড পরিবর্তন করুন!

## 🛠 Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
systemctl status mysql

# Test connection
mysql -h mysql.hostinger.com -u u109046763_cal -p
```

### PM2 Issues
```bash
pm2 logs fishcare-api
pm2 restart fishcare-api
pm2 delete fishcare-api && pm2 start ecosystem.config.js
```

### CORS Issues
`.htaccess` ফাইলটি সঠিকভাবে কনফিগার করা আছে কিনা নিশ্চিত করুন।

## 📞 Support
- Documentation: MYSQL_MIGRATION_GUIDE.md
- GitHub: Auto-deploy configured
