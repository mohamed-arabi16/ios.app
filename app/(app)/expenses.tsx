import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useExpenses, useDeleteExpense, Expense } from '../hooks/useExpenses';
import { Ionicons } from '@expo/vector-icons';
import { AddEditExpenseModal } from '../components/AddEditExpenseModal';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

const ExpenseListItem = ({ item, onEdit, onDelete }: { item: Expense, onEdit: (expense: Expense) => void, onDelete: (expenseId: string) => void }) => (
  <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm">
    <StyledView className="flex-row justify-between items-start">
      <StyledView className="flex-1">
        <StyledText className="text-lg font-bold text-gray-900 dark:text-white w-5/6">{item.title}</StyledText>
        <StyledText className="text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</StyledText>
        <StyledText className={`text-sm font-semibold capitalize ${item.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>{item.status}</StyledText>
      </StyledView>
      <StyledText className="text-xl font-bold text-gray-900 dark:text-white">${item.amount.toFixed(2)}</StyledText>
    </StyledView>
    <StyledView className="flex-row justify-end mt-2">
      <StyledPressable onPress={() => onEdit(item)} className="p-2">
        <Ionicons name="pencil-outline" size={22} color="#3b82f6" />
      </StyledPressable>
      <StyledPressable onPress={() => onDelete(item.id)} className="p-2 ml-2">
        <Ionicons name="trash-outline" size={22} color="#ef4444" />
      </StyledPressable>
    </StyledView>
  </StyledView>
);

export default function ExpenseScreen() {
  const { data: expenses, isLoading, isError } = useExpenses();
  const deleteExpenseMutation = useDeleteExpense();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const handleOpenAddModal = () => {
    setSelectedExpense(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalVisible(true);
  };

  const handleDelete = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpenseMutation.mutate(expenseId)
        },
      ]
    );
  };

  if (isLoading) {
    return <StyledView className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900"><ActivityIndicator size="large" /></StyledView>;
  }

  if (isError) {
    return <StyledView className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900"><StyledText className="text-red-500">Error fetching expenses.</StyledText></StyledView>;
  }

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseListItem
            item={item}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => <StyledText className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Expenses</StyledText>}
        ListEmptyComponent={() => (
            <StyledView className="flex-1 justify-center items-center mt-20">
                <StyledText className="text-lg text-gray-500">No expense records found.</StyledText>
                <StyledText className="text-sm text-gray-400 mt-2">Press the '+' button to add one.</StyledText>
            </StyledView>
        )}
      />
      <StyledPressable
        className="absolute bottom-8 right-8 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg"
        onPress={handleOpenAddModal}
      >
        <Ionicons name="add" size={32} color="white" />
      </StyledPressable>

      <AddEditExpenseModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        expenseToEdit={selectedExpense}
      />
    </StyledView>
  );
}
