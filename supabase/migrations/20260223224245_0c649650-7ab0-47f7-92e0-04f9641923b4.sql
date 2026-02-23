
-- Fix: restrict INSERT to service role only (triggers run as SECURITY DEFINER)
DROP POLICY "Service role can insert activity logs" ON public.activity_logs;
CREATE POLICY "Only triggers can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (false);
