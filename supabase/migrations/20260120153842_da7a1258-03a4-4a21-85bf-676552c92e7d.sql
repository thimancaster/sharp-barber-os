-- Create stock_movements table for tracking inventory changes
CREATE TABLE public.stock_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    movement_type TEXT NOT NULL DEFAULT 'in',
    reason TEXT,
    notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment for movement_type values
COMMENT ON COLUMN public.stock_movements.movement_type IS 'Valid values: in, out, sale, adjustment';

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view stock movements in their organization"
ON public.stock_movements
FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can create stock movements"
ON public.stock_movements
FOR INSERT
WITH CHECK (organization_id = get_user_organization_id() AND is_admin());

CREATE POLICY "Admins can delete stock movements"
ON public.stock_movements
FOR DELETE
USING (organization_id = get_user_organization_id() AND is_admin());

-- Create index for better query performance
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_org ON public.stock_movements(organization_id);
CREATE INDEX idx_stock_movements_created ON public.stock_movements(created_at DESC);