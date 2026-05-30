import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore();
  const firstName = user?.firstName ?? 'Apprenant';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Guten Tag,</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardLabel}>NIVEAU ACTUEL</Text>
              <Text style={styles.progressCardLevel}>A1 — Débutant</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressCircleText}>15%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '15%' }]} />
          </View>
          <Text style={styles.progressSub}>3 / 20 leçons complétées</Text>
        </View>

        <View style={styles.quickActions}>
          <QuickAction emoji="📖" label="Cours" />
          <QuickAction emoji="📡" label="Live" />
          <QuickAction emoji="✏️" label="QCM" />
          <QuickAction emoji="📜" label="Certifs" />
        </View>

        <Text style={styles.sectionTitle}>CONTINUER L'APPRENTISSAGE</Text>

        {[
          { title: 'Introduction à l\'allemand', sub: 'A1 · 20 min · Chapitre 3/12' },
          { title: 'Les salutations formelles', sub: 'A1 · 15 min · Chapitre 2/12' },
          { title: 'Chiffres et couleurs', sub: 'A1 · 18 min · Chapitre 4/12' },
        ].map((lesson, i) => (
          <TouchableOpacity
            key={i}
            style={styles.lessonCard}
            onPress={() => navigation?.navigate('CourseDetail')}
          >
            <View style={styles.lessonNum}>
              <Text style={styles.lessonNumText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonSub}>{lesson.sub}</Text>
            </View>
            <Text style={styles.lessonArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>SESSION LIVE À VENIR</Text>
        <View style={styles.liveCard}>
          <View style={styles.liveCardHeader}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
            <Text style={styles.liveTime}>Demain · 18:00</Text>
          </View>
          <Text style={styles.liveTitle}>Grammaire A1 — Articles définis</Text>
          <Text style={styles.liveSub}>avec Dr. Emma Nguema · 60 min</Text>
          <TouchableOpacity style={styles.liveBtn} onPress={() => navigation?.navigate('Live')}>
            <Text style={styles.liveBtnText}>RÉSERVER MA PLACE</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ emoji, label }) {
  return (
    <TouchableOpacity style={styles.quickItem}>
      <View style={styles.quickIcon}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    marginBottom: 22,
  },
  greeting: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  name: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 24,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.25)',
  },
  notifIcon: { fontSize: 18 },

  progressCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  progressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  progressCardLabel: {
    fontFamily: FONTS.uiBold,
    color: 'rgba(249,244,232,0.6)',
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  progressCardLevel: {
    fontFamily: FONTS.displayBold,
    color: COLORS.parchment,
    fontSize: 20,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 13,
  },
  progressBar: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    height: 5,
    marginBottom: 8,
  },
  progressFill: {
    backgroundColor: COLORS.gold,
    borderRadius: 4,
    height: 5,
  },
  progressSub: {
    fontFamily: FONTS.ui,
    color: 'rgba(249,244,232,0.55)',
    fontSize: 12,
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.2)',
  },
  quickLabel: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.muted,
    fontSize: 11,
  },

  sectionTitle: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 4,
  },

  lessonCard: {
    backgroundColor: 'rgba(245,239,227,0.06)',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.2)',
  },
  lessonNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonNumText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 14,
  },
  lessonTitle: {
    fontFamily: FONTS.medium,
    color: COLORS.parchment,
    fontSize: 14,
    marginBottom: 2,
  },
  lessonSub: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 11,
  },
  lessonArrow: {
    color: COLORS.gold,
    fontSize: 24,
  },

  liveCard: {
    backgroundColor: 'rgba(161,94,45,0.1)',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(161,94,45,0.35)',
    marginBottom: 8,
  },
  liveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  livePillText: {
    fontFamily: FONTS.uiBold,
    color: '#EF4444',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  liveTime: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.cream,
    fontSize: 12,
  },
  liveTitle: {
    fontFamily: FONTS.bold,
    color: COLORS.parchment,
    fontSize: 16,
    marginBottom: 4,
  },
  liveSub: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 14,
  },
  liveBtn: {
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  liveBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 12,
    letterSpacing: 1,
  },
});
