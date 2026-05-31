import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';

const LANGUAGES = [
  { code: 'de', flag: '🇩🇪', name: 'Allemand', desc: 'Deutsch — Europe centrale, Autriche, Suisse' },
  { code: 'en', flag: '🇬🇧', name: 'Anglais', desc: 'English — Affaires, international' },
  { code: 'es', flag: '🇪🇸', name: 'Espagnol', desc: 'Español — Amérique latine, Espagne' },
  { code: 'zh', flag: '🇨🇳', name: 'Mandarin', desc: '普通话 — Chine, commerce asiatique' },
];

export default function LanguageSelectScreen({ navigation, route }) {
  const [selected, setSelected] = useState('de');
  const params = route?.params ?? {};

  const handleNext = () => {
    navigation.navigate('LevelSelect', { ...params, language: selected });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>ÉTAPE 1 / 3</Text>
        <Text style={styles.title}>Quelle langue{'\n'}voulez-vous apprendre ?</Text>
        <Text style={styles.subtitle}>
          SprachReise vous prépare aux voyages, études et carrières à l'international.
        </Text>

        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.82}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.langName, isSelected && styles.langNameSelected]}>{lang.name}</Text>
                <Text style={styles.langDesc}>{lang.desc}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>CONTINUER  ›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  eyebrow: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  title: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 30, lineHeight: 38, marginBottom: 12 },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, lineHeight: 22, marginBottom: 32, fontStyle: 'italic' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12,
    padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
  },
  cardSelected: { borderColor: COLORS.gold, backgroundColor: 'rgba(184,137,58,0.1)' },
  flag: { fontSize: 36, marginRight: 16 },
  langName: { fontFamily: FONTS.displayBold, color: COLORS.cream, fontSize: 18, marginBottom: 3 },
  langNameSelected: { color: COLORS.parchment },
  langDesc: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(126,102,58,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.gold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold },
  nextBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8,
    padding: 18, alignItems: 'center', marginTop: 24,
  },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14, letterSpacing: 1.5 },
});
