-- ==========================================================
-- Super Admin Organization Configuration Write RPCs
-- ==========================================================

-- ----------------------------------------------------------
-- 1. Organization Settings
-- ----------------------------------------------------------

create or replace function public.super_admin_update_organization_settings(
  p_organization_id uuid,
  p_show_court_type boolean,
  p_payment_mode text,
  p_gcash_qr_url text,
  p_gcash_number text,
  p_gcash_name text,
  p_deposit_percentage numeric,
  p_booking_horizon_days integer,
  p_booking_reference_prefix text
)
returns public.organization_settings
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_settings public.organization_settings;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_current_user_super_admin() then
    raise exception 'Only super administrators can update organization settings.';
  end if;

  if not exists (
    select 1
    from public.organizations
    where id = p_organization_id
  ) then
    raise exception 'Organization not found.';
  end if;

  if p_payment_mode not in ('manual', 'api') then
    raise exception 'Payment mode must be manual or api.';
  end if;

  if p_deposit_percentage < 1
     or p_deposit_percentage > 100 then
    raise exception 'Deposit percentage must be between 1 and 100.';
  end if;

  if p_booking_horizon_days < 1
     or p_booking_horizon_days > 3650 then
    raise exception 'Booking horizon must be between 1 and 3650 days.';
  end if;

  if p_booking_reference_prefix !~ '^[A-Z0-9]{2,6}$' then
    raise exception 'Booking reference prefix must contain 2 to 6 uppercase letters or numbers.';
  end if;

  update public.organization_settings
  set
    show_court_type = p_show_court_type,
    payment_mode = p_payment_mode,
    gcash_qr_url = nullif(trim(p_gcash_qr_url), ''),
    gcash_number = nullif(trim(p_gcash_number), ''),
    gcash_name = nullif(trim(p_gcash_name), ''),
    deposit_percentage = p_deposit_percentage,
    booking_horizon_days = p_booking_horizon_days,
    booking_reference_prefix = p_booking_reference_prefix,
    updated_at = now()
  where organization_id = p_organization_id
  returning * into v_settings;

  if v_settings.organization_id is null then
    raise exception 'Organization settings not found.';
  end if;

  return v_settings;
end;
$function$;


-- ----------------------------------------------------------
-- 2. Organization Branding
-- ----------------------------------------------------------

create or replace function public.super_admin_update_organization_branding(
  p_organization_id uuid,
  p_logo_url text,
  p_favicon_url text,
  p_hero_image_url text,
  p_primary_color text,
  p_secondary_color text,
  p_accent_color text,
  p_background_color text,
  p_surface_color text,
  p_surface_elevated_color text,
  p_text_color text,
  p_muted_text_color text,
  p_line_color text,
  p_heading_font text,
  p_body_font text,
  p_contact_url text,
  p_faq_url text,
  p_terms_url text,
  p_primary_button_color text
)
returns public.organization_branding
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_branding public.organization_branding;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_current_user_super_admin() then
    raise exception 'Only super administrators can update organization branding.';
  end if;

  if not exists (
    select 1
    from public.organizations
    where id = p_organization_id
  ) then
    raise exception 'Organization not found.';
  end if;

  if nullif(trim(p_primary_color), '') is null
     or nullif(trim(p_secondary_color), '') is null
     or nullif(trim(p_accent_color), '') is null
     or nullif(trim(p_background_color), '') is null
     or nullif(trim(p_surface_color), '') is null
     or nullif(trim(p_surface_elevated_color), '') is null
     or nullif(trim(p_text_color), '') is null
     or nullif(trim(p_muted_text_color), '') is null
     or nullif(trim(p_line_color), '') is null
     or nullif(trim(p_heading_font), '') is null
     or nullif(trim(p_body_font), '') is null then
    raise exception 'Required branding fields cannot be empty.';
  end if;

  update public.organization_branding
  set
    logo_url = nullif(trim(p_logo_url), ''),
    favicon_url = nullif(trim(p_favicon_url), ''),
    hero_image_url = nullif(trim(p_hero_image_url), ''),
    primary_color = trim(p_primary_color),
    secondary_color = trim(p_secondary_color),
    accent_color = trim(p_accent_color),
    background_color = trim(p_background_color),
    surface_color = trim(p_surface_color),
    surface_elevated_color = trim(p_surface_elevated_color),
    text_color = trim(p_text_color),
    muted_text_color = trim(p_muted_text_color),
    line_color = trim(p_line_color),
    heading_font = trim(p_heading_font),
    body_font = trim(p_body_font),
    contact_url = nullif(trim(p_contact_url), ''),
    faq_url = nullif(trim(p_faq_url), ''),
    terms_url = nullif(trim(p_terms_url), ''),
    primary_button_color = nullif(trim(p_primary_button_color), ''),
    updated_at = now()
  where organization_id = p_organization_id
  returning * into v_branding;

  if v_branding.organization_id is null then
    raise exception 'Organization branding not found.';
  end if;

  return v_branding;
end;
$function$;


-- ----------------------------------------------------------
-- 3. Organization Landing Content
-- ----------------------------------------------------------

create or replace function public.super_admin_update_organization_landing_content(
  p_organization_id uuid,
  p_hero_content jsonb,
  p_how_it_works jsonb,
  p_final_cta jsonb
)
returns public.organization_landing_content
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_content public.organization_landing_content;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_current_user_super_admin() then
    raise exception 'Only super administrators can update organization landing content.';
  end if;

  if not exists (
    select 1
    from public.organizations
    where id = p_organization_id
  ) then
    raise exception 'Organization not found.';
  end if;

  if p_hero_content is null
     or jsonb_typeof(p_hero_content) <> 'object' then
    raise exception 'Hero content must be a JSON object.';
  end if;

  if p_how_it_works is null
     or jsonb_typeof(p_how_it_works) <> 'object' then
    raise exception 'How-it-works content must be a JSON object.';
  end if;

  if p_final_cta is null
     or jsonb_typeof(p_final_cta) <> 'object' then
    raise exception 'Final CTA content must be a JSON object.';
  end if;

  update public.organization_landing_content
  set
    hero_content = p_hero_content,
    how_it_works = p_how_it_works,
    final_cta = p_final_cta,
    updated_at = now()
  where organization_id = p_organization_id
  returning * into v_content;

  if v_content.organization_id is null then
    raise exception 'Organization landing content not found.';
  end if;

  return v_content;
end;
$function$;


-- ----------------------------------------------------------
-- 4. Organization Branding Read
-- ----------------------------------------------------------

create or replace function public.super_admin_get_organization_branding(
  p_organization_id uuid
)
returns public.organization_branding
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_branding public.organization_branding;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_current_user_super_admin() then
    raise exception 'Only super administrators can access organization branding.';
  end if;

  select *
  into v_branding
  from public.organization_branding
  where organization_id = p_organization_id;

  if v_branding.organization_id is null then
    raise exception 'Organization branding not found.';
  end if;

  return v_branding;
end;
$function$;


-- ----------------------------------------------------------
-- 5. Organization Landing Content Read
-- ----------------------------------------------------------

create or replace function public.super_admin_get_organization_landing_content(
  p_organization_id uuid
)
returns public.organization_landing_content
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_content public.organization_landing_content;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not public.is_current_user_super_admin() then
    raise exception 'Only super administrators can access organization landing content.';
  end if;

  select *
  into v_content
  from public.organization_landing_content
  where organization_id = p_organization_id;

  if v_content.organization_id is null then
    raise exception 'Organization landing content not found.';
  end if;

  return v_content;
end;
$function$;
