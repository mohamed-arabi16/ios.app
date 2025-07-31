import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Currency } from './useIncomes';

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
  id: string;
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

const addDebt = async (newDebt: AddDebtPayload, userId: string) => {
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
  return useMutation({
    mutationFn: (newDebt: AddDebtPayload) => {
        if (!user) throw new Error('User not authenticated');
        return addDebt(newDebt, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts', user?.id] });
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

const updateDebt = async (payload: UpdateDebtPayload) => {
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
  return useMutation({
    mutationFn: updateDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts', user?.id] });
    },
  });
};

// 4. Hook to delete a debt
const deleteDebt = async (debtId: string) => {
  const { error } = await supabase.from('debts').delete().eq('id', debtId);
  if (error) throw new Error(error.message);
  return debtId;
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts', user?.id] });
    },
  });
};
