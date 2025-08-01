import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useIncomes } from '../hooks/useIncomes';
import { useExpenses } from '../hooks/useExpenses';
import { useDebts } from '../hooks/useDebts';
import { Ionicons } from '@expo/vector-icons';
import { VictoryChart, VictoryLine, VictoryAxis } from 'victory-native';
import { VictoryTheme } from 'victory';

// A simple card component for displaying financial figures
const FinancialCard = ({ title, value, iconName, color = 'text-gray-900 dark:text-white' }: { title: string, value: string, iconName: any, color?: string }) => (
  <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
    <View className="flex-row items-center mb-2">
      <Ionicons name={iconName} size={20} color="#888" />
      <Text className="text-lg font-semibold text-gray-600 dark:text-gray-400 ml-2">{title}</Text>
    </View>
    <Text className={`text-3xl font-bold ${color}`}>{value}</Text>
  </View>
);

export default function Dashboard() {
  const { data: incomes, isLoading: incomesLoading, error: incomesError, refetch: refetchIncomes } = useIncomes();
  const { data: expenses, isLoading: expensesLoading, error: expensesError, refetch: refetchExpenses } = useExpenses();
  const { data: debts, isLoading: debtsLoading, error: debtsError, refetch: refetchDebts } = useDebts();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchIncomes(), refetchExpenses(), refetchDebts()]).then(() => {
      setRefreshing(false);
    });
  }, [refetchIncomes, refetchExpenses, refetchDebts]);

  // Memoized calculations
  const { availableBalance, upcomingIncome, shortTermDebt, cashFlowData } = useMemo(() => {
    const receivedIncomes = incomes?.filter(i => i.status === 'received').reduce((sum, i) => sum + i.amount, 0) ?? 0;
    const paidExpenses = expenses?.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0) ?? 0;

    const balance = receivedIncomes - paidExpenses;

    const upcoming = incomes?.filter(i => i.status === 'expected' && new Date(i.date) > new Date()).reduce((sum, i) => sum + i.amount, 0) ?? 0;

    const debt = debts?.filter(d => d.type === 'short' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0) ?? 0;

    // Calculate cash flow for the last 6 months
    const now = new Date();
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    incomes?.forEach(income => {
      const d = new Date(income.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyData[monthKey] && income.status === 'received') {
        monthlyData[monthKey].income += income.amount;
      }
    });

    expenses?.forEach(expense => {
      const d = new Date(expense.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyData[monthKey] && expense.status === 'paid') {
        monthlyData[monthKey].expense += expense.amount;
      }
    });

    const flowData = Object.keys(monthlyData).map((key, index) => {
      const [year, month] = key.split('-');
      const monthLabel = new Date(Number(year), Number(month)).toLocaleString('default', { month: 'short' });
      return {
        x: monthLabel,
        y: monthlyData[key].income - monthlyData[key].expense,
      };
    });

    return {
      availableBalance: balance,
      upcomingIncome: upcoming,
      shortTermDebt: debt,
      cashFlowData: flowData,
    };
  }, [incomes, expenses, debts]);

  const isLoading = incomesLoading || expensesLoading || debtsLoading;
  const isError = incomesError || expensesError || debtsError;

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading your financial data...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
        <Text className="text-lg text-red-500 text-center">There was an error fetching your data. Please try again.</Text>
      </View>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-6 space-y-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</Text>

        <FinancialCard
          title="Available Balance"
          value={formatCurrency(availableBalance)}
          iconName="wallet-outline"
          color={availableBalance >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        <FinancialCard
          title="Upcoming Income (30 days)"
          value={formatCurrency(upcomingIncome)}
          iconName="trending-up-outline"
        />
        <FinancialCard
          title="Short-term Debt"
          value={formatCurrency(shortTermDebt)}
          iconName="alert-circle-outline"
          color="text-orange-500"
        />

        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mt-4">
          <Text className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Monthly Cash Flow</Text>
          <VictoryChart theme={VictoryTheme.material} height={250}>
            <VictoryAxis
              style={{
                axis: { stroke: 'none' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                grid: { stroke: '#E5E7EB', strokeDasharray: '0' },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t: number) => `$${t/1000}k`}
              style={{
                axis: { stroke: 'none' },
                tickLabels: { fill: '#9CA3AF', fontSize: 10 },
                grid: { stroke: '#E5E7EB', strokeDasharray: '4' },
              }}
            />
            <VictoryLine
              data={cashFlowData}
              style={{
                data: { stroke: '#3b82f6', strokeWidth: 3 },
              }}
              interpolation="monotoneX"
            />
          </VictoryChart>
        </View>
      </View>
    </ScrollView>
  );
}
