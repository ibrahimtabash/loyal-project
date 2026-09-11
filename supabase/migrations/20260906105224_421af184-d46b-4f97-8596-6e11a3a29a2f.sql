
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TYPE public.plan_tier AS ENUM ('free','pro','business');
CREATE TYPE public.sub_status AS ENUM ('trialing','active','past_due','canceled');
CREATE TYPE public.tx_type AS ENUM ('earn','redeem');

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'SAR',
  points_per_currency numeric NOT NULL DEFAULT 1,
  plan public.plan_tier NOT NULL DEFAULT 'free',
  subscription_status public.sub_status NOT NULL DEFAULT 'trialing',
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own businesses" ON public.businesses FOR ALL TO authenticated
USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.owns_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = _business_id AND b.owner_id = auth.uid());
$$;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  points_balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.customers (business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business customers" ON public.customers FOR ALL TO authenticated
USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.rewards (business_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business rewards" ON public.rewards FOR ALL TO authenticated
USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES public.rewards(id) ON DELETE SET NULL,
  type public.tx_type NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  amount numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.transactions (business_id, created_at DESC);
CREATE INDEX ON public.transactions (customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business transactions" ON public.transactions FOR ALL TO authenticated
USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

CREATE OR REPLACE FUNCTION public.apply_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bal integer;
BEGIN
  SELECT points_balance INTO bal FROM public.customers WHERE id = NEW.customer_id FOR UPDATE;
  IF NEW.type = 'redeem' AND bal < NEW.points THEN
    RAISE EXCEPTION 'رصيد النقاط غير كافٍ';
  END IF;
  UPDATE public.customers
    SET points_balance = points_balance + CASE WHEN NEW.type = 'earn' THEN NEW.points ELSE -NEW.points END
    WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_apply_transaction AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_transaction();
