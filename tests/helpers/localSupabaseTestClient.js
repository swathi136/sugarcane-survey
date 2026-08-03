import { createClient } from "@supabase/supabase-js";

export function getLocalSupabaseTestConfig() {
  const url = process.env.SUPABASE_TEST_URL;
  const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) return null;
  const parsed = new URL(url);
  if (!new Set(["localhost", "127.0.0.1", "::1"]).has(parsed.hostname)) {
    throw new Error("RLS integration tests refuse non-local Supabase URLs.");
  }
  return { url, anonKey, serviceRoleKey };
}

export function createLocalTestClients(config) {
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  return {
    anon: createClient(config.url, config.anonKey, options),
    admin: createClient(config.url, config.serviceRoleKey, options),
    recorder: (accessToken) => createClient(config.url, config.anonKey, { ...options, global: { headers: { Authorization: `Bearer ${accessToken}` } } }),
  };
}
