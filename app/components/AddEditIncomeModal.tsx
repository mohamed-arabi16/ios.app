import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert, ActivityIndicator, Platform, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAddIncome, useUpdateIncome, Income, Currency } from '../hooks/useIncomes';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  incomeToEdit?: Income | null;
}

type FormData = Omit<Income, 'id' | 'user_id' | 'created_at'>;

export const AddEditIncomeModal = ({ isVisible, onClose, incomeToEdit }: Props) => {
  const { control, handleSubmit, reset, setValue, watch } = useForm<FormData>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addIncomeMutation = useAddIncome();
  const updateIncomeMutation = useUpdateIncome();

  const isEditing = !!incomeToEdit;
  const dateValue = watch('date');

  useEffect(() => {
    if (isVisible) {
        if (incomeToEdit) {
            reset({
                ...incomeToEdit,
                amount: Number(incomeToEdit.amount)
            });
        } else {
            reset({
                title: '',
                amount: 0,
                category: '',
                status: 'expected',
                date: new Date().toISOString(),
                currency: 'USD',
            });
        }
    }
  }, [incomeToEdit, isVisible, reset]);

  const onSubmit = (data: FormData) => {
    const mutation = isEditing ? updateIncomeMutation : addIncomeMutation;
    const payload = isEditing ? { ...data, id: incomeToEdit.id } : data;

    mutation.mutate(payload as any, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        Alert.alert('Error', error.message);
      },
    });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValue('date', selectedDate.toISOString());
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-gray-800 p-6 rounded-t-2xl max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Income' : 'Add Income'}</Text>
                <Pressable onPress={onClose}><Ionicons name="close" size={24} color="#9CA3AF" /></Pressable>
            </View>

            <View>
                <Controller name="title" control={control} rules={{ required: 'Title is required' }} render={({ field: { onChange, onBlur, value } }) => <TextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Title (e.g., Project A)" value={value} onChangeText={onChange} onBlur={onBlur} />} />
                {/* Other fields */}
                <Controller name="amount" control={control} rules={{ required: 'Amount is required', min: { value: 0.01, message: 'Amount must be positive' } }} render={({ field: { onChange, onBlur, value } }) => <TextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Amount" value={String(value)} onChangeText={(text: string) => onChange(parseFloat(text) || 0)} onBlur={onBlur} keyboardType="numeric" />} />
                <Controller name="category" control={control} render={({ field: { onChange, onBlur, value } }) => <TextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Category (e.g., Freelance)" value={value} onChangeText={onChange} onBlur={onBlur} />} />

                <View className="flex-row justify-between items-center my-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Text className="text-gray-900 dark:text-white">Status: Received</Text>
                    <Controller name="status" control={control} render={({ field: { onChange, value } }) => <Switch value={value === 'received'} onValueChange={(isReceived) => onChange(isReceived ? 'received' : 'expected')} />} />
                </View>

                <Pressable onPress={() => setShowDatePicker(true)} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2">
                    <Text className="text-gray-900 dark:text-white">Date: {new Date(dateValue).toLocaleDateString()}</Text>
                </Pressable>
                {showDatePicker && <DateTimePicker value={new Date(dateValue)} mode="date" display="default" onChange={onDateChange} />}

                <Controller name="currency" control={control} rules={{ required: 'Currency is required' }} render={({ field: { onChange, onBlur, value } }) => <TextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Currency (e.g., USD)" value={value} onChangeText={onChange} onBlur={onBlur} />} />

                <Pressable className="bg-blue-600 rounded-lg p-4 mt-4 flex-row justify-center items-center" onPress={handleSubmit(onSubmit)} disabled={addIncomeMutation.isPending || updateIncomeMutation.isPending}>
                    {addIncomeMutation.isPending || updateIncomeMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">{isEditing ? 'Save Changes' : 'Add Income'}</Text>}
                </Pressable>
            </View>
        </View>
      </View>
    </Modal>
  );
};
