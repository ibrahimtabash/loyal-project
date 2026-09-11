
CREATE OR REPLACE FUNCTION public.owns_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = _business_id AND b.owner_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_transaction() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owns_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_business(uuid) TO authenticated;
