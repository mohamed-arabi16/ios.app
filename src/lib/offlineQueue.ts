import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = 'offline_mutation_queue';

export interface Mutation {
  type: string;
  payload: any;
}

export const getQueue = async (): Promise<Mutation[]> => {
  try {
    const storedQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return storedQueue ? JSON.parse(storedQueue) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
};

export const addToQueue = async (mutation: Mutation): Promise<void> => {
  try {
    const currentQueue = await getQueue();
    const newQueue = [...currentQueue, mutation];
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue));
  } catch (error) {
    console.error('Failed to add to offline queue:', error);
  }
};

export const clearQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
  }
};
