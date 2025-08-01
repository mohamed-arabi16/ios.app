import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Currency } from './useIncomes'; // Re-using Currency type

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount: number;
  currency: Currency;
  date: string;
  status: 'paid' | 'pending';
  type: 'fixed' | 'variable';
  created_at?: string;
}

// 1. Hook to fetch all expenses
const fetchExpenses = async (userId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Expense[];
};

export const useExpenses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return fetchExpenses(user.id);
    },
    enabled: !!user,
  });
};

// 2. Hook to add a new expense
type AddExpensePayload = Omit<Expense, 'id' | 'user_id' | 'created_at'>;

const addExpense = async (newExpense: AddExpensePayload, userId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...newExpense, user_id: userId }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (newExpense: AddExpensePayload) => {
      if (!user) throw new Error('User not authenticated');
      return addExpense(newExpense, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
    },
  });
};

// 3. Hook to update an existing expense
type UpdateExpensePayload = Partial<Expense> & { id: string };

const updateExpense = async (updatedExpense: UpdateExpensePayload) => {
  const { id, ...updateData } = updatedExpense;
  const { data, error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: updateExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
        },
    });
};

// 4. Hook to delete an expense
const deleteExpense = async (expenseId: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) throw new Error(error.message);
  return expenseId;
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
        },
    });
};
