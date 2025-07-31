import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Currency } from './useIncomes';
import { useNetwork } from './useNetwork';
import { addToQueue } from '../lib/offlineQueue';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';

// Type definitions from web app
export interface DebtAmountHistory {
  id: string;
  debt_id: string;
  user_id: string;
  amount: number;
  note: string;
  logged_at: string;
}

export interface Debt {
  id:string;
  user_id: string;
  title: string;
  creditor: string;
  amount: number;
  currency: Currency;
  due_date: string | null;
  status: 'pending' | 'paid';
  type: 'short' | 'long';
  created_at?: string;
  debt_amount_history: DebtAmountHistory[];
}

// 1. Hook to fetch all debts with history
const fetchDebts = async (userId: string) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('debts')
    .select('*, debt_amount_history(*)')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Debt[];
};

export const useDebts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['debts', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return fetchDebts(user.id);
    },
    enabled: !!user,
  });
};

// 2. Hook to add a new debt
type AddDebtPayload = Omit<Debt, 'id' | 'user_id' | 'created_at' | 'debt_amount_history'>;

export const addDebt = async (newDebt: AddDebtPayload, userId: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
        .from('debts')
        .insert([{ ...newDebt, user_id: userId }])
        .select('*, debt_amount_history(*)')
        .single();

    if (error) throw new Error(error.message);
    return data as Debt;
};

export const useAddDebt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOffline } = useNetwork();

  return useMutation({
    mutationFn: async (newDebt: AddDebtPayload): Promise<any> => {
      if (!user) throw new Error('User not authenticated');

      if (isOffline) {
        const optimisticId = `offline_${uuid.v4()}`;
        const payload = { ...newDebt, id: optimisticId, user_id: user.id };
        await addToQueue({ type: 'ADD_DEBT', payload });

        // Optimistic update
        queryClient.setQueryData(['debts', user.id], (oldData: Debt[] | undefined) => {
            const newDebtWithDefaults: Debt = {
                ...newDebt,
                id: optimisticId,
                user_id: user.id,
                created_at: new Date().toISOString(),
                debt_amount_history: [],
                currency: newDebt.currency || 'USD',
                status: newDebt.status || 'pending',
            };
            return oldData ? [...oldData, newDebtWithDefaults] : [newDebtWithDefaults];
        });
        return newDebtWithDefaults;
      } else {
        return addDebt(newDebt, user.id);
      }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['debts', user?.id] });
        Toast.show({ type: 'success', text1: 'Debt added' });
        if (isOffline) {
          Toast.show({ type: 'info', text1: 'Your change is saved and will sync when you\'re back online.' });
        }
      },
      onError: (error: Error) => {
        Toast.show({ type: 'error', text1: 'An error occurred', text2: error.message });
      },
  });
};

// 3. Hook to update a debt (including amount via RPC)
export interface UpdateDebtPayload {
    id: string;
    title?: string;
    creditor?: string;
    due_date?: string | null;
    status?: 'pending' | 'paid';
    currency?: Currency;
    // For amount changes:
    amount?: number;
    note?: string;
}

export const updateDebt = async (payload: UpdateDebtPayload) => {
    const supabase = await getSupabaseClient();
    const { id, amount, note, ...basicDetails } = payload;

    // Update basic details if they exist
    if (Object.keys(basicDetails).length > 0) {
        const { error: updateError } = await supabase
          .from('debts')
          .update(basicDetails)
          .eq('id', id);
        if (updateError) throw new Error(updateError.message);
    }

    // If amount is being updated, use the RPC
    if (typeof amount === 'number') {
        const { error: rpcError } = await supabase.rpc('update_debt_amount', {
          in_debt_id: id,
          in_new_amount: amount,
          in_note: note || 'Updated amount',
        });
        if (rpcError) throw new Error(rpcError.message);
    }

    return payload;
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOffline } = useNetwork();

  return useMutation({
    mutationFn: async (payload: UpdateDebtPayload) => {
      if (isOffline) {
        await addToQueue({ type: 'UPDATE_DEBT', payload });

        // Optimistic update
        queryClient.setQueryData(['debts', user?.id], (oldData: Debt[] = []) =>
          oldData.map(debt =>
            debt.id === payload.id ? { ...debt, ...payload } : debt
          )
        );
        return payload;
      } else {
        return updateDebt(payload);
      }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['debts', user?.id] });
        Toast.show({ type: 'success', text1: 'Debt updated' });
        if (isOffline) {
          Toast.show({ type: 'info', text1: 'Your change is saved and will sync when you\'re back online.' });
        }
      },
      onError: (error: Error) => {
        Toast.show({ type: 'error', text1: 'An error occurred', text2: error.message });
      },
  });
};

// 4. Hook to delete a debt
export const deleteDebt = async (debtId: string) => {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('debts').delete().eq('id', debtId);
  if (error) throw new Error(error.message);
  return debtId;
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOffline } = useNetwork();

  return useMutation({
    mutationFn: async (debtId: string) => {
      if (isOffline) {
        await addToQueue({ type: 'DELETE_DEBT', payload: { id: debtId } });

        // Optimistic update
        queryClient.setQueryData(['debts', user?.id], (oldData: Debt[] = []) =>
          oldData.filter(debt => debt.id !== debtId)
        );
        return debtId;
      } else {
        return deleteDebt(debtId);
      }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['debts', user?.id] });
        Toast.show({ type: 'success', text1: 'Debt deleted' });
        if (isOffline) {
          Toast.show({ type: 'info', text1: 'Your change is saved and will sync when you\'re back online.' });
        }
      },
      onError: (error: Error) => {
        Toast.show({ type: 'error', text1: 'An error occurred', text2: error.message });
      },
  });
};
