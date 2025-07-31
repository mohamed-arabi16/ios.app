import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../hooks/useNetwork';
import { getQueue, clearQueue, Mutation } from '../lib/offlineQueue';
import { addDebt, updateDebt, deleteDebt } from '../hooks/useDebts';
import { addAsset, updateAsset, deleteAsset } from '../hooks/useAssets';
import { useQueryClient } from '@tanstack/react-query';

export const QueueProcessor = () => {
  const { session, user } = useAuth();
  const { isOffline } = useNetwork();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const processQueue = async () => {
      if (isOffline || isProcessing || !session || !user) {
        return;
      }

      setIsProcessing(true);
      const queue = await getQueue();

      if (queue.length === 0) {
        setIsProcessing(false);
        return;
      }

      console.log(`Processing ${queue.length} offline mutations...`);

      for (const mutation of queue) {
        try {
          await processMutation(mutation, user.id);
        } catch (error) {
          console.error('Failed to process mutation:', mutation, error);
          // Optionally, add failed mutations to a separate "dead-letter" queue
        }
      }

      await clearQueue();
      console.log('Offline queue processed.');

      // Invalidate queries to refetch data from server
      queryClient.invalidateQueries({ queryKey: ['debts', user.id] });
      queryClient.invalidateQueries({ queryKey: ['assets', user.id] });

      setIsProcessing(false);
    };

    processQueue();
  }, [isOffline, session, user, isProcessing, queryClient]);

  return null; // This is a background component
};

const processMutation = async (mutation: Mutation, userId: string) => {
    switch (mutation.type) {
        case 'ADD_DEBT':
            // The payload for add already includes user_id from the optimistic update
            const { user_id, ...addPayload } = mutation.payload;
            await addDebt(addPayload, userId);
            break;
        case 'UPDATE_DEBT':
            await updateDebt(mutation.payload);
            break;
        case 'DELETE_DEBT':
            await deleteDebt(mutation.payload.id);
            break;
        case 'ADD_ASSET':
            const { user_id: asset_user_id, ...addAssetPayload } = mutation.payload;
            await addAsset(addAssetPayload, userId);
            break;
        case 'UPDATE_ASSET':
            await updateAsset(mutation.payload);
            break;
        case 'DELETE_ASSET':
            await deleteAsset(mutation.payload.id);
            break;
        default:
            console.warn(`Unknown mutation type: ${mutation.type}`);
    }
};
