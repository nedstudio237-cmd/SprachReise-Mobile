import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/config';

const TEAM = [
  { name: 'Ned Studio', role: 'Fondateur & Développeur principal', flag: '🇨🇲' },
  { name: 'Équipe pédagogique', role: 'Conception des contenus CECRL', flag: '📚' },
  { name: 'Formateurs certifiés', role: '12 enseignants Goethe-qualifiés', flag: '🎓' },
];

const STACK = [
  { label: 'Backend',  value: 'Spring Boot 3.5 · Java 17 · MySQL', icon: '⚙️' },
  { label: 'Mobile',   value: 'React Native · Expo SDK 52',         icon: '📱' },
  { label: 'Temps réel', value: 'WebSocket STOMP · WebRTC local',   icon: '📡' },
  { label: 'IA',       value: 'Claude API (Anthropic)',              icon: '🤖' },
  { label: 'Paiements', value: 'Stripe · CamPay · PayPal Sandbox',  icon: '💳' },
  { label: 'Certificats', value: 'iText7 · Signature PKCS#7',       icon: '📜' },
];

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.deep} />
        </TouchableOpacity>
        <Text style={s.title}>À propos</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>S</Text>
            <Text style={s.logoR}>R</Text>
          </View>
          <Text style={s.appName}>SprachReise</Text>
          <Text style={s.appTagline}>Lernen · Reisen · Entdecken</Text>
          <View style={s.versionBadge}>
            <Text style={s.versionTxt}>Version 1.0.0 · Juin 2026</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={s.missionCard}>
          <Text style={s.missionTitle}>Notre mission</Text>
          <Text style={s.missionText}>
            SprachReise ("Voyage linguistique" en allemand) est né d'un constat simple : l'apprentissage
            de l'allemand en Afrique francophone est trop souvent hors de portée — géographiquement
            et financièrement.
          </Text>
          <Text style={s.missionText}>
            Nous mettons en relation des apprenants camerounais et africains avec des formateurs
            certifiés, proposons un cursus structuré conforme au CECRL (A1 → C2), des sessions live
            interactives, un tuteur IA disponible 24h/24, et des certificats numériques signés.
          </Text>
          <Text style={[s.missionText, { fontStyle: 'italic', color: COLORS.gold, marginTop: 8 }]}>
            "Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt."
          </Text>
          <Text style={s.missionQuoteAuthor}>— Ludwig Wittgenstein</Text>
        </View>

        {/* Chiffres clés */}
        <View style={s.statsGrid}>
          {[
            { n: '6', l: 'Niveaux CECRL' },
            { n: '12', l: 'Formateurs certifiés' },
            { n: '37+', l: 'Apprenants actifs' },
            { n: '27', l: 'Vidéos DW intégrées' },
          ].map((stat, i) => (
            <View key={i} style={s.statBox}>
              <Text style={s.statNum}>{stat.n}</Text>
              <Text style={s.statLbl}>{stat.l}</Text>
            </View>
          ))}
        </View>

        {/* Stack technique */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>TECHNOLOGIES</Text>
          {STACK.map((t, i) => (
            <View key={i} style={s.stackRow}>
              <Text style={s.stackIcon}>{t.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.stackLabel}>{t.label}</Text>
                <Text style={s.stackValue}>{t.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Équipe */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ÉQUIPE</Text>
          {TEAM.map((m, i) => (
            <View key={i} style={s.teamRow}>
              <Text style={s.teamFlag}>{m.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.teamName}>{m.name}</Text>
                <Text style={s.teamRole}>{m.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Niveaux CECRL */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>NIVEAUX CECRL</Text>
          {[
            ['A1', 'Découverte',  '#10B981', 'Expressions basiques du quotidien'],
            ['A2', 'Survie',      '#3B82F6', 'Situations simples et familières'],
            ['B1', 'Seuil',       '#8B5CF6', 'Situations courantes de la vie'],
            ['B2', 'Avancé',      '#F59E0B', 'Sujets complexes, nuances'],
            ['C1', 'Autonome',    '#EF4444', 'Expression fluide et spontanée'],
            ['C2', 'Maîtrise',    '#B8893A', 'Maîtrise totale de la langue'],
          ].map(([code, name, color, desc]) => (
            <View key={code} style={s.levelRow}>
              <View style={[s.levelBadge, { backgroundColor: color + '22', borderColor: color }]}>
                <Text style={[s.levelCode, { color }]}>{code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.levelName}>{name}</Text>
                <Text style={s.levelDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={s.contactSection}>
          <Text style={s.sectionTitle}>NOUS CONTACTER</Text>
          {[
            { icon: 'mail', label: 'support@sprachreise.app',   url: 'mailto:support@sprachreise.app' },
            { icon: 'globe', label: 'sprachreise.app',           url: 'https://sprachreise.app' },
          ].map((c, i) => (
            <TouchableOpacity key={i} style={s.contactRow} onPress={() => Linking.openURL(c.url)}>
              <Ionicons name={c.icon} size={18} color={COLORS.primary} />
              <Text style={s.contactLabel}>{c.label}</Text>
              <Ionicons name="open-outline" size={14} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.copyright}>
          © 2026 SprachReise · Tous droits réservés{'\n'}
          Développé avec ❤️ au Cameroun 🇨🇲
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:     { fontFamily: FONTS.display, fontSize: 20, color: COLORS.deep, fontStyle: 'italic' },

  hero:        { alignItems: 'center', paddingVertical: 28, gap: 8 },
  logoCircle:  { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.deep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logoText:    { fontFamily: FONTS.displayBold, fontSize: 32, color: COLORS.parchment },
  logoR:       { fontFamily: FONTS.displayBold, fontSize: 32, color: COLORS.gold },
  appName:     { fontFamily: FONTS.display, fontSize: 30, color: COLORS.deep, fontStyle: 'italic' },
  appTagline:  { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, letterSpacing: 2 },
  versionBadge:{ backgroundColor: COLORS.paperDeep, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  versionTxt:  { fontFamily: FONTS.ui, fontSize: 11, color: COLORS.muted },

  missionCard: { backgroundColor: COLORS.parchment, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.paperDeep, marginBottom: 16 },
  missionTitle:{ fontFamily: FONTS.uiBold, fontSize: 16, color: COLORS.deep, marginBottom: 12 },
  missionText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.deep, lineHeight: 22, marginBottom: 8 },
  missionQuoteAuthor:{ fontFamily: FONTS.ui, fontSize: 11, color: COLORS.muted, textAlign: 'right' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox:   { flex: 1, minWidth: '45%', backgroundColor: COLORS.deep, borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  statNum:   { fontFamily: FONTS.displayBold, fontSize: 28, color: COLORS.gold },
  statLbl:   { fontFamily: FONTS.ui, fontSize: 11, color: COLORS.muted, textAlign: 'center' },

  section:      { backgroundColor: COLORS.parchment, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.paperDeep, marginBottom: 16 },
  sectionTitle: { fontFamily: FONTS.uiBold, fontSize: 11, color: COLORS.muted, letterSpacing: 2, marginBottom: 14 },

  stackRow:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  stackIcon:  { fontSize: 18, marginTop: 1 },
  stackLabel: { fontFamily: FONTS.uiBold, fontSize: 12, color: COLORS.deep },
  stackValue: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },

  teamRow:  { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  teamFlag: { fontSize: 24 },
  teamName: { fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.deep },
  teamRole: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },

  levelRow:   { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  levelBadge: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  levelCode:  { fontFamily: FONTS.uiBold, fontSize: 14 },
  levelName:  { fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.deep },
  levelDesc:  { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 2 },

  contactSection: { backgroundColor: COLORS.parchment, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.paperDeep, marginBottom: 16 },
  contactRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  contactLabel:   { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.deep, flex: 1 },

  copyright: { textAlign: 'center', fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, fontStyle: 'italic', marginTop: 8, lineHeight: 20 },
});
