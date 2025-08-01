import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useIncomes, useDeleteIncome, Income } from '~/hooks/useIncomes';
import { Ionicons } from '@expo/vector-icons';
import { AddEditIncomeModal } from '~/components/AddEditIncomeModal';

// The list item component now includes Edit and Delete buttons
const IncomeListItem = ({ item, onEdit, onDelete }: { item: Income, onEdit: (income: Income) => void, onDelete: (incomeId: string) => void }) => (
  <View className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm">
    <View className="flex-row justify-between items-start">
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-white w-5/6">{item.title}</Text>
        <Text className="text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</Text>
        <Text className={`text-sm font-semibold capitalize ${item.status === 'received' ? 'text-green-500' : 'text-yellow-500'}`}>{item.status}</Text>
      </View>
      <Text className="text-xl font-bold text-gray-900 dark:text-white">${item.amount.toFixed(2)}</Text>
    </View>
    <View className="flex-row justify-end mt-2">
      <Pressable onPress={() => onEdit(item)} className="p-2">
        <Ionicons name="pencil-outline" size={22} color="#3b82f6" />
      </Pressable>
      <Pressable onPress={() => onDelete(item.id)} className="p-2 ml-2">
        <Ionicons name="trash-outline" size={22} color="#ef4444" />
      </Pressable>
    </View>
  </View>
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
    return <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900"><ActivityIndicator size="large" /></View>;
  }

  if (isError) {
    return <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900"><Text className="text-red-500">Error fetching incomes.</Text></View>;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
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
        ListHeaderComponent={() => <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Income</Text>}
        ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
                <Text className="text-lg text-gray-500">No income records found.</Text>
                <Text className="text-sm text-gray-400 mt-2">Press the &apos;+&apos; button to add one.</Text>
            </View>
        )}
      />
      <Pressable
        className="absolute bottom-8 right-8 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg"
        onPress={handleOpenAddModal}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>

      <AddEditIncomeModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        incomeToEdit={selectedIncome}
      />
    </View>
  );
}
