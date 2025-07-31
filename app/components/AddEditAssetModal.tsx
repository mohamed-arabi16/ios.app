import React, { useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert, ActivityIndicator, Switch } from 'react-native';
import { styled } from 'nativewind';
import { useForm, Controller } from 'react-hook-form';
import { useAddAsset, useUpdateAsset, Asset, AssetType } from '../hooks/useAssets';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);

interface Props {
  isVisible: boolean;
  onClose: () => void;
  assetToEdit?: Asset | null;
}

type FormData = Omit<Asset, 'id' | 'user_id' | 'created_at'>;

export const AddEditAssetModal = ({ isVisible, onClose, assetToEdit }: Props) => {
  const { control, handleSubmit, reset } = useForm<FormData>();

  const addAssetMutation = useAddAsset();
  const updateAssetMutation = useUpdateAsset();

  const isEditing = !!assetToEdit;

  useEffect(() => {
    if (isVisible) {
      if (assetToEdit) {
        reset(assetToEdit);
      } else {
        reset({
          name: '',
          type: 'crypto',
          amount: 0,
        });
      }
    }
  }, [assetToEdit, isVisible, reset]);

  const onSubmit = (data: FormData) => {
    const payload = isEditing ? { ...data, id: assetToEdit.id } : data;
    const mutation = isEditing ? updateAssetMutation : addAssetMutation;

    mutation.mutate(payload as any, {
      onSuccess: () => onClose(),
      onError: (error) => Alert.alert('Error', error.message),
    });
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <StyledView className="flex-1 justify-end bg-black/50">
        <StyledView className="bg-white dark:bg-gray-800 p-6 rounded-t-2xl">
          <StyledView className="flex-row justify-between items-center mb-6">
            <StyledText className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Asset' : 'Add Asset'}</StyledText>
            <StyledPressable onPress={onClose}><Ionicons name="close" size={24} color="#9CA3AF" /></StyledPressable>
          </StyledView>

          <View>
            <Controller name="name" control={control} rules={{ required: 'Name is required' }} render={({ field: { onChange, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Asset Name (e.g., Bitcoin)" value={value} onChangeText={onChange} />} />
            <Controller name="amount" control={control} rules={{ required: 'Amount is required', valueAsNumber: true, min: { value: 0.00001, message: 'Amount must be positive' } }} render={({ field: { onChange, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Amount" value={String(value)} onChangeText={(text) => onChange(parseFloat(text) || 0)} keyboardType="numeric" />} />

            {/* TODO: Implement a proper picker for asset type */}
            <StyledView className="flex-row justify-between items-center my-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <StyledText className="text-gray-900 dark:text-white">Type: Crypto / Gold</StyledText>
              <Controller name="type" control={control} render={({ field: { onChange, value } }) => <Switch value={value === 'crypto'} onValueChange={(isCrypto) => onChange(isCrypto ? 'crypto' : 'gold')} />} />
            </StyledView>

            <StyledPressable className="bg-blue-600 rounded-lg p-4 mt-4 flex-row justify-center items-center" onPress={handleSubmit(onSubmit)} disabled={addAssetMutation.isPending || updateAssetMutation.isPending}>
              {addAssetMutation.isPending || updateAssetMutation.isPending ? <ActivityIndicator color="#fff" /> : <StyledText className="text-white text-lg font-bold">{isEditing ? 'Save Changes' : 'Add Asset'}</StyledText>}
            </StyledPressable>
          </View>
        </StyledView>
      </StyledView>
    </Modal>
  );
};
