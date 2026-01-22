# MySQL মাইগ্রেশন গাইড

এই গাইডটি Lovable Cloud (Supabase) থেকে Hostinger MySQL-এ মাইগ্রেশনের জন্য।

## 📋 মাইগ্রেশন পদক্ষেপ

### ধাপ ১: Backend সেটআপ (Hostinger)

1. `hostinger-backend/` ফোল্ডার Hostinger-এ আপলোড করুন
2. phpMyAdmin-এ `database/schema.sql` ইম্পোর্ট করুন
3. `.env` ফাইল কনফিগার করুন
4. `npm install && npm start` চালান

### ধাপ ২: Frontend কনফিগারেশন

#### ২.১ Environment Variable সেট করুন

`.env` ফাইলে যোগ করুন:
```env
VITE_API_URL=https://your-hostinger-domain.com/api
```

#### ২.২ App.tsx আপডেট করুন

**বর্তমান (Supabase):**
```tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
```

**নতুন (MySQL):**
```tsx
import { AuthProvider } from "@/contexts/AuthContextMySQL";
import { ProductsProvider } from "@/contexts/ProductsContextMySQL";
```

#### ২.৩ Supabase Imports পরিবর্তন করুন

প্রতিটি পেজে যেখানে Supabase ব্যবহার হয়েছে, সেখানে API Client ব্যবহার করুন:

**বর্তমান:**
```tsx
import { supabase } from "@/integrations/supabase/client";

// Data fetch
const { data, error } = await supabase
  .from('products')
  .select('*');
```

**নতুন:**
```tsx
import { apiClient } from "@/lib/api-client";

// Data fetch
const response = await apiClient.getProducts();
if (response.data) {
  // use response.data.products
}
```

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
| `supabase.from('profiles').select()` | `apiClient.getUsers()` |

## 📁 ফাইল পরিবর্তন তালিকা

### আপডেট করতে হবে এমন ফাইল:

| ফাইল | পরিবর্তন |
|------|---------|
| `src/App.tsx` | AuthProvider, ProductsProvider import পরিবর্তন |
| `src/pages/Auth.tsx` | useAuth hook ব্যবহার (ইতিমধ্যে compatible) |
| `src/pages/Profile.tsx` | Profile update logic |
| `src/pages/MarketPrice.tsx` | apiClient.getMarketPrices() ব্যবহার |
| `src/pages/AdminUsers.tsx` | apiClient.getUsers() ব্যবহার |
| `src/pages/AdminProducts.tsx` | useProducts hook (compatible) |
| `src/pages/AdminMarketPrices.tsx` | apiClient methods ব্যবহার |
| `src/pages/AdminSettings.tsx` | apiClient.getSettings() ব্যবহার |
| `src/pages/AdminAds.tsx` | apiClient.getAdSettings() ব্যবহার |

### নতুন ফাইল (ইতিমধ্যে তৈরি):

- `src/lib/api-client.ts` - MySQL API Client
- `src/contexts/AuthContextMySQL.tsx` - MySQL Auth Context
- `src/contexts/ProductsContextMySQL.tsx` - MySQL Products Context

## 🔐 Authentication পার্থক্য

| বৈশিষ্ট্য | Supabase | MySQL Backend |
|---------|----------|---------------|
| Token Storage | Supabase manages | localStorage ('auth_token') |
| Session | Session object | JWT token |
| Auto Refresh | Built-in | Manual (token expiry) |
| Email Confirm | Optional | Not implemented |

## ⚠️ গুরুত্বপূর্ণ নোট

1. **Realtime সাপোর্ট নেই**: MySQL backend-এ Supabase-এর মতো realtime subscription নেই। Manual refresh প্রয়োজন।

2. **File Storage**: Supabase Storage ব্যবহার করলে, Hostinger-এ আলাদা file upload system প্রয়োজন।

3. **Edge Functions**: Supabase Edge Functions MySQL-এ কাজ করবে না। Express routes দিয়ে replace করতে হবে।

4. **RLS Policies**: MySQL-এ RLS নেই। Backend middleware দিয়ে authorization handle করা হয়েছে।

## 🚀 Quick Switch

সম্পূর্ণ switch করতে শুধু এই লাইনগুলো পরিবর্তন করুন:

```tsx
// src/App.tsx

// FROM (Supabase):
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductsProvider } from "@/contexts/ProductsContext";

// TO (MySQL):
import { AuthProvider } from "@/contexts/AuthContextMySQL";
import { ProductsProvider } from "@/contexts/ProductsContextMySQL";
```

এবং `.env` এ API URL সেট করুন:
```env
VITE_API_URL=https://your-api-domain.com/api
```

## 📞 সাপোর্ট

কোনো সমস্যা হলে:
1. Browser Console চেক করুন
2. Network tab-এ API calls দেখুন
3. Backend logs চেক করুন
