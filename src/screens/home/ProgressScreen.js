import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS, LEVELS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

// ─── Constantes ──────────────────────────────────────────────────────────────
const LEVEL_IDS = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
const LEVEL_COLORS = {
  A1: '#10B981', A2: '#3B82F6', B1: '#8B5CF6',
  B2: '#F59E0B', C1: '#EC4899', C2: '#EF4444',
};
const LEVEL_LABELS = {
  A1: 'Débutant', A2: 'Élémentaire', B1: 'Intermédiaire',
  B2: 'Avancé', C1: 'Autonome', C2: 'Maîtrise',
};
const GAME_LABELS = {
  wordMatch: 'Association', fillBlank: 'Compléter',
  listenChoose: 'Écoute', dictee: 'Dictée',
  pronounce: 'Prononciation', wordOrder: 'Ordre',
};

// Critères de validation d'un niveau
const CRITERIA = { courses: 4, qcmAvg: 70, sessions: 2, games: 10 };

// ─── Cercle de progression SVG ────────────────────────────────────────────────
function CircularProgress({ size = 120, strokeWidth = 8, percent = 0, color = COLORS.accent }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(percent, 100) / 100);

  return (
    <Svg width={size} height={size}>
      {/* Piste de fond */}
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color + '25'}
        strokeWidth={strokeWidth}
      />
      {/* Arc de progression */}
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        rotation="-90"
        origin={`${cx}, ${cy}`}
      />
      {/* Pourcentage centré */}
      <SvgText
        x={cx} y={cy - 8}
        textAnchor="middle"
        fontSize="26"
        fontWeight="bold"
        fill={color}
        fontFamily="Fraunces_600SemiBold"
      >
        {percent}
      </SvgText>
      <SvgText
        x={cx} y={cy + 12}
        textAnchor="middle"
        fontSize="11"
        fill={COLORS.muted}
        fontFamily="PlusJakartaSans_400Regular"
      >
        %
      </SvgText>
    </Svg>
  );
}

