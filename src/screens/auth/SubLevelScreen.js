import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

const SUBLEVELS = [
  {
    code: 'debutant',
    icon: '🌱',
    label: 'Débutant complet',
    desc: 'Je commence tout juste. J\'ai besoin de partir des bases.',
  },
  {
    code: 'amateur',
    icon: '📚',
    label: 'Quelques bases',
    desc: 'J\'ai déjà vu quelques notions mais reste fragile.',
  },
  {
    code: 'intermediaire',
    icon: '🚀',
    label: 'Je me débrouille',
    desc: 'Je comprends l\'essentiel et veux consolider mes acquis.',
  },
];

export default function SubLevelScreen({ navigation, route }) {
  const [selected, setSelected] = useState('debutant');
  const [loading, setLoading] = useState(false);
  const { language, level } = route?.params ?? {};
  const { setAuth, setLearnerProfile } = useAuthStore();
  const authData = route?.params?.authData;

  const LANG_LABELS = { de: 'Allemand', en: 'Anglais', es: 'Espagnol', zh: 'Mandarin' };

  const handleFinish = async () => {
    setLoading(true);
    try {
      let userToStore = authData?.user ?? null;

      // 1. Informer le backend du niveau choisi → il assigne le bon formateur
      if (authData?.accessToken && level) {
        const res = await fetch(`${API_BASE_URL}/auth/set-level`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authData.accessToken}`,
          },
          body: JSON.stringify({ levelCode: level }),
        });
        if (res.ok) {
          const data = await res.json();
          const assignedTrainerId = data.assignedTrainerId && data.assignedTrainerId !== 0
            ? data.assignedTrainerId : null;
          userToStore = { ...userToStore, assignedTrainerId };
        }
      }

      // 2. Authentifier dans le store
      if (userToStore) {
        await setAuth(userToStore, authData.accessToken);
      }

      // 3. Sauvegarder le profil avec la clé namespaced par email
      await setLearnerProfile(language, level, selected);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de finaliser l\'inscription. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>‹ Retour</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>ÉTAPE 3 / 3</Text>
        <Text style={styles.title}>Où en êtes-vous{'\n'}dans ce niveau ?</Text>

        <View style={styles.recapRow}>
          <View style={styles.recapPill}>
            <Text style={styles.recapText}>{LANG_LABELS[language] ?? language}</Text>
          </View>
          <View style={styles.recapPill}>
            <Text style={styles.recapText}>{level}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Cela permet à votre tuteur IA de personnaliser exactement votre parcours.
        </Text>

        {SUBLEVELS.map((sub) => {
          const isSelected = selected === sub.code;
          return (
            <TouchableOpacity
              key={sub.code}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(sub.code)}
              activeOpacity={0.82}
            >
              <Text style={styles.cardIcon}>{sub.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>{sub.label}</Text>
                <Text style={styles.cardDesc}>{sub.desc}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.parchment} />
          ) : (
            <Text style={styles.finishBtnText}>COMMENCER MON PARCOURS  🎯</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep, paddingHorizontal: 24 },
  back: { paddingTop: 16, paddingBottom: 8 },
  backText: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 16 },
  body: { flex: 1, paddingBottom: 32 },
  eyebrow: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  title: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 30, lineHeight: 38, marginBottom: 14 },
  recapRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  recapPill: {
    backgroundColor: 'rgba(184,137,58,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  recapText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13 },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, lineHeight: 22, marginBottom: 24, fontStyle: 'italic' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12,
    padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
  },
  cardSelected: { borderColor: COLORS.gold, backgroundColor: 'rgba(184,137,58,0.1)' },
  cardIcon: { fontSize: 32, marginRight: 14 },
  cardLabel: { fontFamily: FONTS.displayBold, color: COLORS.cream, fontSize: 17, marginBottom: 3 },
  cardLabelSelected: { color: COLORS.parchment },
  cardDesc: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(126,102,58,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.gold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold },
  finishBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8,
    padding: 18, alignItems: 'center', marginTop: 28,
  },
  finishBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14, letterSpacing: 1 },
});
