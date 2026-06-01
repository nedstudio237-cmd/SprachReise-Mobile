import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  // Profil apprenant
  language: null,
  level: null,
  sublevel: null,

  // Progression cours { courseId: { completed, chaptersRead, totalChapters } }
  courseProgress: {},

  // Notes par cours { courseId: string }
  notes: {},

  // Stats QCM [{ qcmId, score, total, percentage, date }]
  qcmAttempts: [],

  // Stats mini-jeux { wordMatch: { played, correct }, fillBlank: { played, correct } }
  gameStats: {
    wordMatch: { played: 0, correct: 0 },
    fillBlank: { played: 0, correct: 0 },
    listenChoose: { played: 0, correct: 0 },
    dictee: { played: 0, correct: 0 },
    pronounce: { played: 0, correct: 0 },
    wordOrder: { played: 0, correct: 0 },
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  // ── Learner profile ───────────────────────────────────────────────────────
  setLearnerProfile: async (language, level, sublevel) => {
    set({ language, level, sublevel });
    await AsyncStorage.setItem('language', language);
    await AsyncStorage.setItem('level', level);
    await AsyncStorage.setItem('sublevel', sublevel);
  },

  // ── Course progress ───────────────────────────────────────────────────────
  updateCourseProgress: async (courseId, chaptersRead, totalChapters) => {
    const completed = chaptersRead >= totalChapters;
    const next = { ...get().courseProgress, [courseId]: { completed, chaptersRead, totalChapters } };
    set({ courseProgress: next });
    await AsyncStorage.setItem('courseProgress', JSON.stringify(next));
  },

  // ── Notes ─────────────────────────────────────────────────────────────────
  setNote: async (courseId, text) => {
    const next = { ...get().notes, [courseId]: text };
    set({ notes: next });
    await AsyncStorage.setItem('notes', JSON.stringify(next));
  },

  // ── QCM stats ─────────────────────────────────────────────────────────────
  recordQcmAttempt: async (qcmId, score, total) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const attempt = { qcmId, score, total, percentage, date: new Date().toISOString() };
    const next = [...get().qcmAttempts, attempt];
    set({ qcmAttempts: next });
    await AsyncStorage.setItem('qcmAttempts', JSON.stringify(next));
  },

  // ── Game stats ────────────────────────────────────────────────────────────
  recordGameResult: async (game, correct, total) => {
    const prev = get().gameStats;
    const next = {
      ...prev,
      [game]: {
        played: prev[game].played + total,
        correct: prev[game].correct + correct,
      },
    };
    set({ gameStats: next });
    await AsyncStorage.setItem('gameStats', JSON.stringify(next));
  },

  // ── Init ─────────────────────────────────────────────────────────────────
  initialize: async () => {
    try {
      const [token, userStr, language, level, sublevel,
        progressStr, notesStr, qcmStr, gameStr] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('language'),
        AsyncStorage.getItem('level'),
        AsyncStorage.getItem('sublevel'),
        AsyncStorage.getItem('courseProgress'),
        AsyncStorage.getItem('notes'),
        AsyncStorage.getItem('qcmAttempts'),
        AsyncStorage.getItem('gameStats'),
      ]);

      if (token && userStr) {
        set({
          user: JSON.parse(userStr),
          accessToken: token,
          language: language || 'de',
          level: level || 'A1',
          sublevel: sublevel || 'debutant',
          courseProgress: progressStr ? JSON.parse(progressStr) : {},
          notes: notesStr ? JSON.parse(notesStr) : {},
          qcmAttempts: qcmStr ? JSON.parse(qcmStr) : [],
          gameStats: gameStr ? JSON.parse(gameStr) : {
          wordMatch:{played:0,correct:0}, fillBlank:{played:0,correct:0},
          listenChoose:{played:0,correct:0}, dictee:{played:0,correct:0},
          pronounce:{played:0,correct:0}, wordOrder:{played:0,correct:0},
        },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
