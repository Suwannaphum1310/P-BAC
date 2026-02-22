-- Assign teacher role to Suwannaphum131049@pbac.ac.th
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'Suwannaphum131049@pbac.ac.th';
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'teacher')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
