import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: async (user, accessToken) => {
    set({ user, accessToken });
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },

  logout: async () => {
    set({ user: null, accessToken: null });
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('user');
  },

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        set({ user: JSON.parse(userStr), accessToken: token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
