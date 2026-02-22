
CREATE TABLE public.reminder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_key text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  hour_utc6 integer NOT NULL DEFAULT 8,
  minute_utc6 integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage reminder settings"
  ON public.reminder_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read reminder settings"
  ON public.reminder_settings FOR SELECT
  USING (true);

-- Seed default settings
INSERT INTO public.reminder_settings (reminder_key, is_enabled, hour_utc6, minute_utc6, description) VALUES
  ('meal_cutoff_breakfast', true, 21, 30, 'সকালের নাস্তা কাটঅফ রিমাইন্ডার'),
  ('meal_cutoff_lunch', true, 8, 30, 'দুপুরের খাবার কাটঅফ রিমাইন্ডার'),
  ('meal_cutoff_dinner', true, 13, 30, 'রাতের খাবার কাটঅফ রিমাইন্ডার'),
  ('negative_balance', true, 10, 0, 'নেগেটিভ ব্যালেন্স পেমেন্ট রিমাইন্ডার (প্রতি রবিবার)'),
  ('bazar_rotation', true, 8, 0, 'বাজার রোটেশন রিমাইন্ডার (প্রতিদিন)'),
  ('monthly_summary', true, 20, 0, 'মাসিক সারাংশ (মাসের শেষ দিন)'),
  ('new_month', true, 9, 0, 'নতুন মাস শুরু রিমাইন্ডার (মাসের ১ তারিখ)'),
  ('extra_expense', true, 10, 0, 'অতিরিক্ত খরচ রিমাইন্ডার (মাসের ২৫ তারিখ)'),
  ('daily_meal_summary', true, 21, 0, 'দৈনিক মিল সারাংশ (অ্যাডমিন)');
