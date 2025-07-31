import React, { useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { useForm, Controller } from 'react-hook-form';
import { useAddAsset, useUpdateAsset, Asset, AssetType } from '../hooks/useAssets';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetSchema, AssetFormData } from '../lib/schemas';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);

interface Props {
  isVisible: boolean;
  onClose: () => void;
  assetToEdit?: Asset | null;
}

const assetTypes: AssetType[] = ['crypto', 'gold', 'silver'];

export const AddEditAssetModal = ({ isVisible, onClose, assetToEdit }: Props) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      type: 'crypto',
      amount: 0,
    },
  });

  const addAssetMutation = useAddAsset();
  const updateAssetMutation = useUpdateAsset();

  const isEditing = !!assetToEdit;

  useEffect(() => {
    if (isVisible) {
      if (assetToEdit) {
        reset(assetToEdit);
      } else {
        reset();
      }
    }
  }, [assetToEdit, isVisible, reset]);

  const onSubmit = (data: AssetFormData) => {
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

          <ScrollView>
            <Controller name="name" control={control} render={({ field: { onChange, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Asset Name (e.g., Bitcoin)" value={value} onChangeText={onChange} />} />
            {errors.name && <StyledText className="text-red-500 mb-2">{errors.name.message}</StyledText>}
            <Controller name="amount" control={control} render={({ field: { onChange, value } }) => <StyledTextInput className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2 text-gray-900 dark:text-white" placeholder="Amount" value={String(value)} onChangeText={(text) => onChange(parseFloat(text) || 0)} keyboardType="numeric" />} />
            {errors.amount && <StyledText className="text-red-500 mb-2">{errors.amount.message}</StyledText>}

            <Controller name="type" control={control} render={({ field: { onChange, value } }) => (
                <View>
                <StyledText className="text-gray-900 dark:text-white mb-2">Type</StyledText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    {assetTypes.map(t => (
                    <StyledPressable key={t} onPress={() => onChange(t)} className={`p-3 rounded-lg mr-2 ${value === t ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <StyledText className={`capitalize ${value === t ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{t}</StyledText>
                    </StyledPressable>
                    ))}
                </ScrollView>
                </View>
            )} />
            {errors.type && <StyledText className="text-red-500 mb-2">{errors.type.message}</StyledText>}

            <StyledPressable className="bg-blue-600 rounded-lg p-4 mt-4 flex-row justify-center items-center" onPress={handleSubmit(onSubmit)} disabled={addAssetMutation.isPending || updateAssetMutation.isPending}>
              {addAssetMutation.isPending || updateAssetMutation.isPending ? <ActivityIndicator color="#fff" /> : <StyledText className="text-white text-lg font-bold">{isEditing ? 'Save Changes' : 'Add Asset'}</StyledText>}
            </StyledPressable>
          </ScrollView>
        </StyledView>
      </StyledView>
    </Modal>
  );
};
