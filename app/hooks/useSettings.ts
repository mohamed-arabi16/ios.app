import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Currency } from './useIncomes';

export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  user_id: string;
  default_currency: Currency;
  theme: Theme;
  include_long_term: boolean;
  language: 'en' | 'ar';
}

// 1. Hook to fetch user settings
const fetchSettings = async (userId: string) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new Error(error.message);
  }
  return data as UserSettings | null;
};

export const useSettings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['settings', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return fetchSettings(user.id);
    },
    enabled: !!user,
  });
};

// 2. Hook to update user settings
// We use upsert here because a user might not have a settings row initially
const updateSettings = async (updatedSettings: Partial<UserSettings>, userId: string) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ ...updatedSettings, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as UserSettings;
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (updatedSettings: Partial<UserSettings>) => {
      if (!user) throw new Error('User not authenticated');
      return updateSettings(updatedSettings, user.id);
    },
    onSuccess: (data) => {
      // When settings update, invalidate the query to refetch
      queryClient.setQueryData(['settings', user?.id], data);
    },
  });
};
