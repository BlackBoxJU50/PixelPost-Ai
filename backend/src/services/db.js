import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;

// ─── User helpers ─────────────────────────────────────────────────────────────
export async function upsertUser({ uid, email, displayName, photoURL, provider }) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: uid,
        email,
        display_name: displayName,
        photo_url: photoURL,
        provider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUser(uid) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserPrefs(uid, prefs) {
  const { data, error } = await supabase
    .from('users')
    .update({
      preferences: prefs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', uid)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(uid) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', uid);
  if (error) throw error;
}

// ─── Generation history helpers ───────────────────────────────────────────────
export async function saveGeneration({ userId, imageUrl, platforms, modelUsed, outputs }) {
  const { data, error } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      platforms,
      model_used: modelUsed,
      outputs,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getGenerations(userId, { page = 1, limit = 20, platform, search } = {}) {
  let query = supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (platform) {
    query = query.contains('platforms', [platform]);
  }
  if (search) {
    query = query.ilike('outputs->>caption', `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count, page, limit };
}

export async function deleteGeneration(id, userId) {
  const { error } = await supabase
    .from('generations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getQuotaUsage(userId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw error;
  return count || 0;
}

// ─── Custom API key helpers ───────────────────────────────────────────────────
export async function saveApiKey(userId, { provider, keyHash, keyMasked }) {
  const { data, error } = await supabase
    .from('api_keys')
    .upsert(
      { user_id: userId, provider, key_hash: keyHash, key_masked: keyMasked },
      { onConflict: 'user_id,provider' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getApiKeys(userId) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('provider, key_masked, created_at')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}
