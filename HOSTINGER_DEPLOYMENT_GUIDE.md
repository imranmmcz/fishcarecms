# 🐟 FishCare Pro - Hostinger Deployment Guide
## সম্পূর্ণ ওয়েবসাইট হোস্টিংগারে ডিপ্লয় করার গাইড

---

## 📋 সূচিপত্র
1. [প্রয়োজনীয়তা](#প্রয়োজনীয়তা)
2. [কোড ডাউনলোড](#ধাপ-১-কোড-ডাউনলোড)
3. [ডাটাবেস এক্সপোর্ট](#ধাপ-২-ডাটাবেস-এক্সপোর্ট)
4. [Hostinger সেটআপ](#ধাপ-৩-hostinger-সেটআপ)
5. [ডাটাবেস ইমপোর্ট](#ধাপ-৪-ডাটাবেস-ইমপোর্ট)
6. [কোড আপলোড](#ধাপ-৫-কোড-আপলোড)
7. [কনফিগারেশন](#ধাপ-৬-কনফিগারেশন)
8. [সমস্যা সমাধান](#সমস্যা-সমাধান)

---

## ⚠️ গুরুত্বপূর্ণ সতর্কতা

> **এই অ্যাপ্লিকেশনটি বর্তমানে Supabase (PostgreSQL) ব্যবহার করে।** 
> MySQL-এ মাইগ্রেট করতে হলে ব্যাকএন্ড কোড পরিবর্তন প্রয়োজন। 
> **সুপারিশ:** Lovable Cloud + Custom Domain ব্যবহার করুন (কোড পরিবর্তন ছাড়াই)।

---

## প্রয়োজনীয়তা

### Hostinger প্যাকেজ
- **VPS Hosting** অথবা **Cloud Hosting** (Node.js সাপোর্ট সহ)
- **MySQL Database** অ্যাক্সেস
- **SSH Access** (প্রয়োজনে)

### সফটওয়্যার
- Node.js v18+ 
- npm v9+
- Git (ঐচ্ছিক)

---

## ধাপ ১: কোড ডাউনলোড

### পদ্ধতি A: Lovable থেকে GitHub-এ Export

1. **Lovable Dashboard** যান
2. **Settings** → **GitHub** ক্লিক করুন
3. **Connect to GitHub** বাটনে ক্লিক করুন
4. Repository তৈরি করুন
5. GitHub থেকে clone করুন:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### পদ্ধতি B: ম্যানুয়াল ডাউনলোড

Lovable এডিটরে প্রতিটি ফাইল কপি করে লোকাল ফোল্ডারে সেভ করুন।

### প্রজেক্ট স্ট্রাকচার
```
fishcare-pro/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── integrations/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── supabase/
│   ├── functions/
│   └── config.toml
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## ধাপ ২: ডাটাবেস এক্সপোর্ট

### MySQL ফরম্যাটে এক্সপোর্ট

1. **Admin Panel** এ লগইন করুন: `/admin`
2. **Database Export** পেজে যান: `/admin/database-export`
3. সমস্ত টেবিল সিলেক্ট করুন
4. **Export Format:** `MySQL` সিলেক্ট করুন
5. **Export Data** বাটনে ক্লিক করুন
6. `fishcare_export_YYYY-MM-DD.sql` ফাইল ডাউনলোড হবে

### বর্তমান টেবিলসমূহ
| টেবিল নাম | বাংলা নাম | বিবরণ |
|-----------|-----------|--------|
| `market_prices` | বাজার দর | মাছের দাম তথ্য |
| `products` | পণ্যসমূহ | দোকানের পণ্য |
| `profiles` | ব্যবহারকারী প্রোফাইল | ইউজার ইনফো |
| `user_roles` | ব্যবহারকারী রোল | এডমিন/ইউজার |
| `page_content` | পেজ কন্টেন্ট | ডায়নামিক কন্টেন্ট |
| `ad_settings` | বিজ্ঞাপন সেটিংস | অ্যাড কনফিগ |
| `system_settings` | সিস্টেম সেটিংস | অ্যাপ সেটিংস |

---

## ধাপ ৩: Hostinger সেটআপ

### 3.1 VPS/Cloud Hosting কিনুন

1. [Hostinger.com](https://www.hostinger.com) যান
2. **VPS Hosting** অথবা **Cloud Hosting** সিলেক্ট করুন
3. **Node.js** টেমপ্লেট সিলেক্ট করুন
4. পেমেন্ট সম্পন্ন করুন

### 3.2 hPanel এ লগইন

1. [hPanel](https://hpanel.hostinger.com) এ লগইন করুন
2. আপনার হোস্টিং সিলেক্ট করুন

### 3.3 MySQL ডাটাবেস তৈরি

1. **Databases** → **MySQL Databases** যান
2. নতুন ডাটাবেস তৈরি করুন:
   - **Database Name:** `fishcare_db`
   - **Username:** `fishcare_user`
   - **Password:** একটি শক্তিশালী পাসওয়ার্ড দিন
3. তথ্য নোট করুন:
   ```
   DB_HOST: localhost (অথবা mysql.hostinger.com)
   DB_NAME: u123456789_fishcare_db
   DB_USER: u123456789_fishcare_user
   DB_PASSWORD: your_password
   DB_PORT: 3306
   ```

---

## ধাপ ৪: ডাটাবেস ইমপোর্ট

### 4.1 phpMyAdmin ব্যবহার করে

1. hPanel → **Databases** → **phpMyAdmin** ক্লিক করুন
2. আপনার ডাটাবেস সিলেক্ট করুন
3. **Import** ট্যাবে যান
4. **Choose File** → এক্সপোর্ট করা `.sql` ফাইল সিলেক্ট করুন
5. **Go** বাটনে ক্লিক করুন

### 4.2 SSH দিয়ে (Advanced)

```bash
# SSH এ কানেক্ট করুন
ssh u123456789@your-server-ip

# MySQL এ ইমপোর্ট করুন
mysql -u u123456789_fishcare_user -p u123456789_fishcare_db < fishcare_export.sql
```

---

## ধাপ ৫: কোড আপলোড

### 5.1 লোকালে বিল্ড করুন

```bash
# প্রজেক্ট ফোল্ডারে যান
cd fishcare-pro

# ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# প্রোডাকশন বিল্ড করুন
npm run build
```

এটি `dist/` ফোল্ডার তৈরি করবে।

### 5.2 File Manager দিয়ে আপলোড

1. hPanel → **Files** → **File Manager** যান
2. `public_html` ফোল্ডারে যান
3. `dist/` ফোল্ডারের সব কন্টেন্ট আপলোড করুন

### 5.3 FTP দিয়ে আপলোড

```
FTP Host: ftp.yourdomain.com
Username: u123456789
Password: your_ftp_password
Port: 21
Directory: /public_html/
```

FileZilla বা অন্য FTP ক্লায়েন্ট ব্যবহার করুন।

---

## ধাপ ৬: কনফিগারেশন

### ⚠️ গুরুত্বপূর্ণ: ব্যাকএন্ড মাইগ্রেশন

বর্তমান অ্যাপ **Supabase** ব্যবহার করে। MySQL-এ চালাতে হলে নিচের পরিবর্তন প্রয়োজন:

### 6.1 নতুন Backend API তৈরি করুন

`api/` ফোল্ডার তৈরি করুন এবং Express.js API সেটআপ করুন:

```javascript
// api/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Market Prices API
app.get('/api/market-prices', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM market_prices ORDER BY price_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
```

### 6.2 Environment Variables

`.env` ফাইল তৈরি করুন:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=u123456789_fishcare_db
DB_USER=u123456789_fishcare_user
DB_PASSWORD=your_secure_password
DB_PORT=3306

# API Configuration
API_URL=https://yourdomain.com/api
PORT=3001

# App Configuration
VITE_API_URL=https://yourdomain.com/api
```

### 6.3 Frontend কোড পরিবর্তন

`src/integrations/` এ নতুন MySQL ক্লায়েন্ট তৈরি করুন:

```typescript
// src/integrations/mysql/client.ts
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
  
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
};
```

### 6.4 Authentication পরিবর্তন

Supabase Auth থেকে JWT-based custom auth-এ মাইগ্রেট করতে হবে:

```javascript
// api/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const [users] = await pool.query(
    'SELECT * FROM profiles WHERE email = ?', 
    [email]
  );
  
  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ token, user: { id: user.id, email: user.email } });
});
```

---

## 🔄 বিকল্প পদ্ধতি (সুপারিশকৃত)

### Lovable Cloud + Hostinger Domain

**এই পদ্ধতিতে কোড পরিবর্তন লাগবে না!**

1. **Hostinger থেকে শুধু Domain কিনুন**
2. **Lovable-এ Domain সংযুক্ত করুন:**
   - Project Settings → Domains → Connect Domain
3. **Hostinger DNS সেটিংস:**
   
   | Type | Name | Value |
   |------|------|-------|
   | A | @ | 185.158.133.1 |
   | A | www | 185.158.133.1 |
   | TXT | _lovable | lovable_verify=YOUR_CODE |

4. **সুবিধাসমূহ:**
   - ✅ কোড পরিবর্তন নেই
   - ✅ Supabase ডাটাবেস বিল্ট-ইন
   - ✅ অটোমেটিক SSL
   - ✅ Authentication রেডি
   - ✅ RLS সিকিউরিটি
   - ✅ Edge Functions সাপোর্ট

---

## সমস্যা সমাধান

### সাধারণ সমস্যা

| সমস্যা | সমাধান |
|--------|--------|
| Database connection error | `.env` ফাইলের DB credentials চেক করুন |
| 404 Error | `public_html`-এ সব ফাইল আছে কিনা দেখুন |
| CORS Error | API-তে CORS কনফিগারেশন যোগ করুন |
| Build failed | Node.js v18+ ইনস্টল আছে কিনা চেক করুন |
| Auth not working | JWT_SECRET সেট করা আছে কিনা দেখুন |

### লগ চেক করুন

```bash
# Error logs
tail -f /var/log/nginx/error.log

# App logs
pm2 logs fishcare-api
```

---

## 📞 সাপোর্ট

- **Hostinger Support:** [support.hostinger.com](https://support.hostinger.com)
- **Lovable Docs:** [docs.lovable.dev](https://docs.lovable.dev)

---

## 📝 চেকলিস্ট

- [ ] কোড ডাউনলোড করা হয়েছে
- [ ] MySQL ফাইল এক্সপোর্ট করা হয়েছে
- [ ] Hostinger-এ হোস্টিং কেনা হয়েছে
- [ ] MySQL ডাটাবেস তৈরি করা হয়েছে
- [ ] SQL ফাইল ইমপোর্ট করা হয়েছে
- [ ] কোড বিল্ড করা হয়েছে
- [ ] ফাইল আপলোড করা হয়েছে
- [ ] Environment variables সেট করা হয়েছে
- [ ] ওয়েবসাইট টেস্ট করা হয়েছে

---

**শেষ আপডেট:** জানুয়ারি ২০২৬
