-- Add category column to services table
ALTER TABLE public.services
ADD COLUMN category TEXT DEFAULT 'outros';

-- Add comment for valid categories
COMMENT ON COLUMN public.services.category IS 'Valid values: cabelo, barba, combo, outros';

-- Create products table for stock management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (organization-scoped)
CREATE POLICY "Users can view products in their organization"
ON public.products
FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() AND is_admin());

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (organization_id = get_user_organization_id() AND is_admin());

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (organization_id = get_user_organization_id() AND is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create expenses table for financial module
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  category TEXT DEFAULT 'outros',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment for valid statuses
COMMENT ON COLUMN public.expenses.status IS 'Valid values: pending, paid';

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses (admin only)
CREATE POLICY "Admins can view expenses"
ON public.expenses
FOR SELECT
USING (organization_id = get_user_organization_id() AND is_admin());

CREATE POLICY "Admins can insert expenses"
ON public.expenses
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() AND is_admin());

CREATE POLICY "Admins can update expenses"
ON public.expenses
FOR UPDATE
USING (organization_id = get_user_organization_id() AND is_admin());

CREATE POLICY "Admins can delete expenses"
ON public.expenses
FOR DELETE
USING (organization_id = get_user_organization_id() AND is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();