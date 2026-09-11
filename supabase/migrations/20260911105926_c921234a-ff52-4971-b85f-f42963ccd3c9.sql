ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'oasis',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_key ON public.businesses (slug);

CREATE POLICY "public can view published storefronts"
ON public.businesses FOR SELECT TO anon, authenticated
USING (is_published = true);

GRANT SELECT ON public.businesses TO anon;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  category text,
  is_available boolean NOT NULL DEFAULT true,
  reward_points integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages products" ON public.products FOR ALL TO authenticated
  USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "public views available products" ON public.products FOR SELECT TO anon, authenticated
  USING (is_available = true AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_published));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  address text,
  note text,
  total numeric NOT NULL DEFAULT 0,
  points_awarded integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages orders" ON public.orders FOR ALL TO authenticated
  USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "anyone can place order" ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.is_published));
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner views order items" ON public.order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.owns_business(o.business_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND public.owns_business(o.business_id)));
CREATE POLICY "anyone adds order items" ON public.order_items FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o JOIN public.businesses b ON b.id = o.business_id WHERE o.id = order_id AND b.is_published));

CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages customer notes" ON public.customer_notes FOR ALL TO authenticated
  USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

CREATE INDEX IF NOT EXISTS products_business_idx ON public.products(business_id);
CREATE INDEX IF NOT EXISTS orders_business_idx ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS customer_notes_customer_idx ON public.customer_notes(customer_id);