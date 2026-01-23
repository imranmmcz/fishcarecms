# MySQL Migration Guide - FishCare Pro

## ✅ স্ট্যাটাস: সম্পন্ন (Completed)

এই অ্যাপ্লিকেশনটি এখন **Hostinger MySQL Database**-এ সংযুক্ত এবং `https://blog.fishcare.com.bd/api` থেকে ডাটা পরিচালনা করছে।

---

## 🔗 সংযোগ তথ্য

### Database Configuration (Hostinger)
```env
DB_HOST=mysql.hostinger.com
DB_PORT=3306
DB_NAME=u109046763_cal
DB_USER=u109046763_cal
DB_PASSWORD=I1912.gp
JWT_SECRET=fishcare-bd-secret-key-2025
PORT=3000
FRONTEND_URL=https://fishcal.lovable.app
```

### API Base URL
```
https://blog.fishcare.com.bd/api
```

---

## 📁 ফাইল সুইচিং গাইড

### MySQL Contexts (বর্তমানে ব্যবহৃত)
| ফাইল | বিবরণ |
|------|--------|
| `src/contexts/AuthContextMySQL.tsx` | Authentication (Login/Signup) |
| `src/contexts/ProductsContextMySQL.tsx` | Products CRUD |
| `src/contexts/AdSettingsContextMySQL.tsx` | Ad Settings |
| `src/contexts/MarketPricesContextMySQL.tsx` | Market Prices |
| `src/lib/api-client.ts` | API Client |

