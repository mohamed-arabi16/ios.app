import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../hooks/useNetwork';
import { getQueue, clearQueue, Mutation } from '../lib/offlineQueue';
import { addDebt, updateDebt, deleteDebt } from '../hooks/useDebts';
import { addAsset, updateAsset, deleteAsset } from '../hooks/useAssets';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

export const QueueProcessor = () => {
  const { session, user } = useAuth();
  const { isOffline } = useNetwork();
  const isProcessing = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const processQueue = async () => {
      if (isOffline || isProcessing.current || !session || !user) {
        return;
      }

      isProcessing.current = true;
      let queue = await getQueue();

      if (queue.length === 0) {
        isProcessing.current = false;
        return;
      }

      // Filter queue to only process mutations for the current user
      queue = queue.filter(mutation => mutation.payload.user_id === user.id);

      if (queue.length > 0) {
          console.log(`Processing ${queue.length} offline mutations for user ${user.id}...`);
          Toast.show({
              type: 'info',
              text1: 'Syncing your offline changes...',
              visibilityTime: 2000,
          });

          for (const mutation of queue) {
            try {
              await processMutation(mutation, user.id);
            } catch (error) {
              console.error('Failed to process mutation:', mutation, error);
              Toast.show({
                  type: 'error',
                  text1: 'Failed to sync a change',
                  text2: `Could not process: ${mutation.type}`,
              });
            }
          }

          await clearQueue(); // Consider more granular queue management
          console.log('Offline queue processed.');

          Toast.show({
              type: 'success',
              text1: 'Your data is now up to date!',
              visibilityTime: 3000,
          });

          // Invalidate queries to refetch data from server
          queryClient.invalidateQueries({ queryKey: ['debts', user.id] });
          queryClient.invalidateQueries({ queryKey: ['assets', user.id] });
      }

      isProcessing.current = false;
    };

    const intervalId = setInterval(processQueue, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [isOffline, session, user, queryClient]);

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
