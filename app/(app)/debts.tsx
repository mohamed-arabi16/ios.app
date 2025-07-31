import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert, useWindowDimensions } from 'react-native';
import { styled } from 'nativewind';
import { useDebts, useDeleteDebt, Debt } from '../hooks/useDebts';
import { Ionicons } from '@expo/vector-icons';
import { AddEditDebtModal } from '../components/AddEditDebtModal';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useRouter } from 'expo-router';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

const DebtListItem = ({ item, onEdit, onDelete, onSelect }: { item: Debt, onEdit: (debt: Debt) => void, onDelete: (debtId: string) => void, onSelect: (debtId: string) => void }) => (
  <StyledPressable onPress={() => onSelect(item.id)} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm">
    <StyledView className="flex-row justify-between items-start">
      <StyledView className="flex-1">
        <StyledText className="text-lg font-bold text-gray-900 dark:text-white w-5/6">{item.title}</StyledText>
        <StyledText className="text-gray-600 dark:text-gray-400">Creditor: {item.creditor}</StyledText>
        <StyledText className={`text-sm font-semibold capitalize ${item.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>{item.status}</StyledText>
      </StyledView>
      <StyledText className="text-xl font-bold text-gray-900 dark:text-white">${item.amount.toFixed(2)}</StyledText>
    </StyledView>
    <StyledView className="flex-row justify-end mt-2">
      <StyledPressable onPress={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2"><Ionicons name="pencil-outline" size={22} color="#3b82f6" /></StyledPressable>
      <StyledPressable onPress={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 ml-2"><Ionicons name="trash-outline" size={22} color="#ef4444" /></StyledPressable>
    </StyledView>
  </StyledPressable>
);

const DebtListScene = ({ debts, onEdit, onDelete, onSelect }: { debts: Debt[], onEdit: any, onDelete: any, onSelect: any }) => (
  <FlatList
    data={debts}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <DebtListItem item={item} onEdit={onEdit} onDelete={onDelete} onSelect={onSelect} />}
    contentContainerStyle={{ padding: 16 }}
    ListEmptyComponent={() => <StyledView className="flex-1 justify-center items-center mt-20"><StyledText className="text-lg text-gray-500">No debts found in this category.</StyledText></StyledView>}
  />
);

export default function DebtScreen() {
  const { data: debts, isLoading, isError } = useDebts();
  const deleteDebtMutation = useDeleteDebt();
  const layout = useWindowDimensions();
  const router = useRouter();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'short', title: 'Short-term' },
    { key: 'long', title: 'Long-term' },
  ]);

  const { shortTermDebts, longTermDebts } = useMemo(() => {
    const short = debts?.filter(d => d.type === 'short') ?? [];
    const long = debts?.filter(d => d.type === 'long') ?? [];
    return { shortTermDebts: short, longTermDebts: long };
  }, [debts]);

  const handleOpenAddModal = () => {
    setSelectedDebt(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsModalVisible(true);
  };

  const handleDelete = (debtId: string) => {
    Alert.alert('Delete Debt', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteDebtMutation.mutate(debtId) }]);
  };

  const handleSelectDebt = (debtId: string) => {
      router.push(`/debts/${debtId}`);
  };

  if (isLoading) return <StyledView className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></StyledView>;
  if (isError) return <StyledView className="flex-1 justify-center items-center"><StyledText className="text-red-500">Error fetching debts.</StyledText></StyledView>;

  const renderScene = SceneMap({
    short: () => <DebtListScene debts={shortTermDebts} onEdit={handleOpenEditModal} onDelete={handleDelete} onSelect={handleSelectDebt} />,
    long: () => <DebtListScene debts={longTermDebts} onEdit={handleOpenEditModal} onDelete={handleDelete} onSelect={handleSelectDebt} />,
  });

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <StyledText className="text-3xl font-bold text-gray-900 dark:text-white p-4 pb-0">Debts</StyledText>
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={props => <TabBar {...props} style={{backgroundColor: '#f9fafb'}} indicatorStyle={{backgroundColor: '#3b82f6'}} labelStyle={{color: '#374151', fontWeight: '600'}} />}
        />
        <StyledPressable onPress={handleOpenAddModal} className="absolute bottom-8 right-8 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg"><Ionicons name="add" size={32} color="white" /></StyledPressable>
        <AddEditDebtModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} debtToEdit={selectedDebt} />
    </StyledView>
  );
}
