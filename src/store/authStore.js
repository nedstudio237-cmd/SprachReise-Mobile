import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Clés AsyncStorage par utilisateur ───────────────────────────────────────
// Chaque donnée est namespaced par email pour isoler les comptes
const k = (email, key) => `${email}:${key}`;

const EMPTY_GAME_STATS = () => ({
  wordMatch:    { played: 0, correct: 0 },
  fillBlank:    { played: 0, correct: 0 },
  listenChoose: { played: 0, correct: 0 },
  dictee:       { played: 0, correct: 0 },
  pronounce:    { played: 0, correct: 0 },
  wordOrder:    { played: 0, correct: 0 },
});

// Charge toutes les données spécifiques à un utilisateur depuis AsyncStorage
async function loadUserData(email) {
  const [language, level, sublevel, progressStr, notesStr, qcmStr, gameStr] =
    await Promise.all([
      AsyncStorage.getItem(k(email, 'language')),
      AsyncStorage.getItem(k(email, 'level')),
      AsyncStorage.getItem(k(email, 'sublevel')),
      AsyncStorage.getItem(k(email, 'courseProgress')),
      AsyncStorage.getItem(k(email, 'notes')),
      AsyncStorage.getItem(k(email, 'qcmAttempts')),
      AsyncStorage.getItem(k(email, 'gameStats')),
    ]);
  return {
    language:      language   ?? null,
    level:         level      ?? null,
    sublevel:      sublevel   ?? null,
    courseProgress: progressStr ? JSON.parse(progressStr) : {},
    notes:          notesStr    ? JSON.parse(notesStr)    : {},
    qcmAttempts:    qcmStr      ? JSON.parse(qcmStr)      : [],
    gameStats:      gameStr     ? JSON.parse(gameStr)      : EMPTY_GAME_STATS(),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:          null,   // { id, email, firstName, lastName, role, photoUrl }
  accessToken:   null,
  trainerStatus: null,   // PENDING | APPROVED | REJECTED (formateurs uniquement)
  isLoading:     true,

  // Profil apprenant (propre à l'utilisateur connecté)
  language: null,
  level:    null,
  sublevel: null,

  courseProgress: {},
  notes:          {},
  qcmAttempts:    [],
  gameStats:      EMPTY_GAME_STATS(),

  // ── Connexion ─────────────────────────────────────────────────────────────
  setAuth: async (user, accessToken, trainerStatus = null) => {
    await Promise.all([
      AsyncStorage.setItem('accessToken', accessToken),
      AsyncStorage.setItem('user', JSON.stringify(user)),
      AsyncStorage.setItem('trainerStatus', trainerStatus ?? ''),
    ]);
    const userData = await loadUserData(user.email);
    set({ user, accessToken, trainerStatus, ...userData });
  },

  // ── Déconnexion ───────────────────────────────────────────────────────────
  logout: async () => {
    await Promise.all([
      AsyncStorage.removeItem('accessToken'),
      AsyncStorage.removeItem('user'),
      AsyncStorage.removeItem('trainerStatus'),
    ]);

    // Remettre le store à zéro (les données seront rechargées au prochain login)
    set({
      user:           null,
      accessToken:    null,
      trainerStatus:  null,
      language:       null,
      level:          null,
      sublevel:       null,
      courseProgress: {},
      notes:          {},
      qcmAttempts:    [],
      gameStats:      EMPTY_GAME_STATS(),
    });
  },

  // ── Profil apprenant ──────────────────────────────────────────────────────
  setLearnerProfile: async (language, level, sublevel) => {
    const { user } = get();
    if (!user?.email) return;
    set({ language, level, sublevel });
    await Promise.all([
      AsyncStorage.setItem(k(user.email, 'language'), language),
      AsyncStorage.setItem(k(user.email, 'level'),    level),
      AsyncStorage.setItem(k(user.email, 'sublevel'), sublevel),
    ]);
  },

  // ── Progression cours ─────────────────────────────────────────────────────
  updateCourseProgress: async (courseId, chaptersRead, totalChapters) => {
    const { user, courseProgress } = get();
    if (!user?.email) return;
    const completed = chaptersRead >= totalChapters;
    const next = { ...courseProgress, [courseId]: { completed, chaptersRead, totalChapters } };
    set({ courseProgress: next });
    await AsyncStorage.setItem(k(user.email, 'courseProgress'), JSON.stringify(next));
  },

  // ── Notes ─────────────────────────────────────────────────────────────────
  setNote: async (courseId, text) => {
    const { user, notes } = get();
    if (!user?.email) return;
    const next = { ...notes, [courseId]: text };
    set({ notes: next });
    await AsyncStorage.setItem(k(user.email, 'notes'), JSON.stringify(next));
  },

  // ── QCM ───────────────────────────────────────────────────────────────────
  recordQcmAttempt: async (qcmId, score, total) => {
    const { user, qcmAttempts } = get();
    if (!user?.email) return;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const next = [...qcmAttempts, { qcmId, score, total, percentage, date: new Date().toISOString() }];
    set({ qcmAttempts: next });
    await AsyncStorage.setItem(k(user.email, 'qcmAttempts'), JSON.stringify(next));
  },

  // ── Mini-jeux ─────────────────────────────────────────────────────────────
  recordGameResult: async (game, correct, total) => {
    const { user, gameStats } = get();
    if (!user?.email) return;
    const next = {
      ...gameStats,
      [game]: {
        played:  gameStats[game].played  + total,
        correct: gameStats[game].correct + correct,
      },
    };
    set({ gameStats: next });
    await AsyncStorage.setItem(k(user.email, 'gameStats'), JSON.stringify(next));
  },

  // ── Initialisation au démarrage ───────────────────────────────────────────
  initialize: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user'),
      ]);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        const trainerStatus = await AsyncStorage.getItem('trainerStatus');
        const userData = await loadUserData(user.email);
        set({ user, accessToken: token, trainerStatus: trainerStatus || null, ...userData, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
