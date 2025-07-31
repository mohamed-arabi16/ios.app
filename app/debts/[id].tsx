import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { styled } from 'nativewind';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useDebts, DebtAmountHistory } from '../hooks/useDebts';
import { Ionicons } from '@expo/vector-icons';
import { RecordPaymentModal } from '../components/RecordPaymentModal';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

const HistoryListItem = ({ item }: { item: DebtAmountHistory }) => (
    <StyledView className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-3 flex-row justify-between items-center">
        <StyledView>
            <StyledText className="text-gray-500 dark:text-gray-400">{new Date(item.logged_at).toLocaleString()}</StyledText>
            <StyledText className="text-gray-800 dark:text-gray-200 text-base">{item.note || 'Update'}</StyledText>
        </StyledView>
        <StyledText className="text-lg font-bold text-gray-900 dark:text-white">${item.amount.toFixed(2)}</StyledText>
    </StyledView>
);

export default function DebtDetailScreen() {
    const { id } = useLocalSearchParams();
    const { data: debts, isLoading, isError } = useDebts();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const debt = useMemo(() => {
        if (!id || typeof id !== 'string') return null;
        return debts?.find(d => d.id === id);
    }, [debts, id]);

    if (isLoading) {
        return <StyledView className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></StyledView>;
    }

    if (isError || !debt) {
        return <StyledView className="flex-1 justify-center items-center"><StyledText className="text-red-500">Error: Debt not found.</StyledText></StyledView>;
    }

    return (
        <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
            <Stack.Screen options={{ title: debt.title, headerBackTitle: 'Debts' }} />

            <StyledView className="p-6 bg-white dark:bg-gray-800 shadow-md">
                <StyledText className="text-xl text-gray-600 dark:text-gray-400">{debt.creditor}</StyledText>
                <StyledText className="text-5xl font-bold text-gray-900 dark:text-white mt-2">${debt.amount.toFixed(2)}</StyledText>
                <StyledText className="text-lg text-gray-500 dark:text-gray-300">Remaining</StyledText>
            </StyledView>

            <FlatList
                data={[...debt.debt_amount_history].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <HistoryListItem item={item} />}
                contentContainerStyle={{ padding: 16 }}
                ListHeaderComponent={() => <StyledText className="text-2xl font-bold text-gray-900 dark:text-white mb-4">History</StyledText>}
                ListEmptyComponent={() => <StyledView className="flex-1 justify-center items-center mt-10"><StyledText className="text-lg text-gray-500">No payment history found.</StyledText></StyledView>}
            />

            <StyledView className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                 <StyledPressable onPress={() => setIsModalVisible(true)} className="bg-blue-600 rounded-lg p-4 flex-row justify-center items-center">
                    <Ionicons name="card-outline" size={20} color="white" />
                    <StyledText className="text-white text-lg font-bold ml-2">Record Payment</StyledText>
                </StyledPressable>
            </StyledView>

            <RecordPaymentModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                debtId={debt.id}
            />
        </StyledView>
    );
}
