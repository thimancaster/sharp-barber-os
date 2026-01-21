-- Function to complete onboarding: creates organization, profile, and admin role atomically
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  org_name TEXT,
  org_slug TEXT,
  profile_full_name TEXT,
  org_phone TEXT DEFAULT NULL,
  org_address TEXT DEFAULT NULL,
  profile_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  new_profile_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = current_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'User already has a profile');
  END IF;
  
  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) THEN
    RETURN json_build_object('success', false, 'error', 'Organization slug already exists');
  END IF;
  
  -- Create organization
  INSERT INTO public.organizations (name, slug, phone, address)
  VALUES (org_name, org_slug, org_phone, org_address)
  RETURNING id INTO new_org_id;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, organization_id, full_name, phone, is_active)
  VALUES (current_user_id, new_org_id, profile_full_name, profile_phone, true)
  RETURNING id INTO new_profile_id;
  
  -- Create admin role
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (current_user_id, new_org_id, 'admin');
  
  RETURN json_build_object(
    'success', true,
    'organization_id', new_org_id,
    'profile_id', new_profile_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;