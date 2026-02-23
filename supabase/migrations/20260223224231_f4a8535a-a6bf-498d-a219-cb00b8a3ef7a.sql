
-- Activity log table
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'insert', 'update', 'delete'
  table_name text NOT NULL,
  record_id uuid,
  description text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated can read activity logs"
  ON public.activity_logs FOR SELECT
  USING (true);

-- Only system (service role) inserts via triggers
CREATE POLICY "Service role can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- Index for fast queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_table_name ON public.activity_logs(table_name);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Function to log meal changes
CREATE OR REPLACE FUNCTION public.log_meal_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      COALESCE(NEW.updated_by, NEW.user_id),
      'insert',
      'meal_entries',
      NEW.id,
      'মিল সেট করেছে',
      jsonb_build_object('date', NEW.date, 'breakfast', NEW.breakfast, 'lunch', NEW.lunch, 'dinner', NEW.dinner, 'target_user_id', NEW.user_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      COALESCE(NEW.updated_by, NEW.user_id),
      'update',
      'meal_entries',
      NEW.id,
      'মিল আপডেট করেছে',
      jsonb_build_object('date', NEW.date, 'breakfast', NEW.breakfast, 'lunch', NEW.lunch, 'dinner', NEW.dinner, 'target_user_id', NEW.user_id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      OLD.user_id,
      'delete',
      'meal_entries',
      OLD.id,
      'মিল মুছে ফেলেছে',
      jsonb_build_object('date', OLD.date)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to log bazar changes
CREATE OR REPLACE FUNCTION public.log_bazar_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      COALESCE(NEW.created_by, auth.uid()),
      'insert',
      'bazar_entries',
      NEW.id,
      'বাজার যোগ করেছে',
      jsonb_build_object('date', NEW.date, 'amount', NEW.amount, 'description', NEW.description)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      COALESCE(NEW.created_by, auth.uid()),
      'update',
      'bazar_entries',
      NEW.id,
      'বাজার আপডেট করেছে',
      jsonb_build_object('date', NEW.date, 'amount', NEW.amount, 'description', NEW.description)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      COALESCE(OLD.created_by, auth.uid()),
      'delete',
      'bazar_entries',
      OLD.id,
      'বাজার মুছে ফেলেছে',
      jsonb_build_object('date', OLD.date, 'amount', OLD.amount)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to log payment changes
CREATE OR REPLACE FUNCTION public.log_payment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      auth.uid(),
      'insert',
      'payments',
      NEW.id,
      'পেমেন্ট যোগ করেছে',
      jsonb_build_object('amount', NEW.amount, 'method', NEW.method, 'user_id', NEW.user_id, 'date', NEW.date)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      auth.uid(),
      'update',
      'payments',
      NEW.id,
      'পেমেন্ট আপডেট করেছে',
      jsonb_build_object('amount', NEW.amount, 'method', NEW.method, 'user_id', NEW.user_id, 'date', NEW.date)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (user_id, action, table_name, record_id, description, metadata)
    VALUES (
      auth.uid(),
      'delete',
      'payments',
      OLD.id,
      'পেমেন্ট মুছে ফেলেছে',
      jsonb_build_object('amount', OLD.amount, 'user_id', OLD.user_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER log_meal_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_meal_change();

CREATE TRIGGER log_bazar_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bazar_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_bazar_change();

CREATE TRIGGER log_payment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_change();
