import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert, ActivityIndicator, Platform, Switch } from 'react-native';
import { styled } from 'nativewind';
import { useForm, Controller } from 'react-hook-form';
import { useAddExpense, useUpdateExpense, Expense } from '../hooks/useExpenses';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);

interface Props {
  isVisible: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

type FormData = Omit<Expense, 'id' | 'user_id' | 'created_at'>;

export const AddEditExpenseModal = ({ isVisible, onClose, expenseToEdit }: Props) => {
  const { control, handleSubmit, reset, setValue, watch } = useForm<FormData>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addExpenseMutation = useAddExpense();
  const updateExpenseMutation = useUpdateExpense();

  const isEditing = !!expenseToEdit;
  const dateValue = watch('date');

  useEffect(() => {
    if (isVisible) {
      if (expenseToEdit) {
        reset({ ...expenseToEdit, amount: Number(expenseToEdit.amount) });
      } else {
        reset({
          title: '',
          amount: 0,
          category: '',
          status: 'pending',
          type: 'variable',
          date: new Date().toISOString(),
          currency: 'USD',
        });
      }
    }
  }, [expenseToEdit, isVisible, reset]);

  const onSubmit = (data: FormData) => {
    const mutation = isEditing ? updateExpenseMutation : addExpenseMutation;
    const payload = isEditing ? { ...data, id: expenseToEdit.id } : data;

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
      <StyledView className="flex-1 justify-end bg-black/50">
        <StyledView className="bg-white dark:bg-gray-800 p-6 rounded-t-2xl max-h-[90%]">
          <StyledView className="flex-row justify-between items-center mb-6">
            <StyledText className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Expense' : 'Add Expense'}</StyledText>
            <StyledPressable onPress={onClose}><Ionicons name="close" size={24} color="#9CA3AF" /></StyledPressable>
          </StyledView>

          {/* Form Fields */}
          <View>
            <Controller name="title" control={control} rules={{ required: 'Title is required' }} render={({ field: { onChange, onBlur, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Title (e.g., Groceries)" value={value} onChangeText={onChange} onBlur={onBlur} />} />
            <Controller name="amount" control={control} rules={{ required: 'Amount is required', valueAsNumber: true, min: { value: 0.01, message: 'Amount must be positive' } }} render={({ field: { onChange, onBlur, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Amount" value={String(value)} onChangeText={(text) => onChange(parseFloat(text) || 0)} onBlur={onBlur} keyboardType="numeric" />} />
            <Controller name="category" control={control} render={({ field: { onChange, onBlur, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Category (e.g., Food)" value={value} onChangeText={onChange} onBlur={onBlur} />} />

            <StyledView className="flex-row justify-between items-center my-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <StyledText className="text-gray-900 dark:text-white">Status: Paid</StyledText>
              <Controller name="status" control={control} render={({ field: { onChange, value } }) => <Switch value={value === 'paid'} onValueChange={(isPaid) => onChange(isPaid ? 'paid' : 'pending')} />} />
            </StyledView>

            <StyledView className="flex-row justify-between items-center my-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <StyledText className="text-gray-900 dark:text-white">Type: Fixed</StyledText>
              <Controller name="type" control={control} render={({ field: { onChange, value } }) => <Switch value={value === 'fixed'} onValueChange={(isFixed) => onChange(isFixed ? 'fixed' : 'variable')} />} />
            </StyledView>

            <StyledPressable onPress={() => setShowDatePicker(true)} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2">
                <StyledText className="text-gray-900 dark:text-white">Date: {new Date(dateValue).toLocaleDateString()}</StyledText>
            </StyledPressable>
            {showDatePicker && <DateTimePicker value={new Date(dateValue)} mode="date" display="default" onChange={onDateChange} />}

            <StyledPressable className="bg-blue-600 rounded-lg p-4 mt-4 flex-row justify-center items-center" onPress={handleSubmit(onSubmit)} disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending}>
              {addExpenseMutation.isPending || updateExpenseMutation.isPending ? <ActivityIndicator color="#fff" /> : <StyledText className="text-white text-lg font-bold">{isEditing ? 'Save Changes' : 'Add Expense'}</StyledText>}
            </StyledPressable>
          </View>
        </StyledView>
      </StyledView>
    </Modal>
  );
};
