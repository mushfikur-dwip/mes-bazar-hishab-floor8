
-- Enable pg_cron and pg_net extensions for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to delete old activity logs (older than 1 month)
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.activity_logs
  WHERE created_at < now() - interval '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
