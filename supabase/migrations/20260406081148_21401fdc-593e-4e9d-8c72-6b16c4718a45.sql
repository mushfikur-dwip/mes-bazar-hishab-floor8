-- Disable user triggers only
ALTER TABLE public.payments DISABLE TRIGGER log_payment_changes;
ALTER TABLE public.bazar_entries DISABLE TRIGGER log_bazar_changes;
ALTER TABLE public.meal_entries DISABLE TRIGGER log_meal_changes;

-- Truncate all tables
TRUNCATE public.activity_logs;
TRUNCATE public.balance_ledger;
TRUNCATE public.bazar_entries;
TRUNCATE public.bazar_rotation;
TRUNCATE public.extra_costs;
TRUNCATE public.meal_cutoff_settings;
TRUNCATE public.meal_entries;
TRUNCATE public.meal_weight_settings;
TRUNCATE public.member_month_status;
TRUNCATE public.notifications;
TRUNCATE public.payments;
TRUNCATE public.user_roles;
TRUNCATE public.profiles;
TRUNCATE public.reminder_settings;

-- Re-enable user triggers
ALTER TABLE public.payments ENABLE TRIGGER log_payment_changes;
ALTER TABLE public.bazar_entries ENABLE TRIGGER log_bazar_changes;
ALTER TABLE public.meal_entries ENABLE TRIGGER log_meal_changes;