
-- Add bazar_by column to track who did the bazar
ALTER TABLE bazar_entries ADD COLUMN bazar_by uuid;

-- Create bazar rotation table
CREATE TABLE IF NOT EXISTS public.bazar_rotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key text NOT NULL,
  user_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_key, user_id)
);

ALTER TABLE public.bazar_rotation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage rotation"
ON public.bazar_rotation FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read rotation"
ON public.bazar_rotation FOR SELECT
USING (true);
