import React, { useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useUpdateDebt, UpdateDebtPayload } from '../hooks/useDebts';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  debtId: string;
}

type FormData = {
    amount: number;
    note: string;
};

export const RecordPaymentModal = ({ isVisible, onClose, debtId }: Props) => {
  const { control, handleSubmit, reset } = useForm<FormData>();
  const updateDebtMutation = useUpdateDebt();

  useEffect(() => {
    if (isVisible) {
      reset({ amount: 0, note: '' });
    }
  }, [isVisible, reset]);

  const onSubmit = (data: FormData) => {
    const payload: UpdateDebtPayload = {
      id: debtId,
      amount: data.amount,
      note: data.note || 'Payment recorded',
    };

    updateDebtMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Success', 'Payment recorded successfully.');
        onClose();
      },
      onError: (error) => {
        Alert.alert('Error', error.message);
      },
    });
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-gray-800 p-6 rounded-t-2xl">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Record Payment</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={24} color="#9CA3AF" /></Pressable>
          </View>

          <View>
            <Controller
              name="amount"
              control={control}
              rules={{ required: 'New amount is required', min: { value: 0, message: 'Amount cannot be negative' } }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white"
                  placeholder="New Remaining Amount"
                  value={String(value)}
                  onChangeText={(text: string) => onChange(parseFloat(text) || 0)}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              name="note"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white"
                  placeholder="Note (e.g., Monthly payment)"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Pressable
              className="bg-blue-600 rounded-lg p-4 mt-4 flex-row justify-center items-center"
              onPress={handleSubmit(onSubmit)}
              disabled={updateDebtMutation.isPending}
            >
              {updateDebtMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Save Payment</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
