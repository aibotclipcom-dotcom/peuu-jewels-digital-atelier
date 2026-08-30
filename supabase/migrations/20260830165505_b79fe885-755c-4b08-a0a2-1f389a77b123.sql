REVOKE ALL ON FUNCTION public.duplicate_product(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.duplicate_product(uuid) TO service_role;