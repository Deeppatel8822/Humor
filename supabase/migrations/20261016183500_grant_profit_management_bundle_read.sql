-- Profit Management reads bundle definitions when calculating bundle product costs.
-- Keep this privilege server-only; no anon/authenticated access is granted.
GRANT SELECT ON TABLE public.bundles TO service_role;