// ─── Carte critère ────────────────────────────────────────────────────────────
function CriteriaCard({ icon, label, detail, pct, done, color }) {
  return (
    <View style={[styles.criteriaCard, done && styles.criteriaCardDone]}>
      <View style={styles.criteriaRow}>
        <Text style={styles.criteriaIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.criteriaTopRow}>
            <Text style={styles.criteriaLabel}>{label}</Text>
            {done ? (
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>✓ Atteint</Text>
              </View>
            ) : (
              <Text style={[styles.criteriaPct, { color }]}>{pct}%</Text>
            )}
          </View>
          <Text style={styles.criteriaDetail}>{detail}</Text>
          <View style={styles.barTrack}>
            <LinearGradient
              colors={done ? ['#10B981', '#10B981'] : [color, color + 'AA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.barFill, { width: `${pct}%` }]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function ProgressScreen({ navigation }) {
  const { level, courseProgress, qcmAttempts, gameStats } = useAuthStore();
  const userLevel = level ?? 'A1';
  const color = LEVEL_COLORS[userLevel] ?? COLORS.accent;
  const levelIdx = LEVELS.indexOf(userLevel);
  const nextLevel = LEVELS[levelIdx + 1] ?? null;

  const [totalCourses, setTotalCourses] = useState(CRITERIA.courses);
  const [sessionsAttended, setSessionsAttended] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lvlId = LEVEL_IDS[userLevel] ?? 1;
    Promise.all([
      api.get('/courses', { params: { levelId: lvlId } }),
      api.get('/sessions'),
    ])
      .then(([cRes, sRes]) => {
        setTotalCourses(Math.max(cRes.data.length, CRITERIA.courses));
        const attended = (sRes.data ?? []).filter(
          (s) => s.attended || s.status === 'ENDED',
        ).length;
        setSessionsAttended(attended);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userLevel]);

  // ── Calcul des métriques ──────────────────────────────────────────────────
  const completedCourses = Object.values(courseProgress).filter((p) => p.completed).length;
  const coursesPct = Math.min(100, Math.round((completedCourses / CRITERIA.courses) * 100));

  const qcmAvg =
    qcmAttempts.length > 0
      ? Math.round(
          qcmAttempts.reduce((s, a) => s + (a.percentage ?? (a.score / a.total) * 100), 0) /
            qcmAttempts.length,
        )
      : 0;
  const qcmPct = Math.min(100, Math.round((qcmAvg / CRITERIA.qcmAvg) * 100));

  const sessionsPct = Math.min(100, Math.round((sessionsAttended / CRITERIA.sessions) * 100));

  const totalGamesPlayed = Object.values(gameStats).reduce((s, g) => s + (g.played ?? 0), 0);
  const gamesPct = Math.min(100, Math.round((totalGamesPlayed / CRITERIA.games) * 100));

  const globalPct = Math.round((coursesPct + qcmPct + sessionsPct + gamesPct) / 4);

  const criteria = [
    {
      label: 'Cours terminés',
      icon: '📖',
      pct: coursesPct,
      detail: `${completedCourses} / ${CRITERIA.courses} cours`,
      done: completedCourses >= CRITERIA.courses,
    },
    {
      label: 'Score QCM moyen',
      icon: '🎯',
      pct: qcmPct,
      detail: `${qcmAvg}% obtenu · ${CRITERIA.qcmAvg}% requis`,
      done: qcmAvg >= CRITERIA.qcmAvg,
    },
    {
      label: 'Sessions live',
      icon: '📡',
      pct: sessionsPct,
      detail: `${sessionsAttended} / ${CRITERIA.sessions} sessions`,
      done: sessionsAttended >= CRITERIA.sessions,
    },
    {
      label: 'Exercices réalisés',
      icon: '🎮',
      pct: gamesPct,
      detail: `${totalGamesPlayed} / ${CRITERIA.games} exercices`,
      done: totalGamesPlayed >= CRITERIA.games,
    },
  ];

  const doneCriteria = criteria.filter((c) => c.done).length;
  const levelComplete = doneCriteria === criteria.length;

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ma progression</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={COLORS.gold} size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Carte héros ── */}
          <LinearGradient
            colors={[color + '22', color + '06']}
            style={styles.heroCard}
          >
            <View style={styles.heroTop}>
              {/* Infos niveau */}
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>NIVEAU EN COURS</Text>
                <Text style={[styles.heroLevel, { color }]}>{userLevel}</Text>
                <Text style={styles.heroSublabel}>{LEVEL_LABELS[userLevel]}</Text>
                {nextLevel && (
                  <Text style={styles.nextLevelHint}>
                    Prochain : <Text style={{ color }}>{nextLevel}</Text>
                  </Text>
                )}
              </View>
              {/* Cercle SVG */}
              <CircularProgress
                size={120}
                strokeWidth={9}
                percent={globalPct}
                color={color}
              />
            </View>

            {/* Bandeau objectif */}
            {levelComplete ? (
              <View style={[styles.goalBanner, { backgroundColor: '#10B98120', borderColor: '#10B98155' }]}>
                <Text style={{ fontSize: 18 }}>🏆</Text>
                <Text style={[styles.goalText, { color: '#10B981' }]}>
                  Niveau {userLevel} complété ! Certificat disponible
                </Text>
              </View>
            ) : (
              <View style={[styles.goalBanner, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                <Text style={{ fontSize: 16 }}>🎯</Text>
                <Text style={[styles.goalText, { color }]}>
                  {doneCriteria}/{criteria.length} critères atteints
                  {nextLevel ? `  ·  Objectif : ${nextLevel}` : ''}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* ── Critères de passage ── */}
          <Text style={styles.sectionTitle}>CRITÈRES DE PASSAGE</Text>
          {criteria.map((c) => (
            <CriteriaCard key={c.label} {...c} color={color} />
          ))}

          {/* ── Parcours CECRL ── */}
          <Text style={styles.sectionTitle}>PARCOURS CECRL</Text>
          <View style={styles.levelsRow}>
            {LEVELS.map((lvl, idx) => {
              const passed  = idx < levelIdx;
              const current = idx === levelIdx;
              const locked  = idx > levelIdx;
              const c2 = LEVEL_COLORS[lvl];
              return (
                <View key={lvl} style={styles.levelStep}>
                  <View style={[
                    styles.levelDot,
                    { borderColor: c2 },
                    passed  && { backgroundColor: c2 },
                    current && { backgroundColor: c2, transform: [{ scale: 1.2 }] },
                    locked  && { opacity: 0.3 },
                  ]}>
                    <Text style={[styles.levelDotText, { color: (passed || current) ? '#fff' : c2 }]}>
                      {passed ? '✓' : lvl}
                    </Text>
                  </View>
                  {idx < LEVELS.length - 1 && (
                    <View style={[styles.connector, passed && { backgroundColor: c2 }]} />
                  )}
                </View>
              );
            })}
          </View>

          {/* ── Stats mini-jeux ── */}
          <Text style={styles.sectionTitle}>STATISTIQUES EXERCICES</Text>
          <View style={styles.statsGrid}>
            {Object.entries(gameStats).map(([key, val]) => {
              const pct = val.played > 0 ? Math.round((val.correct / val.played) * 100) : 0;
              return (
                <View key={key} style={styles.statCard}>
                  <Text style={styles.statValue}>{pct}%</Text>
                  <Text style={styles.statLabel}>{GAME_LABELS[key] ?? key}</Text>
                  <Text style={styles.statSub}>{val.played} parties</Text>
                </View>
              );
            })}
          </View>

          {/* ── QCM — historique récent ── */}
          {qcmAttempts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>DERNIERS QCM</Text>
              {qcmAttempts.slice(-3).reverse().map((a, i) => (
                <View key={i} style={styles.qcmRow}>
                  <Text style={styles.qcmIcon}>📝</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qcmScore}>
                      {a.score} / {a.total} questions
                    </Text>
                    <Text style={styles.qcmDate}>
                      {new Date(a.date).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short',
                      })}
                    </Text>
                  </View>
                  <Text style={[
                    styles.qcmPct,
                    { color: a.percentage >= 70 ? '#10B981' : COLORS.warning },
                  ]}>
                    {a.percentage}%
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* ── Bouton certificat ── */}
          {levelComplete && (
            <TouchableOpacity
              style={[styles.certBtn, { backgroundColor: color }]}
              onPress={() => navigation?.navigate('Profile')}
              activeOpacity={0.85}
            >
              <Text style={styles.certBtnText}>🏆  VOIR MON CERTIFICAT</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  backBtn: { padding: 4 },
  backText: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 26 },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 17 },

  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 18 },

  // ── Héros ──
  heroCard: {
    borderRadius: 16, padding: 20, marginBottom: 26,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  heroLabel: {
    fontFamily: FONTS.uiBold, color: COLORS.muted,
    fontSize: 10, letterSpacing: 2, marginBottom: 4,
  },
  heroLevel: { fontFamily: FONTS.displayBold, fontSize: 52, lineHeight: 56 },
  heroSublabel: {
    fontFamily: FONTS.regular, color: COLORS.muted,
    fontSize: 13, fontStyle: 'italic',
  },
  nextLevelHint: {
    fontFamily: FONTS.ui, color: COLORS.muted,
    fontSize: 12, marginTop: 6,
  },
  goalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 12, borderWidth: 1,
  },
  goalText: { fontFamily: FONTS.uiBold, fontSize: 13, flex: 1 },

  // ── Section ──
  sectionTitle: {
    fontFamily: FONTS.uiBold, color: COLORS.gold,
    fontSize: 10, letterSpacing: 2.5, marginBottom: 12, marginTop: 4,
  },

  // ── Critères ──
  criteriaCard: {
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  criteriaCardDone: {
    borderColor: '#10B98145',
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  criteriaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  criteriaIcon: { fontSize: 22, marginTop: 2 },
  criteriaTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 3,
  },
  criteriaLabel: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  criteriaPct: { fontFamily: FONTS.uiBold, fontSize: 13 },
  doneBadge: {
    backgroundColor: '#10B98120', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: '#10B98150',
  },
  doneBadgeText: { fontFamily: FONTS.uiBold, color: '#10B981', fontSize: 11 },
  criteriaDetail: {
    fontFamily: FONTS.regular, color: COLORS.muted,
    fontSize: 12, marginBottom: 8,
  },
  barTrack: {
    height: 5, backgroundColor: 'rgba(126,102,58,0.2)',
    borderRadius: 3, overflow: 'hidden',
  },
  barFill: { height: 5, borderRadius: 3 },

  // ── Parcours ──
  levelsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 26, paddingHorizontal: 2,
  },
  levelStep: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  levelDot: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  levelDotText: { fontFamily: FONTS.uiBold, fontSize: 10 },
  connector: {
    flex: 1, height: 2,
    backgroundColor: 'rgba(126,102,58,0.2)', marginHorizontal: 2,
  },

  // ── Stats jeux ──
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24,
  },
  statCard: {
    width: '31%', backgroundColor: 'rgba(245,239,227,0.06)',
    borderRadius: 10, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  statValue: {
    fontFamily: FONTS.displayBold, color: COLORS.parchment,
    fontSize: 22, marginBottom: 2,
  },
  statLabel: {
    fontFamily: FONTS.uiBold, color: COLORS.cream,
    fontSize: 10, textAlign: 'center',
  },
  statSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, marginTop: 2 },

  // ── Historique QCM ──
  qcmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)',
  },
  qcmIcon: { fontSize: 20 },
  qcmScore: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13 },
  qcmDate: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginTop: 2 },
  qcmPct: { fontFamily: FONTS.displayBold, fontSize: 18 },

  // ── Bouton certificat ──
  certBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  certBtnText: { fontFamily: FONTS.uiBold, color: '#fff', fontSize: 13, letterSpacing: 1.5 },
});
