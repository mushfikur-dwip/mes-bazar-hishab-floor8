

# 🍽️ মেস মিল ম্যানেজমেন্ট App (Meal Hisab)

## Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Validation:** Zod
- **Export:** PDF (jsPDF) + Excel (xlsx)
- **Language:** Bangla-first with English fallback (simple i18n)

---

## 🔐 Authentication & Roles
- Supabase Auth (email/password login)
- Two roles: **Admin** ও **Member**
- Roles stored in separate `user_roles` table with RLS + `has_role()` security definer function
- Admin: Full CRUD on everything
- Member: Read-only access to own data
- Server-side authorization via RLS policies on all tables

---

## 📱 Mobile-First Navigation (Bottom Nav)
Six tabs with bottom navigation bar optimized for one-hand use:
1. **ড্যাশবোর্ড** — Current month summary, meal rate, quick stats
2. **মিল** — Calendar view + day detail drawer for meal entries
3. **বাজার** — Bazar entry list + add form
4. **পেমেন্ট** — Payment records + add form
5. **রিপোর্ট** — Monthly breakdown table + PDF/Excel export
6. **সেটিংস** — Meal weights, member management, month selector, dark/light mode

---

## 📅 Month-Based System
- All data scoped by `month_key` (YYYY-MM format)
- Month selector in header/settings for Admin
- Member sees current month by default
- New month starts fresh automatically

---

## 🍳 Meal System (Admin Only)
- **Calendar View:** Monthly grid showing meal count per day
- **Day Detail Drawer:** Opens on tap — shows all members with Breakfast/Lunch/Dinner toggles
- **Bulk Actions:** "Mark all lunch", "Select all members" for quick entry
- **Meal Weights:** Configurable per month (default: Breakfast 0.5, Lunch 1.0, Dinner 1.0)
- **Storage:** One row per (user, date, month_key) with boolean fields for B/L/D
- Weight changes trigger recalculation

---

## 🛒 Bazar Entry (Admin Only)
- Date, amount, description, created_by
- List view with add/edit/delete
- Monthly total displayed prominently

---

## 💡 Extra Costs (Admin Only) — Equal Split
- Categories: Gas, Electricity, WiFi, Cleaner, Water, Others
- Month-scoped entries
- Split equally among **active** members of that month
- Admin can toggle member active/inactive per month

---

## 💰 Payments (Admin Only by Default)
- Member, date, amount, method (Cash/bKash/Nagad/Bank), note
- List view with filters
- Monthly total per member

---

## 📊 Calculation Engine
All computed on-the-fly (sufficient for 10-20 users):
- **Meal Rate** = Total Bazar ÷ Total Meal Units
- **Per Member:** Meal Units → Meal Cost → Extra Share → Total Cost → Paid → Net
- **Balance Carry-Over:**
  - Opening Balance (previous month closing)
  - This Month Net = Paid - Total Cost
  - Closing Balance = Opening + Net
- Stored in `balance_ledger` table, updated on any data change via Edge Function

---

## 📋 Reports
- **Admin View:** Full table — all members with Opening Balance, Meal Units, Meal Cost, Extra Share, Total Cost, Paid, Net, Closing Balance
- **Member View:** Own breakdown only
- **Export:** PDF and Excel download buttons
- Month selector to view past months

---

## 🗄️ Database Tables (Supabase)
1. `profiles` — user info (name, phone)
2. `user_roles` — admin/member role assignment
3. `member_month_status` — (user_id, month_key, is_active)
4. `meal_entries` — (user_id, date, month_key, breakfast, lunch, dinner)
5. `bazar_entries` — (month_key, date, amount, description, created_by)
6. `extra_costs` — (month_key, category, amount, note)
7. `payments` — (month_key, user_id, date, amount, method, note)
8. `meal_weight_settings` — (month_key, breakfast_weight, lunch_weight, dinner_weight)
9. `balance_ledger` — (user_id, month_key, opening_balance, closing_balance, computed_at)

All tables with RLS policies, audit fields (created_at, updated_at), and proper indexes on month_key.

---

## 🌙 Dark/Light Mode
- Theme toggle in Settings
- Persisted in localStorage

---

## 🌐 Bangla-First i18n
- Simple key-value object for bn/en labels
- All UI labels, buttons, and messages in Bangla by default
- Language toggle in Settings

---

## 🎯 Dashboard (Home)
- Current month at a glance:
  - Total meals, total bazar, meal rate
  - User's own: meals taken, cost, paid, balance
- Admin: Quick action buttons (Add Meal, Add Bazar, Add Payment)

---

## 📦 Seed Data
- 1 Admin + 10 demo Members
- Sample meal, bazar, payment data for current month

