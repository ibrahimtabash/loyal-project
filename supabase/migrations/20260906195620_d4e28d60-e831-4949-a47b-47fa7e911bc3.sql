CREATE TABLE public.whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_number_id text NOT NULL,
  waba_id text,
  display_phone text,
  access_token text NOT NULL,
  default_template text,
  template_lang text NOT NULL DEFAULT 'ar',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_accounts TO authenticated;
GRANT ALL ON public.whatsapp_accounts TO service_role;

ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business whatsapp accounts" ON public.whatsapp_accounts
  FOR ALL TO authenticated
  USING (public.owns_business(business_id))
  WITH CHECK (public.owns_business(business_id));

CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON public.whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();