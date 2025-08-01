import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert, useWindowDimensions, StyleSheet , GestureResponderEvent } from 'react-native';
import { useDebts, useDeleteDebt, Debt } from '../hooks/useDebts';
import { Ionicons } from '@expo/vector-icons';
import { AddEditDebtModal } from '../components/AddEditDebtModal';
import { TabView, SceneMap, TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { useRouter } from 'expo-router';

const DebtListItem = ({ item, onEdit, onDelete, onSelect }: { item: Debt, onEdit: (debt: Debt) => void, onDelete: (debtId: string) => void, onSelect: (debtId: string) => void }) => (
  <Pressable onPress={() => onSelect(item.id)} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm">
    <View className="flex-row justify-between items-start">
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-white w-5/6">{item.title}</Text>
        <Text className="text-gray-600 dark:text-gray-400">Creditor: {item.creditor}</Text>
        <Text className={`text-sm font-semibold capitalize ${item.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>{item.status}</Text>
      </View>
      <Text className="text-xl font-bold text-gray-900 dark:text-white">${item.amount.toFixed(2)}</Text>
    </View>
    <View className="flex-row justify-end mt-2">
      <Pressable onPress={(e: GestureResponderEvent) => { e.stopPropagation(); onEdit(item); }} className="p-2"><Ionicons name="pencil-outline" size={22} color="#3b82f6" /></Pressable>
      <Pressable onPress={(e: GestureResponderEvent) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 ml-2"><Ionicons name="trash-outline" size={22} color="#ef4444" /></Pressable>
    </View>
  </Pressable>
);

const DebtListScene = ({ debts, onEdit, onDelete, onSelect }: { debts: Debt[], onEdit: any, onDelete: any, onSelect: any }) => (
  <FlatList
    data={debts}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <DebtListItem item={item} onEdit={onEdit} onDelete={onDelete} onSelect={onSelect} />}
    contentContainerStyle={{ padding: 16 }}
    ListEmptyComponent={() => <View className="flex-1 justify-center items-center mt-20"><Text className="text-lg text-gray-500">No debts found in this category.</Text></View>}
  />
);

export default function DebtScreen() {
  const { data: debtsData, isLoading, isError, refetch } = useDebts();
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
    const short = debtsData?.filter(d => d.type === 'short') ?? [];
    const long = debtsData?.filter(d => d.type === 'long') ?? [];
    return { shortTermDebts: short, longTermDebts: long };
  }, [debtsData]);

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
  if (isLoading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;
  if (isError) return (
    <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-lg text-center mb-4">An error occurred while fetching your debts.</Text>
        <Pressable onPress={() => refetch()} className="bg-blue-600 rounded-lg p-3">
            <Text className="text-white font-bold">Try Again</Text>
        </Pressable>
    </View>
  );

  const renderScene = SceneMap({
    short: () => <DebtListScene debts={shortTermDebts} onEdit={handleOpenEditModal} onDelete={handleDelete} onSelect={handleSelectDebt} />,
    long: () => <DebtListScene debts={longTermDebts} onEdit={handleOpenEditModal} onDelete={handleDelete} onSelect={handleSelectDebt} />,
  });

  const renderTabBar = (props: SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string; }> }) => (
    <TabBar
        {...props}
        style={{backgroundColor: '#f9fafb'}}
        indicatorStyle={{backgroundColor: '#3b82f6'}}
        tabStyle={{ width: 'auto' }}
    />
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white p-4 pb-0">Debts</Text>
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={renderTabBar}
        />
        <Pressable onPress={handleOpenAddModal} className="absolute bottom-8 right-8 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg"><Ionicons name="add" size={32} color="white" /></Pressable>
        <AddEditDebtModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} debtToEdit={selectedDebt} />
    </View>
  );
}
