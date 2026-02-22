# গেস্ট মিল ফিচার + সদস্যের নিজের মিল অন/অফ

## সমস্যা

বর্তমানে meal_entries টেবিলে শুধু boolean (হ্যাঁ/না) আছে। গেস্ট মিল ট্র্যাক করা যায় না, এবং সদস্য নিজে তার মিল সেট করতে পারে না।

## সমাধান - দুই পার্ট

---

### পার্ট ১: গেস্ট মিল

**ডাটাবেস পরিবর্তন:**

- `meal_entries` টেবিলে ৩টি নতুন কলাম যোগ:
  - `breakfast_guest_count` (integer, default 0)
  - `lunch_guest_count` (integer, default 0)
  - `dinner_guest_count` (integer, default 0)

**লজিক:**

- গেস্ট মিল সেই সদস্যের মিল ইউনিটে যোগ হবে
- যেমন: রহিম দুপুরে খেয়েছে + ২ গেস্ট আনল = লাঞ্চ ইউনিট ৩ (১ নিজে + ২ গেস্ট)
- গেস্ট কাউন্ট শুধু Admin সেট করতে পারবে

**Calculation পরিবর্তন:**

- `MealEntry` interface-এ guest count ফিল্ড যোগ
- `calcMealUnits()` ফাংশনে:
  ```text
  breakfast units = breakfast ? (1 + breakfast_guest_count) * weight : 0
  lunch units = lunch ? (1 + lunch_guest_count) * weight : 0
  dinner units = dinner ? (1 + dinner_guest_count) * weight : 0
  ```
- শর্ত: গেস্ট তখনই কাউন্ট হবে যখন সদস্যের নিজের সেই মিল ON আছে

**UI পরিবর্তন (Admin - Day Detail Drawer):**

- প্রতিটি মিল Switch-এর পাশে একটি ছোট নম্বর ইনপুট (0-10) থাকবে গেস্ট কাউন্টের জন্য
- Switch OFF থাকলে গেস্ট ইনপুট disabled

---

### পার্ট ২: সদস্যের নিজের মিল অন/অফ

**কনসেপ্ট:** সদস্য আগে থেকে জানাবে সে পরের দিন/আজকে কোন মিল খাবে না।

**শর্ত ও নিয়ম:**

1. সদস্য শুধু **আজকে বা ভবিষ্যতের** তারিখের মিল সেট করতে পারবে (অতীত এডিট করা যাবে না)
2. ডিফল্ট সব মিল **ON** — সদস্য চাইলে OFF করবে (opt-out model)
3. একটি **কাটঅফ টাইম** থাকবে: যেমন সকালের মিল বন্ধ করতে হলে আগের রাত ১০টার মধ্যে বলতে হবে
  - ব্রেকফাস্ট: আগের দিন রাত ১০:০০ PM
  - লাঞ্চ: সেদিন সকাল ৯:০০ AM
  - ডিনার: সেদিন দুপুর ২:০০ PM
  - এই কাট অফ টাইম অ্যাডমিন চেঞ্জ করতে পারবে
4. কাটঅফ পার হলে আর পরিবর্তন করা যাবে না (Admin ছাড়া)
5. Admin সবসময় যেকোনো তারিখ এডিট করতে পারবে

**ডাটাবেস পরিবর্তন:**

- `meal_entries` টেবিলে নতুন কলাম: `updated_by` (uuid, nullable) — কে শেষ আপডেট করেছে ট্র্যাক করতে

**RLS পলিসি আপডেট:**

- নতুন পলিসি: Members can update own meals
  - `user_id = auth.uid()` এবং `date >= CURRENT_DATE`

**UI পরিবর্তন (Member Portal):**

- Meals পেজে সদস্য দেখবে আজকে ও আগামী ৭ দিনের মিল তালিকা
- প্রতিটি দিনে B/L/D toggle থাকবে
- কাটঅফ পার হলে toggle disabled + "সময় শেষ" মেসেজ
- গেস্ট কাউন্ট ফিল্ড Member-এর জন্য থাকবে না (শুধু Admin)

---

### রিপোর্টে দেখাবে

- রিপোর্ট টেবিলে একটি নতুন কলাম: **গেস্ট মিল ইউনিট** (আলাদা করে দেখানো)
- মোট মিল ইউনিট = নিজের + গেস্টের

---

## টেকনিক্যাল বিস্তারিত

### ডাটাবেস মাইগ্রেশন

```text
ALTER TABLE meal_entries ADD COLUMN breakfast_guest_count integer NOT NULL DEFAULT 0;
ALTER TABLE meal_entries ADD COLUMN lunch_guest_count integer NOT NULL DEFAULT 0;
ALTER TABLE meal_entries ADD COLUMN dinner_guest_count integer NOT NULL DEFAULT 0;
ALTER TABLE meal_entries ADD COLUMN updated_by uuid;

-- Member can upsert own meals for today or future
CREATE POLICY "Members can upsert own meals"
ON meal_entries FOR ALL
USING (user_id = auth.uid() AND date >= CURRENT_DATE)
WITH CHECK (user_id = auth.uid() AND date >= CURRENT_DATE);
```

### ফাইল পরিবর্তন তালিকা

1. `**src/lib/calculations.ts**` — MealEntry interface-এ guest fields যোগ, calcMealUnits আপডেট
2. `**src/pages/Meals.tsx**` — DayMealEditor-এ guest count input যোগ, Member view তৈরি (আজ + ৭ দিন)
3. `**src/hooks/useMonthData.ts**` — mealEntries mapping-এ guest count ফিল্ড যোগ
4. `**src/lib/i18n.ts**` — নতুন labels (গেস্ট, সময় শেষ ইত্যাদি)
5. `**src/pages/Reports.tsx**` — গেস্ট মিল কলাম যোগ
6. `**src/lib/export.ts**` — PDF/Excel-এ গেস্ট মিল ডেটা যোগ