
# Supabase থেকে MySQL API-তে বাকি ফাইলগুলো কনভার্ট করার পরিকল্পনা

## সারসংক্ষেপ
৬টি ফাইল থেকে সব Supabase ইম্পোর্ট রিমুভ করে `apiClient` দিয়ে প্রতিস্থাপন করা হবে এবং সব বিল্ড এরর ফিক্স করা হবে।

## পরিবর্তনের তালিকা

### 1. `src/hooks/useReviews.ts` - সম্পূর্ণ পুনর্লিখন
- `supabase` ইম্পোর্ট রিমুভ করে `apiClient` ব্যবহার করা হবে
- `fetchReviews()` - `apiClient.getProductReviews()` কল করবে
- `createReview()` - `apiClient.createReview()` কল করবে
- `updateReview()` - `apiClient.updateReview()` কল করবে
- `deleteReview()` - `apiClient.deleteReview()` কল করবে
- `markHelpful()` - `apiClient.markReviewHelpful()` কল করবে
- `user.id` কে `String()` এ কনভার্ট করার দরকার নেই - API নিজেই হ্যান্ডেল করবে
- ReviewStats ম্যাপিং: `rating_breakdown` থেকে `rating_distribution` এ কনভার্ট

### 2. `src/pages/DashboardMyPond.tsx` - Supabase থেকে apiClient
- `supabase` ইম্পোর্ট রিমুভ
- `apiClient` ইম্পোর্ট যোগ
- `fetchPonds()`: `apiClient.getPonds(String(user.id))` ব্যবহার
- `fetchSamplings()`: `apiClient.getSamplings(String(user.id))` ব্যবহার
- `handleSubmit()`: `apiClient.createPond()` / `apiClient.updatePond()` ব্যবহার
- `handleDelete()`: `apiClient.deletePond()` ব্যবহার
- `handleSellFish()`: `apiClient.createIncome()` ব্যবহার
- `handleAddExpense()`: `apiClient.createExpense()` ব্যবহার
- `handleSaveSampling()`: `apiClient.createSampling()` ব্যবহার
- `deleteSampling()`: `apiClient.deleteSampling()` ব্যবহার
- সব `user.id` কে `String()` দিয়ে পাস করার দরকার নেই - `apiClient` numeric ID গ্রহণ করে

### 3. `src/pages/AdminBackup.tsx` - Edge Function কল রিমুভ
- `supabase` ইম্পোর্ট রিমুভ
- `session?.access_token` এর বদলে `localStorage.getItem('auth_token')` ব্যবহার
- `supabase.functions.invoke()` এর বদলে `fetch()` দিয়ে সরাসরি API কল (বা `apiClient` এ backup endpoints যোগ)
- `supabase.from('system_settings')` এর বদলে `apiClient.getSettings()` / `apiClient.updateSetting()` ব্যবহার
- যেহেতু Hostinger-এ Edge Functions নেই, backup/restore কলগুলো `apiClient`-এর নতুন endpoint দিয়ে হবে

### 4. `src/pages/DashboardBackup.tsx` - Edge Function কল রিমুভ
- `supabase` ইম্পোর্ট রিমুভ
- `session?.access_token` রেফারেন্স রিমুভ, `auth_token` ব্যবহার
- `supabase.functions.invoke()` কে API কলে রূপান্তর
- একই backup API endpoints ব্যবহার

### 5. `src/pages/Profile.tsx` - `user_metadata` এরর ফিক্স
- Line 65: `user.user_metadata?.full_name` কে `user.full_name` দিয়ে প্রতিস্থাপন (MySQL `User` টাইপে `user_metadata` নেই)

### 6. `src/pages/DashboardOrders.tsx` - Supabase expense insertion ফিক্স
- `supabase` ইম্পোর্ট রিমুভ
- "Add to Pond Expense" বাটনে `supabase.from("farmer_expenses")` কে `apiClient.createExpense()` দিয়ে প্রতিস্থাপন
- `user.id` টাইপ মিসম্যাচ (number vs string) ফিক্স

### 7. `src/pages/Dashboard.tsx` - Line 580 `supabase` রেফারেন্স ফিক্স
- `RecentList` কম্পোনেন্টে `supabase` কল রিমুভ করে `apiClient.getIncomes()` / `apiClient.getExpenses()` ব্যবহার

### 8. `src/lib/api-client.ts` - Backup API endpoints যোগ
নতুন মেথড যোগ:
- `createBackup(scope)` - POST `/backup`
- `listBackups()` - GET `/backup`
- `restoreBackup(fileId)` - POST `/backup/restore`
- `downloadBackup(logId)` - GET `/backup/download`
- `getBackupStats()` - GET `/backup/stats`
- `cleanupBackups(params)` - POST `/backup/cleanup`
- Google Drive সংযোগ endpoints

### 9. `hostinger-backend/routes/backup.js` - নতুন ফাইল তৈরি
- Express রাউট যা backup/restore পরিচালনা করবে
- Google Drive OAuth ও ফাইল আপলোড/ডাউনলোড
- system_settings থেকে backup limit/retention পড়া

## টেকনিক্যাল বিবরণ

### টাইপ মিসম্যাচ সমাধান
MySQL ব্যাকএন্ডে `id` হলো `number` (INT AUTO_INCREMENT), তাই:
- `user.id` সরাসরি numeric হিসেবে পাঠানো হবে
- API Client ফাংশনে `String(id)` ব্যবহার হবে URL path-এ

### Backup Feature
হোস্টিং-এ Edge Functions নেই, তাই একটি Express route তৈরি হবে যা:
- ডাটাবেজ টেবিল ডাম্প করবে JSON হিসেবে
- Google Drive API দিয়ে আপলোড করবে
- Restore করলে JSON ডেটা টেবিলে insert করবে
