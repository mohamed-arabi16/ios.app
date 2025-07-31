import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL_KEY = 'supabase_url';
const SUPABASE_ANON_KEY_KEY = 'supabase_anon_key';

export async function saveSupabaseKeys(url: string, key: string) {
  await SecureStore.setItemAsync(SUPABASE_URL_KEY, url);
  await SecureStore.setItemAsync(SUPABASE_ANON_KEY_KEY, key);
}

export async function getSupabaseKeys() {
  const url = await SecureStore.getItemAsync(SUPABASE_URL_KEY);
  const key = await SecureStore.getItemAsync(SUPABASE_ANON_KEY_KEY);
  return { url, key };
}

export async function deleteSupabaseKeys() {
    await SecureStore.deleteItemAsync(SUPABASE_URL_KEY);
    await SecureStore.deleteItemAsync(SUPABASE_ANON_KEY_KEY);
}
