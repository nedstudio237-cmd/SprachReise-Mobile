import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const LEVEL_IDS = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:6 };
const LEVEL_LABELS = { A1:'Débutant', A2:'Élémentaire', B1:'Intermédiaire', B2:'Avancé', C1:'Autonome', C2:'Maîtrise' };
const LANG_FLAGS = { de:'🇩🇪', en:'🇬🇧', es:'🇪🇸', zh:'🇨🇳' };
const GREETING = { de:'Guten Tag', en:'Hello', es:'¡Hola', zh:'你好' };

function formatDuration(sec) {
  if (!sec) return '—';
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m/60)}h${m%60>0?m%60+'min':''}` : `${m} min`;
}

export default function HomeScreen({ navigation }) {
  const { user, level, language, courseProgress } = useAuthStore();
  const firstName = user?.firstName ?? 'Apprenant';
  const userLevel = level ?? 'A1';
  const userLang = language ?? 'de';

  const [courses, setCourses] = useState([]);
  const [nextSession, setNextSession] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const levelId = LEVEL_IDS[userLevel] ?? 1;
    Promise.all([
      api.get('/courses', { params: { levelId } }),
      api.get('/sessions'),
    ]).then(([cRes, sRes]) => {
      setCourses(cRes.data.slice(0, 3));
      const upcoming = sRes.data.find((s) => s.status === 'SCHEDULED' || s.status === 'LIVE');
      setNextSession(upcoming ?? null);
    }).catch(() => {}).finally(() => setLoadingCourses(false));
  }, [userLevel]);

  // Calcul progression globale
  const completedCount = Object.values(courseProgress).filter((p) => p.completed).length;
  const totalCourses = courses.length || 1;
  const progressPct = Math.min(100, Math.round((completedCount / Math.max(totalCourses, 1)) * 100));

  function formatSessionDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
        + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{GREETING[userLang] ?? 'Bonjour'},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.langBadge}>
            <Text style={styles.langFlag}>{LANG_FLAGS[userLang] ?? '🌍'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.progressCard}
          onPress={() => navigation?.navigate('Progress')}
          activeOpacity={0.88}
        >
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardLabel}>NIVEAU ACTUEL</Text>
              <Text style={styles.progressCardLevel}>{userLevel} — {LEVEL_LABELS[userLevel]}</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressCircleText}>{progressPct}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressSub}>{completedCount} / {totalCourses} cours complétés</Text>
            <Text style={styles.progressLink}>Voir le détail →</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <QuickAction emoji="📖" label="Cours" onPress={() => navigation?.navigate('Cours')} />
          <QuickAction emoji="📡" label="Live" onPress={() => navigation?.navigate('Live')} />
          <QuickAction emoji="✏️" label="QCM" onPress={() => navigation?.navigate('Cursus')} />
          <QuickAction emoji="📜" label="Certifs" />
        </View>

        <Text style={styles.sectionTitle}>CONTINUER L'APPRENTISSAGE</Text>

        {loadingCourses ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
        ) : courses.length === 0 ? (
          <Text style={styles.emptyText}>Aucun cours disponible pour le niveau {userLevel}.</Text>
        ) : (
          courses.map((course, i) => {
            const progress = courseProgress[course.id];
            const done = progress?.completed;
            const dur = formatDuration(course.videoDurationSec);
            return (
              <TouchableOpacity
                key={course.id}
                style={styles.lessonCard}
                onPress={() => navigation?.navigate('CourseDetail', { courseId: course.id })}
              >
                <View style={[styles.lessonNum, done && styles.lessonNumDone]}>
                  <Text style={styles.lessonNumText}>{done ? '✓' : i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonTitle}>{course.title}</Text>
                  <Text style={styles.lessonSub}>
                    {course.levelCode} · {dur}{done ? ' · Terminé ✓' : ''}
                  </Text>
                </View>
                <Text style={styles.lessonArrow}>›</Text>
              </TouchableOpacity>
            );
          })
        )}

        {nextSession && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>SESSION LIVE À VENIR</Text>
            <View style={styles.liveCard}>
              <View style={styles.liveCardHeader}>
                <View style={[styles.livePill, nextSession.status === 'LIVE' && styles.livePillActive]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>{nextSession.status === 'LIVE' ? 'EN DIRECT' : 'LIVE'}</Text>
                </View>
                <Text style={styles.liveTime}>{formatSessionDate(nextSession.scheduledStart)}</Text>
              </View>
              <Text style={styles.liveTitle}>{nextSession.title}</Text>
              <Text style={styles.liveSub}>
                {nextSession.trainerName ? `avec ${nextSession.trainerName}` : ''}
                {nextSession.durationMinutes ? ` · ${nextSession.durationMinutes} min` : ''}
              </Text>
              <TouchableOpacity style={styles.liveBtn} onPress={() => navigation?.navigate('Live')}>
                <Text style={styles.liveBtnText}>RÉSERVER MA PLACE</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ emoji, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress}>
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
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, marginBottom: 22 },
  greeting: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, fontStyle: 'italic' },
  name: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 24, marginTop: 2 },
  langBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)',
  },
  langFlag: { fontSize: 22 },

  progressCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 20, marginBottom: 24 },
  progressCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressCardLabel: { fontFamily: FONTS.uiBold, color: 'rgba(249,244,232,0.6)', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  progressCardLevel: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 20 },
  progressCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  progressCircleText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13 },
  progressBar: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, height: 5, marginBottom: 8 },
  progressFill: { backgroundColor: COLORS.gold, borderRadius: 4, height: 5 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressSub: { fontFamily: FONTS.ui, color: 'rgba(249,244,232,0.55)', fontSize: 12 },
  progressLink: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 0.5 },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  quickLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 11 },

  sectionTitle: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },

  lessonCard: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 8,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  lessonNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  lessonNumDone: { backgroundColor: COLORS.success ?? '#10B981' },
  lessonNumText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14 },
  lessonTitle: { fontFamily: FONTS.medium, color: COLORS.parchment, fontSize: 14, marginBottom: 2 },
  lessonSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  lessonArrow: { color: COLORS.gold, fontSize: 24 },

  liveCard: { backgroundColor: 'rgba(161,94,45,0.1)', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: 'rgba(161,94,45,0.35)', marginBottom: 8 },
  liveCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  livePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  livePillActive: { backgroundColor: 'rgba(239,68,68,0.3)' },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444', marginRight: 5 },
  livePillText: { fontFamily: FONTS.uiBold, color: '#EF4444', fontSize: 10, letterSpacing: 0.5 },
  liveTime: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 12 },
  liveTitle: { fontFamily: FONTS.bold, color: COLORS.parchment, fontSize: 16, marginBottom: 4 },
  liveSub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, marginBottom: 14 },
  liveBtn: { backgroundColor: COLORS.accent, padding: 12, borderRadius: 5, alignItems: 'center' },
  liveBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 12, letterSpacing: 1 },
});
