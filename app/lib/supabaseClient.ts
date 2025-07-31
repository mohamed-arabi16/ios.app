import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseKeys } from './secrets';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = async (): Promise<SupabaseClient> => {
    if (supabase) {
        return supabase;
    }

    const { url, key } = await getSupabaseKeys();

    if (!url || !key) {
        throw new Error('Supabase URL and Anon Key must be provided.');
    }

    supabase = createClient(url, key, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });

    return supabase;
};
