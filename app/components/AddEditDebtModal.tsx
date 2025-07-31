import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert, ActivityIndicator, Platform, Switch } from 'react-native';
import { styled } from 'nativewind';
import { useForm, Controller } from 'react-hook-form';
import { useAddDebt, useUpdateDebt, Debt } from '../hooks/useDebts';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);

interface Props {
  isVisible: boolean;
  onClose: () => void;
  debtToEdit?: Debt | null;
}

type FormData = Omit<Debt, 'id' | 'user_id' | 'created_at' | 'debt_amount_history'>;

export const AddEditDebtModal = ({ isVisible, onClose, debtToEdit }: Props) => {
  const { control, handleSubmit, reset, setValue, watch } = useForm<FormData>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addDebtMutation = useAddDebt();
  const updateDebtMutation = useUpdateDebt();

  const isEditing = !!debtToEdit;
  const dateValue = watch('due_date');

  useEffect(() => {
    if (isVisible) {
      if (debtToEdit) {
        reset({ ...debtToEdit, amount: Number(debtToEdit.amount) });
      } else {
        reset({
          title: '',
          creditor: '',
          amount: 0,
          currency: 'USD',
          due_date: new Date().toISOString(),
          status: 'pending',
          type: 'short',
        });
      }
    }
  }, [debtToEdit, isVisible, reset]);

  const onSubmit = (data: FormData) => {
    // In edit mode, we don't update the amount here. That's done via Record Payment.
    // The useUpdateDebt hook is designed to handle partial updates.
    const payload = isEditing ? { id: debtToEdit.id, title: data.title, creditor: data.creditor, due_date: data.due_date, type: data.type } : data;
    const mutation = isEditing ? updateDebtMutation : addDebtMutation;

    mutation.mutate(payload as any, {
      onSuccess: () => onClose(),
      onError: (error) => Alert.alert('Error', error.message),
    });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValue('due_date', selectedDate.toISOString());
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <StyledView className="flex-1 justify-end bg-black/50">
        <StyledView className="bg-white dark:bg-gray-800 p-6 rounded-t-2xl max-h-[90%]">
          <StyledView className="flex-row justify-between items-center mb-6">
            <StyledText className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Debt' : 'Add Debt'}</StyledText>
            <StyledPressable onPress={onClose}><Ionicons name="close" size={24} color="#9CA3AF" /></StyledPressable>
          </StyledView>

          <View>
            <Controller name="title" control={control} rules={{ required: 'Title is required' }} render={({ field: { onChange, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Title (e.g., Car Loan)" value={value} onChangeText={onChange} />} />
            <Controller name="creditor" control={control} rules={{ required: 'Creditor is required' }} render={({ field: { onChange, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Creditor (e.g., Bank)" value={value} onChangeText={onChange} />} />

            {!isEditing && (
              <>
                <Controller name="amount" control={control} rules={{ required: 'Amount is required', valueAsNumber: true, min: { value: 0.01, message: 'Amount must be positive' } }} render={({ field: { onChange, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Initial Amount" value={String(value)} onChangeText={(text) => onChange(parseFloat(text) || 0)} keyboardType="numeric" />} />

                {/* TODO: Implement a proper picker for currency */}
                <StyledView className="flex-row justify-between items-center my-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <StyledText className="text-gray-900 dark:text-white">Currency: USD / TRY</StyledText>
                  <Controller name="currency" control={control} render={({ field: { onChange, value } }) => <Switch value={value === 'TRY'} onValueChange={(isTRY) => onChange(isTRY ? 'TRY' : 'USD')} />} />
                </StyledView>
              </>
            )}

            <StyledView className="flex-row justify-between items-center my-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <StyledText className="text-gray-900 dark:text-white">Type: Long-term</StyledText>
              <Controller name="type" control={control} render={({ field: { onChange, value } }) => <Switch value={value === 'long'} onValueChange={(isLong) => onChange(isLong ? 'long' : 'short')} />} />
            </StyledView>

            <StyledPressable onPress={() => setShowDatePicker(true)} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2">
                <StyledText className="text-gray-900 dark:text-white">Due Date: {dateValue ? new Date(dateValue).toLocaleDateString() : 'Not set'}</StyledText>
            </StyledPressable>
            {showDatePicker && <DateTimePicker value={dateValue ? new Date(dateValue) : new Date()} mode="date" display="default" onChange={onDateChange} />}

            <StyledPressable className="bg-blue-600 rounded-lg p-4 mt-4 flex-row justify-center items-center" onPress={handleSubmit(onSubmit)} disabled={addDebtMutation.isPending || updateDebtMutation.isPending}>
              {addDebtMutation.isPending || updateDebtMutation.isPending ? <ActivityIndicator color="#fff" /> : <StyledText className="text-white text-lg font-bold">{isEditing ? 'Save Changes' : 'Add Debt'}</StyledText>}
            </StyledPressable>
          </View>
        </StyledView>
      </StyledView>
    </Modal>
  );
};