### App.tsx Configuration (বর্তমান)
```tsx
// MySQL Backend Contexts - Hostinger MySQL Database
import { AuthProvider } from "@/contexts/AuthContextMySQL";
import { ProductsProvider } from "@/contexts/ProductsContextMySQL";
import { AdSettingsProvider } from "@/contexts/AdSettingsContextMySQL";
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | বিবরণ |
|--------|----------|--------|
| POST | `/api/auth/signup` | নতুন ব্যবহারকারী নিবন্ধন |
| POST | `/api/auth/signin` | লগইন |
| GET | `/api/auth/me` | বর্তমান ব্যবহারকারী |
| PUT | `/api/auth/password` | পাসওয়ার্ড পরিবর্তন |
| POST | `/api/auth/signout` | লগআউট |

### Products
| Method | Endpoint | বিবরণ |
|--------|----------|--------|
| GET | `/api/products` | পণ্য তালিকা |
| GET | `/api/products/:id` | একটি পণ্য |
| POST | `/api/products` | পণ্য যোগ (Admin) |
| PUT | `/api/products/:id` | পণ্য আপডেট (Admin) |
| DELETE | `/api/products/:id` | পণ্য মুছুন (Admin) |

### Market Prices
| Method | Endpoint | বিবরণ |
|--------|----------|--------|
| GET | `/api/market-prices` | বাজার দর তালিকা |
| POST | `/api/market-prices` | বাজার দর যোগ (Admin) |
| PUT | `/api/market-prices/:id` | বাজার দর আপডেট (Admin) |
| DELETE | `/api/market-prices/:id` | বাজার দর মুছুন (Admin) |

### Ad Settings
| Method | Endpoint | বিবরণ |
|--------|----------|--------|
| GET | `/api/ad-settings` | বিজ্ঞাপন সেটিংস |
| PUT | `/api/ad-settings` | বিজ্ঞাপন সেটিংস আপডেট (Admin) |

### Page Content
| Method | Endpoint | বিবরণ |
|--------|----------|--------|
| GET | `/api/page-content` | পেজ কন্টেন্ট তালিকা |
| GET | `/api/page-content/section/:key` | নির্দিষ্ট সেকশন |
| POST | `/api/page-content` | কন্টেন্ট যোগ (Admin) |
| PUT | `/api/page-content/:id` | কন্টেন্ট আপডেট (Admin) |

### Users (Admin Only)
| Method | Endpoint | বিবরণ |
|--------|----------|--------|
| GET | `/api/users` | ব্যবহারকারী তালিকা |
| PUT | `/api/users/:id` | ব্যবহারকারী আপডেট |
| PATCH | `/api/users/:id/role` | ভূমিকা পরিবর্তন |
| DELETE | `/api/users/:id` | ব্যবহারকারী মুছুন |

---

## 🔐 Default Admin Credentials
```
Email: admin@fishcare.com
Password: admin123
```

⚠️ **গুরুত্বপূর্ণ**: প্রোডাকশনে এই পাসওয়ার্ড পরিবর্তন করুন!

---

## 📊 Database Tables

| Table | বিবরণ |
|-------|--------|
| `users` | ব্যবহারকারী এবং অ্যাডমিন |
| `products` | পণ্য তালিকা |
| `market_prices` | মাছের বাজার দর |
| `ad_settings` | বিজ্ঞাপন সেটিংস |
| `page_content` | পেজ কন্টেন্ট |
| `system_settings` | সিস্টেম সেটিংস |

---

## 🔄 API ম্যাপিং

| Supabase Method | MySQL API Method |
|-----------------|------------------|
| `supabase.auth.signUp()` | `apiClient.signUp()` |
| `supabase.auth.signInWithPassword()` | `apiClient.signIn()` |
| `supabase.auth.signOut()` | `apiClient.signOut()` |
| `supabase.auth.getUser()` | `apiClient.getCurrentUser()` |
| `supabase.from('products').select()` | `apiClient.getProducts()` |
| `supabase.from('products').insert()` | `apiClient.createProduct()` |
| `supabase.from('products').update()` | `apiClient.updateProduct()` |
| `supabase.from('products').delete()` | `apiClient.deleteProduct()` |
| `supabase.from('market_prices').select()` | `apiClient.getMarketPrices()` |
| `supabase.from('ad_settings').select()` | `apiClient.getAdSettings()` |

---

## 🔄 Supabase-এ ফেরত যেতে

যদি Supabase-এ ফিরে যেতে চান, App.tsx-এ এই পরিবর্তন করুন:

```tsx
// Supabase Contexts
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { AdSettingsProvider } from "@/contexts/AdSettingsContext";
```

---

## ⚠️ গুরুত্বপূর্ণ নোট

1. **Realtime সাপোর্ট নেই**: MySQL backend-এ Supabase-এর মতো realtime subscription নেই। Manual refresh প্রয়োজন।

2. **File Storage**: Supabase Storage ব্যবহার করলে, Hostinger-এ আলাদা file upload system প্রয়োজন।

3. **Edge Functions**: Supabase Edge Functions MySQL-এ কাজ করবে না। Express routes দিয়ে replace করতে হবে।

4. **RLS Policies**: MySQL-এ RLS নেই। Backend middleware দিয়ে authorization handle করা হয়েছে।

---

## 🛠️ Troubleshooting

### সংযোগ সমস্যা
```bash
# API Health Check
curl https://blog.fishcare.com.bd/api/health

# Expected Response
{"status":"ok","timestamp":"2025-..."}
```

### CORS সমস্যা
Backend `.env`-এ FRONTEND_URL সঠিকভাবে সেট করুন:
```env
FRONTEND_URL=https://fishcal.lovable.app
```

### Database সংযোগ সমস্যা
Hostinger phpMyAdmin-এ গিয়ে নিশ্চিত করুন:
1. Database `u109046763_cal` আছে
2. `schema.sql` ইম্পোর্ট করা হয়েছে
3. Tables তৈরি হয়েছে

---

## ✅ সফলতার চেকলিস্ট

- [x] Backend Hostinger-এ ডেপ্লয় করা হয়েছে
- [x] MySQL Database সংযুক্ত
- [x] API endpoints কাজ করছে
- [x] Frontend MySQL contexts-এ সুইচ করা হয়েছে
- [x] GitHub auto-deploy সক্রিয়

---

## 📞 সাপোর্ট

কোনো সমস্যা হলে:
1. Browser Console চেক করুন
2. Network tab-এ API calls দেখুন
3. Backend logs চেক করুন (`pm2 logs` বা Hostinger Terminal)
