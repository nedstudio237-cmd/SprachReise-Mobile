import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  // Profil apprenant
  language: null,       // 'de', 'en', 'es', 'zh'
  level: null,          // 'A1','A2','B1','B2','C1','C2'
  sublevel: null,       // 'debutant','amateur','intermediaire'
  // Progression cours : { courseId: { completed: bool, chaptersRead: number, totalChapters: number } }
  courseProgress: {},

  setAuth: async (user, accessToken) => {
    set({ user, accessToken });
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },

  setLearnerProfile: async (language, level, sublevel) => {
    set({ language, level, sublevel });
    await AsyncStorage.setItem('language', language);
    await AsyncStorage.setItem('level', level);
    await AsyncStorage.setItem('sublevel', sublevel);
  },

  updateCourseProgress: async (courseId, chaptersRead, totalChapters) => {
    const completed = chaptersRead >= totalChapters;
    const next = {
      ...get().courseProgress,
      [courseId]: { completed, chaptersRead, totalChapters },
    };
    set({ courseProgress: next });
    await AsyncStorage.setItem('courseProgress', JSON.stringify(next));
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
      const language = await AsyncStorage.getItem('language');
      const level = await AsyncStorage.getItem('level');
      const sublevel = await AsyncStorage.getItem('sublevel');
      const progressStr = await AsyncStorage.getItem('courseProgress');
      const courseProgress = progressStr ? JSON.parse(progressStr) : {};
      if (token && userStr) {
        set({
          user: JSON.parse(userStr), accessToken: token,
          language: language || 'de', level: level || 'A1', sublevel: sublevel || 'debutant',
          courseProgress, isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
