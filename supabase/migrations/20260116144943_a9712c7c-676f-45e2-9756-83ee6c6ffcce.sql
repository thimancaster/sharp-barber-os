
-- =====================================================
-- BARBERPRO PRIME - MULTI-TENANT SAAS SCHEMA
-- =====================================================

-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'barber');

-- 2. Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- =====================================================
-- BASE TABLES
-- =====================================================

-- Organizations (Barber Shops)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'barber',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, organization_id)
);

-- Profiles (Users linked to organizations)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, organization_id)
);

-- Clients
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- N8N Integrations
CREATE TABLE public.n8n_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    webhook_url TEXT,
    api_key TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON public.user_roles(organization_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_org_id ON public.profiles(organization_id);
CREATE INDEX idx_clients_org_id ON public.clients(organization_id);
CREATE INDEX idx_services_org_id ON public.services(organization_id);
CREATE INDEX idx_appointments_org_id ON public.appointments(organization_id);
CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_n8n_org_id ON public.n8n_integrations(organization_id);

-- =====================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =====================================================

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
$$;

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = _user_id 
          AND role = _role
          AND organization_id = public.get_user_organization_id()
    )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Check if current user is barber
CREATE OR REPLACE FUNCTION public.is_barber()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'barber')
$$;

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_n8n_updated_at BEFORE UPDATE ON public.n8n_integrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_integrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- ORGANIZATIONS POLICIES
CREATE POLICY "Users can view their organization"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (id = public.get_user_organization_id());

CREATE POLICY "Admins can update their organization"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (id = public.get_user_organization_id() AND public.is_admin())
    WITH CHECK (id = public.get_user_organization_id() AND public.is_admin());

-- USER_ROLES POLICIES
CREATE POLICY "Users can view roles in their organization"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can manage roles in their organization"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin())
    WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_admin());

-- PROFILES POLICIES
CREATE POLICY "Users can view profiles in their organization"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles in their organization"
    ON public.profiles FOR ALL
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin())
    WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_admin());

-- CLIENTS POLICIES
CREATE POLICY "Users can view clients in their organization"
    ON public.clients FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can create clients in their organization"
    ON public.clients FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update clients in their organization"
    ON public.clients FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id())
    WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can delete clients in their organization"
    ON public.clients FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin());

-- SERVICES POLICIES
CREATE POLICY "Users can view services in their organization"
    ON public.services FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can manage services in their organization"
    ON public.services FOR ALL
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin())
    WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_admin());

-- APPOINTMENTS POLICIES
CREATE POLICY "Users can view appointments in their organization"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can create appointments in their organization"
    ON public.appointments FOR INSERT
    TO authenticated
    WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can update any appointment in their organization"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin())
    WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_admin());

CREATE POLICY "Barbers can update their own appointments"
    ON public.appointments FOR UPDATE
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND barber_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    WITH CHECK (organization_id = public.get_user_organization_id() AND barber_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete appointments in their organization"
    ON public.appointments FOR DELETE
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin());

-- N8N INTEGRATIONS POLICIES
CREATE POLICY "Admins can view n8n integrations in their organization"
    ON public.n8n_integrations FOR SELECT
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin());

CREATE POLICY "Admins can manage n8n integrations in their organization"
    ON public.n8n_integrations FOR ALL
    TO authenticated
    USING (organization_id = public.get_user_organization_id() AND public.is_admin())
    WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_admin());
