
-- Add guest count columns to meal_entries
ALTER TABLE meal_entries ADD COLUMN breakfast_guest_count integer NOT NULL DEFAULT 0;
ALTER TABLE meal_entries ADD COLUMN lunch_guest_count integer NOT NULL DEFAULT 0;
ALTER TABLE meal_entries ADD COLUMN dinner_guest_count integer NOT NULL DEFAULT 0;
ALTER TABLE meal_entries ADD COLUMN updated_by uuid;

-- Add unique constraint for upsert if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meal_entries_user_date_month_unique') THEN
    ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_user_date_month_unique UNIQUE (user_id, date, month_key);
  END IF;
END $$;

-- Create cutoff settings table for admin-configurable cutoff times
CREATE TABLE IF NOT EXISTS public.meal_cutoff_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text NOT NULL,
  breakfast_cutoff_hour integer NOT NULL DEFAULT 22,
  breakfast_cutoff_prev_day boolean NOT NULL DEFAULT true,
  lunch_cutoff_hour integer NOT NULL DEFAULT 9,
  lunch_cutoff_prev_day boolean NOT NULL DEFAULT false,
  dinner_cutoff_hour integer NOT NULL DEFAULT 14,
  dinner_cutoff_prev_day boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_key)
);

ALTER TABLE public.meal_cutoff_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage cutoff settings"
ON public.meal_cutoff_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read cutoff settings"
ON public.meal_cutoff_settings FOR SELECT
USING (true);

-- Member can upsert own meals for today or future
CREATE POLICY "Members can upsert own meals"
ON meal_entries FOR ALL
USING (user_id = auth.uid() AND date >= CURRENT_DATE)
WITH CHECK (user_id = auth.uid() AND date >= CURRENT_DATE);
