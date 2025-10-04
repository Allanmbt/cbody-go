-- Create OTP codes table for staff (Thailand phone only)
CREATE TABLE IF NOT EXISTS public.otp_codes_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  provider TEXT DEFAULT 'thaibulksms',
  expire_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

create index if not exists idx_otp_codes_staff_phone_created_at
  on public.otp_codes_staff (phone, created_at desc);

alter table public.otp_codes_staff enable row level security;
-- 仅 Edge Functions（service_role）可访问
create policy "staff_edge_can_access" on public.otp_codes_staff
  for all to service_role using (true) with check (true);

-- Create index for efficient lookup
CREATE INDEX idx_otp_codes_staff_phone_created ON public.otp_codes_staff(phone, created_at DESC);

-- Enable RLS
ALTER TABLE public.otp_codes_staff ENABLE ROW LEVEL SECURITY;

-- Policy: Only service_role can access
CREATE POLICY "Service role only" ON public.otp_codes_staff
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create RPC function for staff login
CREATE OR REPLACE FUNCTION public.handle_login_staff(
  p_provider TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_is_first_login BOOLEAN;
BEGIN
  -- Verify caller is the current session user
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- Get user data from auth.users
  SELECT
    id,
    email,
    phone,
    created_at,
    last_sign_in_at
  INTO v_user
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if first login (created_at and last_sign_in_at are close)
  v_is_first_login := (
    v_user.last_sign_in_at IS NULL
    OR v_user.created_at + INTERVAL '10 seconds' > v_user.last_sign_in_at
  );

  -- Return user info
  RETURN json_build_object(
    'ok', true,
    'user_id', v_user.id,
    'email', v_user.email,
    'phone', v_user.phone,
    'created_at', v_user.created_at,
    'last_sign_in_at', v_user.last_sign_in_at,
    'is_first_login', v_is_first_login,
    'provider_echo', p_provider
  );
END;
$$;
