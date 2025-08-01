import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useDebts, DebtAmountHistory } from '~/hooks/useDebts';
import { Ionicons } from '@expo/vector-icons';
import { RecordPaymentModal } from '~/components/RecordPaymentModal';

const HistoryListItem = ({ item, change }: { item: DebtAmountHistory, change: number }) => {
    const isIncrease = change > 0;
    const isDecrease = change < 0;
    const colorClass = isIncrease ? 'text-red-500' : isDecrease ? 'text-green-500' : 'text-gray-500';

    return (
        <View className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-3 flex-row justify-between items-center">
            <View>
                <Text className="text-gray-500 dark:text-gray-400">{new Date(item.logged_at).toLocaleString()}</Text>
                <Text className="text-gray-800 dark:text-gray-200 text-base">{item.note || 'Update'}</Text>
            </View>
            <View className="items-end">
                <Text className={`text-lg font-bold ${colorClass}`}>
                    {isIncrease ? '+' : ''}{change.toFixed(2)}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Total: ${item.amount.toFixed(2)}
                </Text>
            </View>
        </View>
    );
};

export default function DebtDetailScreen() {
    const { id } = useLocalSearchParams();
    const { data: debts, isLoading, isError } = useDebts();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const debt = useMemo(() => {
        if (!id || typeof id !== 'string') return null;
        return debts?.find(d => d.id === id);
    }, [debts, id]);

    const processedHistory = useMemo(() => {
        if (!debt) return [];
        const sortedHistory = [...debt.debt_amount_history].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

        let lastAmount = 0;
        const historyWithChanges = sortedHistory.map(item => {
            const change = item.amount - lastAmount;
            lastAmount = item.amount;
            return { ...item, change };
        });

        return historyWithChanges.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
    }, [debt]);

    if (isLoading) {
        return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;
    }

    if (isError || !debt) {
        return <View className="flex-1 justify-center items-center"><Text className="text-red-500">Error: Debt not found.</Text></View>;
    }

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{ title: debt.title, headerBackTitle: 'Debts' }} />

            <View className="p-6 bg-white dark:bg-gray-800 shadow-md">
                <Text className="text-xl text-gray-600 dark:text-gray-400">{debt.creditor}</Text>
                <Text className="text-5xl font-bold text-gray-900 dark:text-white mt-2">${debt.amount.toFixed(2)}</Text>
                <Text className="text-lg text-gray-500 dark:text-gray-300">Remaining</Text>
            </View>

            <FlatList
                data={processedHistory}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <HistoryListItem item={item} change={item.change} />}
                contentContainerStyle={{ padding: 16 }}
                ListHeaderComponent={() => <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">History</Text>}
                ListEmptyComponent={() => <View className="flex-1 justify-center items-center mt-10"><Text className="text-lg text-gray-500">No payment history found.</Text></View>}
            />

            <View className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                 <Pressable onPress={() => setIsModalVisible(true)} className="bg-blue-600 rounded-lg p-4 flex-row justify-center items-center">
                    <Ionicons name="card-outline" size={20} color="white" />
                    <Text className="text-white text-lg font-bold ml-2">Record Payment</Text>
                </Pressable>
            </View>

            <RecordPaymentModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                debtId={debt.id}
            />
        </View>
    );
}
