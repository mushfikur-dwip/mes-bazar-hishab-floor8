
-- Add telegram_chat_id and fcm_token to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token text DEFAULT NULL;
