import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useAssets, useDeleteAsset, Asset } from '../hooks/useAssets';
import { Ionicons } from '@expo/vector-icons';
import { AddEditAssetModal } from '../components/AddEditAssetModal';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useAssetPrices } from '../hooks/useAssetPrices';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

const AssetListItem = ({ item, price, onEdit, onDelete }: { item: Asset, price: number | undefined, onEdit: (asset: Asset) => void, onDelete: (assetId: string) => void }) => {
    const value = price ? item.amount * price : null;
    return (
      <StyledView className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm">
        <StyledView className="flex-row justify-between items-start">
          <StyledView className="flex-1">
            <StyledText className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</StyledText>
            <StyledText className="text-gray-600 dark:text-gray-400">Amount: {item.amount}</StyledText>
            {price && <StyledText className="text-sm text-gray-500">@ ${price.toFixed(2)}</StyledText>}
          </StyledView>
          <StyledView className="items-end">
            {value ? <StyledText className="text-xl font-bold text-gray-900 dark:text-white">${value.toFixed(2)}</StyledText> : <ActivityIndicator size="small" />}
          </StyledView>
        </StyledView>
        <StyledView className="flex-row justify-end mt-2">
          <StyledPressable onPress={() => onEdit(item)} className="p-2"><Ionicons name="pencil-outline" size={22} color="#3b82f6" /></StyledPressable>
          <StyledPressable onPress={() => onDelete(item.id)} className="p-2 ml-2"><Ionicons name="trash-outline" size={22} color="#ef4444" /></StyledPressable>
        </StyledView>
      </StyledView>
    );
};

export default function AssetsScreen() {
  const { data: assets = [], isLoading, isError, refetch, isRefetching } = useAssets();
  const { data: prices, isLoading: pricesLoading } = useAssetPrices(assets);
  const deleteAssetMutation = useDeleteAsset();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const handleOpenAddModal = () => {
    setSelectedAsset(null);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalVisible(true);
  };

  const handleDelete = (assetId: string) => {
    Alert.alert('Delete Asset', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteAssetMutation.mutate(assetId) }]);
  };

  const onRefresh = async () => {
    // Invalidate the price query first, then refetch assets
    await queryClient.invalidateQueries({ queryKey: ['assetPrices'] });
    await refetch();
  };

  const totalValue = useMemo(() => {
      if (!assets || !prices) return 0;
      return assets.reduce((sum, asset) => {
          const price = prices[asset.id];
          return sum + (price ? asset.amount * price : 0);
      }, 0);
  }, [assets, prices]);


  if (isLoading) return <StyledView className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></StyledView>;
  if (isError) return <StyledView className="flex-1 justify-center items-center"><StyledText className="text-red-500">Error fetching assets.</StyledText></StyledView>;

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <StyledView className="p-4 pb-2">
            <StyledText className="text-3xl font-bold text-gray-900 dark:text-white">Assets</StyledText>
            <StyledText className="text-xl font-semibold text-gray-700 dark:text-gray-300">Total Value: ${totalValue.toFixed(2)}</StyledText>
        </StyledView>
        <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AssetListItem item={item} price={prices?.[item.id]} onEdit={handleOpenEditModal} onDelete={handleDelete} />}
            contentContainerStyle={{ padding: 16 }}
            onRefresh={onRefresh}
            refreshing={isRefetching || pricesLoading}
            ListEmptyComponent={() => <StyledView className="flex-1 justify-center items-center mt-20"><StyledText className="text-lg text-gray-500">No assets found. Add one to get started.</StyledText></StyledView>}
        />
        <StyledPressable onPress={handleOpenAddModal} className="absolute bottom-8 right-8 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg"><Ionicons name="add" size={32} color="white" /></StyledPressable>
        <AddEditAssetModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} assetToEdit={selectedAsset} />
    </StyledView>
  );
}
