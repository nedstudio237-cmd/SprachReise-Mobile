// ⚠️ Choisis UNE seule ligne active selon ton réseau :

// Option 1 — Même Wi-Fi que le PC :
// export const API_BASE_URL = 'http://192.168.1.152:8090/api';

// Option 2 — LTE / réseau différent (ngrok) : remplace l'URL ci-dessous
export const API_BASE_URL = 'https://REMPLACE-PAR-TON-URL-NGROK.ngrok-free.app/api';

export const COLORS = {
  primary: '#7E663A',
  deep: '#372619',
  accent: '#A15E2D',
  muted: '#AE9182',
  cream: '#D9CAAA',
  paper: '#F5EFE3',
  paperDeep: '#EAE0CC',
  ink: '#1F1610',
  parchment: '#F9F4E8',
  gold: '#B8893A',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export const FONTS = {
  regular: 'Newsreader_400Regular',
  medium: 'Newsreader_500Medium',
  bold: 'Newsreader_600SemiBold',
  display: 'Fraunces_400Regular',
  displayItalic: 'Fraunces_400Regular_Italic',
  displayBold: 'Fraunces_600SemiBold',
  ui: 'PlusJakartaSans_400Regular',
  uiMedium: 'PlusJakartaSans_500Medium',
  uiBold: 'PlusJakartaSans_700Bold',
};

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const SUBSCRIPTION_PLANS = {
  BASIC:    { name: 'Apprenti',  price: 3000,  label: 'BASIC' },
  STANDARD: { name: 'Voyageur', price: 7500,  label: 'STANDARD' },
  PREMIUM:  { name: 'Erudit',   price: 15000, label: 'PREMIUM' },
};
