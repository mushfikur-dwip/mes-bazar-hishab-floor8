

## ব্যাকআপ ও রিস্টোর — ডাটা এক্সপোর্ট/ইমপোর্ট

### সারাংশ
Settings পেজের Admin ট্যাবে একটি "ব্যাকআপ ও রিস্টোর" সেকশন যোগ করা হবে যেখান থেকে অ্যাডমিন সমস্ত ডাটা JSON ফাইলে এক্সপোর্ট এবং সেই ফাইল থেকে ইমপোর্ট করতে পারবে।

### কিভাবে কাজ করবে

**এক্সপোর্ট (ব্যাকআপ):**
- একটি বাটনে ক্লিক করলে নিচের টেবিলগুলোর সব ডাটা একটি JSON ফাইলে ডাউনলোড হবে:
  - meal_entries
  - bazar_entries
  - payments
  - extra_costs
  - balance_ledger
  - meal_weight_settings
  - meal_cutoff_settings
  - member_month_status
  - bazar_rotation
  - profiles (নাম ও ফোন)
- ফাইলের নাম হবে: `meal-hisab-backup-YYYY-MM-DD.json`

**ইমপোর্ট (রিস্টোর):**
- JSON ফাইল আপলোড করলে ডাটা ডাটাবেসে রিস্টোর হবে
- Edge Function ব্যবহার করে সার্ভার সাইডে ইমপোর্ট হবে (নিরাপত্তার জন্য)
- ইমপোর্টের আগে কনফার্মেশন ডায়ালগ দেখাবে

### প্রযুক্তিগত বিবরণ

**1. Edge Function তৈরি: `supabase/functions/backup-restore/index.ts`**
- `GET` রিকোয়েস্টে সব টেবিলের ডাটা JSON হিসেবে রিটার্ন করবে
- `POST` রিকোয়েস্টে JSON ডাটা গ্রহণ করে upsert করবে
- অ্যাডমিন রোল ভেরিফিকেশন থাকবে
- Service role key ব্যবহার করে ডাটা ম্যানেজ করবে

**2. `supabase/config.toml` আপডেট**
- নতুন ফাংশনের জন্য `verify_jwt = false` এন্ট্রি যোগ

**3. UI কম্পোনেন্ট: Settings পেজে যোগ**
- Admin ট্যাবে ReminderSettings এর পরে একটি নতুন Card যোগ হবে
- "ব্যাকআপ ডাউনলোড" বাটন — ক্লিকে Edge Function কল করে JSON ডাউনলোড করবে
- "রিস্টোর" বাটন — ফাইল ইনপুট দিয়ে JSON আপলোড ও কনফার্মেশন ডায়ালগ দেখাবে
- লোডিং স্টেট ও সাকসেস/এরর টোস্ট মেসেজ

**4. i18n আপডেট: `src/lib/i18n.ts`**
- ব্যাকআপ সংক্রান্ত ট্রান্সলেশন কী যোগ

### ফাইল পরিবর্তন
| ফাইল | পরিবর্তন |
|---|---|
| `supabase/functions/backup-restore/index.ts` | নতুন Edge Function তৈরি |
| `supabase/config.toml` | ফাংশন কনফিগ যোগ (স্বয়ংক্রিয়) |
| `src/pages/Settings.tsx` | Admin ট্যাবে BackupRestore কম্পোনেন্ট যোগ |
| `src/lib/i18n.ts` | ট্রান্সলেশন কী যোগ |

