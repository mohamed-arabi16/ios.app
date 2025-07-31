import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Replicating the type definition from the web app for consistency
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'TRY';

export interface Income {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: Currency;
  category: string;
  status: 'expected' | 'received';
  date: string;
  created_at?: string;
}

// 1. Hook to fetch all incomes
const fetchIncomes = async (userId: string) => {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Income[];
};

export const useIncomes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['incomes', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return fetchIncomes(user.id);
    },
    enabled: !!user,
  });
};

// 2. Hook to add a new income
// The form will pass a subset of the Income type
type AddIncomePayload = Omit<Income, 'id' | 'user_id' | 'created_at'>;

const addIncome = async (newIncome: AddIncomePayload, userId: string) => {
  const { data: incomeData, error: insertError } = await supabase
    .from('incomes')
    .insert([{ ...newIncome, user_id: userId }])
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  // The web app calls an RPC here. Replicating that logic.
  // This assumes the RPC 'update_income_amount' exists and works similarly for incomes.
  // The web app code shows this RPC for both debts and incomes.
  const { error: rpcError } = await supabase.rpc('update_income_amount', {
    in_income_id: incomeData.id,
    in_new_amount: incomeData.amount,
    in_note: 'Initial amount',
  });

  if (rpcError) {
    // If RPC fails, the income is created but history might be missing.
    // For now, log the error, as in the web app.
    console.error('Failed to create initial income history:', rpcError.message);
  }

  return incomeData as Income;
};

export const useAddIncome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (newIncome: AddIncomePayload) => {
        if (!user) throw new Error('User not authenticated');
        return addIncome(newIncome, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes', user?.id] });
    },
  });
};

// 3. Hook to update an existing income
type UpdateIncomePayload = Partial<Income> & { id: string };

const updateIncome = async (updatedIncome: UpdateIncomePayload) => {
  const { id, ...updateData } = updatedIncome;
  const { data, error } = await supabase
    .from('incomes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Income;
};

export const useUpdateIncome = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: updateIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incomes', user?.id] });
        },
    });
};

// 4. Hook to delete an income
const deleteIncome = async (incomeId: string) => {
  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', incomeId);

  if (error) throw new Error(error.message);
  return incomeId;
};

export const useDeleteIncome = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: deleteIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incomes', user?.id] });
        },
    });
};
