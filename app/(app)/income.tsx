import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useIncomes, useDeleteIncome, Income } from '../hooks/useIncomes';
import { Ionicons } from '@expo/vector-icons';
import { AddEditIncomeModal } from '../components/AddEditIncomeModal';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

// The list item component now includes Edit and Delete buttons
const IncomeListItem = ({ item, onEdit, onDelete }: { item: Income, onEdit: (income: Income) => void, onDelete: (incomeId: string) => void }) => (
  <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm">
    <StyledView className="flex-row justify-between items-start">
      <StyledView className="flex-1">
        <StyledText className="text-lg font-bold text-gray-900 dark:text-white w-5/6">{item.title}</StyledText>
        <StyledText className="text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</StyledText>
        <StyledText className={`text-sm font-semibold capitalize ${item.status === 'received' ? 'text-green-500' : 'text-yellow-500'}`}>{item.status}</StyledText>
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

export default function IncomeScreen() {
  const { data: incomes, isLoading, isError } = useIncomes();
  const deleteIncomeMutation = useDeleteIncome();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  const handleOpenAddModal = () => {
    setSelectedIncome(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (income: Income) => {
    setSelectedIncome(income);
    setIsModalVisible(true);
  };

  const handleDelete = (incomeId: string) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteIncomeMutation.mutate(incomeId)
        },
      ]
    );
  };

  if (isLoading) {
    return <StyledView className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900"><ActivityIndicator size="large" /></StyledView>;
  }

  if (isError) {
    return <StyledView className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900"><StyledText className="text-red-500">Error fetching incomes.</StyledText></StyledView>;
  }

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        data={incomes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IncomeListItem
            item={item}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => <StyledText className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Income</StyledText>}
        ListEmptyComponent={() => (
            <StyledView className="flex-1 justify-center items-center mt-20">
                <StyledText className="text-lg text-gray-500">No income records found.</StyledText>
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

      <AddEditIncomeModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        incomeToEdit={selectedIncome}
      />
    </StyledView>
  );
}
