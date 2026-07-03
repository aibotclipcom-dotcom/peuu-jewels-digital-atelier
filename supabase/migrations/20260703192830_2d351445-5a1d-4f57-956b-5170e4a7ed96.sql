
-- 1. Switch has_role to SECURITY INVOKER (safe: user_roles has self-read RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- 2. handle_new_user is a trigger function; revoke direct execute
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 3. Split products public read so anon never evaluates has_role
DROP POLICY IF EXISTS "Products public read" ON public.products;

CREATE POLICY "Products anon read published"
ON public.products
FOR SELECT
TO anon
USING (status = 'published'::product_status);

CREATE POLICY "Products auth read"
ON public.products
FOR SELECT
TO authenticated
USING (
  status = 'published'::product_status
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Replace WITH CHECK (true) on contact_messages insert with input validation
DROP POLICY IF EXISTS "Contact anyone insert" ON public.contact_messages;

CREATE POLICY "Contact anyone insert"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 200
  AND char_length(btrim(email)) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(btrim(message)) BETWEEN 1 AND 5000
);
