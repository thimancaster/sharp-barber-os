-- Add commission_rate to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0;

-- Add commission_rate and working_hours to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "09:00", "end": "14:00"}, "sunday": null}'::jsonb;