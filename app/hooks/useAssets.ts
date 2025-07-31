import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from './useNetwork';
import { addToQueue } from '../lib/offlineQueue';
import uuid from 'react-native-uuid';

export type AssetType = 'gold' | 'silver' | 'crypto';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  amount: number;
  created_at?: string;
}

// 1. Hook to fetch all assets
const fetchAssets = async (userId: string) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Asset[];
};

export const useAssets = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assets', user?.id],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return fetchAssets(user.id);
    },
    enabled: !!user,
  });
};

// 2. Hook to add a new asset
type AddAssetPayload = Omit<Asset, 'id' | 'user_id' | 'created_at'>;

export const addAsset = async (newAsset: AddAssetPayload, userId: string) => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
        .from('assets')
        .insert([{ ...newAsset, user_id: userId }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as Asset;
};

export const useAddAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOffline } = useNetwork();

  return useMutation({
    mutationFn: async (newAsset: AddAssetPayload): Promise<any> => {
      if (!user) throw new Error('User not authenticated');

      if (isOffline) {
        const optimisticId = `offline_${uuid.v4()}`;
        const payload = { ...newAsset, id: optimisticId, user_id: user.id };
        await addToQueue({ type: 'ADD_ASSET', payload });

        queryClient.setQueryData(['assets', user.id], (oldData: Asset[] | undefined) => {
            const newAssetWithDefaults: Asset = {
                ...newAsset,
                id: optimisticId,
                user_id: user.id,
                created_at: new Date().toISOString(),
            };
            return oldData ? [...oldData, newAssetWithDefaults] : [newAssetWithDefaults];
        });
        return newAssetWithDefaults;
      } else {
        return addAsset(newAsset, user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', user?.id] });
    },
  });
};

// 3. Hook to update an asset
export type UpdateAssetPayload = Partial<Omit<Asset, 'id' | 'user_id' | 'created_at'>> & { id: string };

export const updateAsset = async (payload: UpdateAssetPayload) => {
    const supabase = await getSupabaseClient();
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOffline } = useNetwork();

  return useMutation({
    mutationFn: async (payload: UpdateAssetPayload) => {
      if (isOffline) {
        await addToQueue({ type: 'UPDATE_ASSET', payload });
        queryClient.setQueryData(['assets', user?.id], (oldData: Asset[] = []) =>
          oldData.map(asset =>
            asset.id === payload.id ? { ...asset, ...payload } : asset
          )
        );
        return payload;
      } else {
        return updateAsset(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', user?.id] });
    },
  });
};

// 4. Hook to delete an asset
export const deleteAsset = async (assetId: string) => {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('assets').delete().eq('id', assetId);
  if (error) throw new Error(error.message);
  return assetId;
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOffline } = useNetwork();

  return useMutation({
    mutationFn: async (assetId: string) => {
      if (isOffline) {
        await addToQueue({ type: 'DELETE_ASSET', payload: { id: assetId } });
        queryClient.setQueryData(['assets', user?.id], (oldData: Asset[] = []) =>
          oldData.filter(asset => asset.id !== assetId)
        );
        return assetId;
      } else {
        return deleteAsset(assetId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', user?.id] });
    },
  });
};
