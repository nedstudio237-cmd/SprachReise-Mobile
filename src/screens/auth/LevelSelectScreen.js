import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';

const LEVELS = [
  { code: 'A1', label: 'A1 — Débutant', desc: 'Je ne connais pas encore la langue.' },
  { code: 'A2', label: 'A2 — Élémentaire', desc: 'Je comprends quelques mots et phrases simples.' },
  { code: 'B1', label: 'B1 — Intermédiaire', desc: 'Je peux tenir une conversation simple.' },
  { code: 'B2', label: 'B2 — Avancé', desc: 'Je m\'exprime avec aisance sur des sujets variés.' },
  { code: 'C1', label: 'C1 — Autonome', desc: 'Je maîtrise la langue avec fluidité.' },
  { code: 'C2', label: 'C2 — Maîtrise', desc: 'Je parle la langue comme un natif.' },
];

const LEVEL_COLORS = { A1:'#10B981', A2:'#3B82F6', B1:'#8B5CF6', B2:'#F59E0B', C1:'#EC4899', C2:'#EF4444' };

export default function LevelSelectScreen({ navigation, route }) {
  const [selected, setSelected] = useState('A1');
  const params = route?.params ?? {};

  const handleNext = () => {
    navigation.navigate('SubLevel', { ...params, level: selected });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>ÉTAPE 2 / 3</Text>
        <Text style={styles.title}>Quel est votre{'\n'}niveau actuel ?</Text>
        <Text style={styles.subtitle}>
          Selon le Cadre Européen Commun de Référence (CECRL / Goethe-Institut).
        </Text>

        {LEVELS.map((lvl) => {
          const isSelected = selected === lvl.code;
          const color = LEVEL_COLORS[lvl.code];
          return (
            <TouchableOpacity
              key={lvl.code}
              style={[styles.card, isSelected && { borderColor: color, backgroundColor: color + '15' }]}
              onPress={() => setSelected(lvl.code)}
              activeOpacity={0.82}
            >
              <View style={[styles.badge, { backgroundColor: color + '25' }]}>
                <Text style={[styles.badgeText, { color }]}>{lvl.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.levelLabel, isSelected && { color: COLORS.parchment }]}>{lvl.label}</Text>
                <Text style={styles.levelDesc}>{lvl.desc}</Text>
              </View>
              <View style={[styles.radio, isSelected && { borderColor: color }]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: color }]} />}
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
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  back: { marginBottom: 16 },
  backText: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 16 },
  eyebrow: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  title: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 30, lineHeight: 38, marginBottom: 12 },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, lineHeight: 22, marginBottom: 28, fontStyle: 'italic' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12,
    padding: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.25)',
  },
  badge: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  badgeText: { fontFamily: FONTS.uiBold, fontSize: 15, letterSpacing: 0.5 },
  levelLabel: { fontFamily: FONTS.displayBold, color: COLORS.cream, fontSize: 16, marginBottom: 2 },
  levelDesc: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(126,102,58,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  nextBtn: {
    backgroundColor: COLORS.accent, borderRadius: 8,
    padding: 18, alignItems: 'center', marginTop: 24,
  },
  nextBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14, letterSpacing: 1.5 },
});
