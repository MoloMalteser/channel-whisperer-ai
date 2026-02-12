
-- Create profiles table for authenticated users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  check_interval_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to tracked_channels (nullable for migration)
ALTER TABLE public.tracked_channels ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies on tracked_channels to scope to user
DROP POLICY IF EXISTS "Anyone can view tracked channels" ON public.tracked_channels;
DROP POLICY IF EXISTS "Anyone can insert tracked channels" ON public.tracked_channels;
DROP POLICY IF EXISTS "Anyone can update tracked channels" ON public.tracked_channels;
DROP POLICY IF EXISTS "Anyone can delete tracked channels" ON public.tracked_channels;

CREATE POLICY "Users can view their own channels"
ON public.tracked_channels FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own channels"
ON public.tracked_channels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
ON public.tracked_channels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
ON public.tracked_channels FOR DELETE
USING (auth.uid() = user_id);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
