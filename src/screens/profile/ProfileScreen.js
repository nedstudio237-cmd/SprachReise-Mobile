import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

const LEVEL_CODES = ['A1','A2','B1','B2','C1','C2'];
const LEVEL_LABELS = { A1:'Débutant', A2:'Élémentaire', B1:'Intermédiaire', B2:'Avancé', C1:'Autonome', C2:'Maîtrise' };
const LEVEL_COLORS = { A1:'#10B981', A2:'#3B82F6', B1:'#8B5CF6', B2:'#F59E0B', C1:'#EC4899', C2:'#EF4444' };
// Critères pour passer au niveau suivant
const LEVEL_CRITERIA = { courses: 4, qcmAvg: 70, sessions: 2 };

export default function ProfileScreen({ navigation }) {
  const { user, level, language, sublevel, courseProgress, qcmAttempts, gameStats, logout } = useAuthStore();

  const initial  = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '');
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Apprenant';

  // Stats calculées
  const completedCourses = Object.values(courseProgress).filter((p) => p.completed).length;
  const qcmCount    = qcmAttempts.length;
  const qcmAvg      = qcmCount > 0
    ? Math.round(qcmAttempts.reduce((s, a) => s + a.percentage, 0) / qcmCount)
    : 0;
  const gamesPlayed = (gameStats.wordMatch.played + gameStats.fillBlank.played);
  const gamesCorrect= (gameStats.wordMatch.correct + gameStats.fillBlank.correct);

  // Progression vers prochain niveau
  const coursesPct  = Math.min(100, Math.round((completedCourses / LEVEL_CRITERIA.courses) * 100));
  const qcmPct      = Math.min(100, qcmAvg);
  const overallPct  = Math.round((coursesPct + qcmPct) / 2);

  const levelColor  = LEVEL_COLORS[level ?? 'A1'] ?? COLORS.accent;
  const levelIdx    = LEVEL_CODES.indexOf(level ?? 'A1');
  const nextLevel   = levelIdx < 5 ? LEVEL_CODES[levelIdx + 1] : null;

  const LANG_FLAGS  = { de:'🇩🇪', en:'🇬🇧', es:'🇪🇸', zh:'🇨🇳' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { borderColor: levelColor }]}>
            <Text style={styles.avatarText}>{initial.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.levelTag, { backgroundColor: levelColor + '25', borderColor: levelColor + '60' }]}>
              <Text style={[styles.levelTagText, { color: levelColor }]}>{level ?? 'A1'}</Text>
            </View>
            <View style={styles.langTag}>
              <Text style={styles.langTagText}>{LANG_FLAGS[language ?? 'de']} {language?.toUpperCase() ?? 'DE'}</Text>
            </View>
            {sublevel && (
              <View style={styles.sublevelTag}>
                <Text style={styles.sublevelTagText}>{sublevel}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stats rapides ── */}
        <View style={styles.statsRow}>
          <StatCard icon="📖" label="Cours terminés" value={`${completedCourses}`} />
          <StatCard icon="✏️" label="QCM passés"     value={`${qcmCount}`} />
          <StatCard icon="🎮" label="Jeux joués"     value={`${gamesPlayed}`} />
        </View>

        {/* ── Progression vers niveau suivant ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardLabel}>PROGRESSION NIVEAU</Text>
              <Text style={styles.progressCardLevel}>
                {level ?? 'A1'} → {nextLevel ?? '✓ C2'}
              </Text>
            </View>
            <View style={[styles.progressCircle, { borderColor: levelColor }]}>
              <Text style={[styles.progressCircleText, { color: levelColor }]}>{overallPct}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${overallPct}%`, backgroundColor: levelColor }]} />
          </View>

          {/* Critères */}
          <View style={styles.criteriaRow}>
            <CriteriaChip
              label={`${completedCourses}/${LEVEL_CRITERIA.courses} cours`}
              done={completedCourses >= LEVEL_CRITERIA.courses} color={levelColor} />
            <CriteriaChip
              label={`QCM moy. ${qcmAvg}% / 70%`}
              done={qcmAvg >= LEVEL_CRITERIA.qcmAvg} color={levelColor} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.progressDetailBtn}
          onPress={() => navigation?.navigate('Progress')}
          activeOpacity={0.85}
        >
          <Text style={styles.progressDetailBtnText}>📈  Voir ma progression détaillée →</Text>
        </TouchableOpacity>

        {/* ── Stats détaillées ── */}
        <Text style={styles.sectionLabel}>MES STATISTIQUES</Text>
        <View style={styles.detailGrid}>
          <DetailStat label="Score moyen QCM"  value={qcmCount > 0 ? `${qcmAvg}%` : '—'} icon="📊" />
          <DetailStat label="Meilleur QCM"
            value={qcmCount > 0 ? `${Math.max(...qcmAttempts.map((a) => a.percentage))}%` : '—'} icon="🏆" />
          <DetailStat label="Bonnes réponses jeux"
            value={gamesPlayed > 0 ? `${gamesCorrect}/${gamesPlayed}` : '—'} icon="🎯" />
          <DetailStat label="Précision jeux"
            value={gamesPlayed > 0 ? `${Math.round((gamesCorrect/gamesPlayed)*100)}%` : '—'} icon="🎮" />
        </View>

        {/* ── QCM récents ── */}
        {qcmAttempts.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>DERNIERS QCM</Text>
            <View style={styles.menu}>
              {qcmAttempts.slice(-3).reverse().map((a, i) => (
                <View key={i} style={styles.qcmRow}>
                  <View style={[styles.qcmScore, { backgroundColor: a.percentage >= 70 ? '#10B98120' : '#EF444420' }]}>
                    <Text style={[styles.qcmScoreText, { color: a.percentage >= 70 ? '#10B981' : '#EF4444' }]}>
                      {a.percentage}%
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qcmLabel}>{a.score}/{a.total} bonnes réponses</Text>
                    <Text style={styles.qcmDate}>
                      {new Date(a.date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                    </Text>
                  </View>
                  <Text style={styles.qcmStatus}>{a.percentage >= 70 ? '✓' : '✗'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Tuteur IA ── */}
        <Text style={styles.sectionLabel}>TUTEUR IA</Text>
        <View style={styles.menu}>
          <MenuItem label="Historique des conversations" icon="🕐"
            onPress={() => navigation?.navigate('ChatHistory')} />
          <MenuItem label="Nouvelle conversation" icon="🤖"
            onPress={() => navigation?.navigate('AiTutor')} />
        </View>

        {/* ── Mon compte ── */}
        <Text style={styles.sectionLabel}>MON COMPTE</Text>
        <View style={styles.menu}>
          <MenuItem label="Mon abonnement" icon="💎" badge="STANDARD" />
          <MenuItem label="Mes certificats" icon="📜" />
          <MenuItem label="Paramètres de langue" icon="🌐"
            badge={`${LANG_FLAGS[language ?? 'de']} ${(language ?? 'de').toUpperCase()}`} />
        </View>

        <Text style={styles.sectionLabel}>AIDE</Text>
        <View style={styles.menu}>
          <MenuItem label="Notifications" icon="🔔" />
          <MenuItem label="Aide & Support"  icon="💬" />
          <MenuItem label="À propos"        icon="ℹ️" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>
        <Text style={styles.version}>SprachReise v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailStat({ label, value, icon }) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

function CriteriaChip({ label, done, color }) {
  return (
    <View style={[styles.criteriaChip, done && { backgroundColor: color + '20', borderColor: color + '60' }]}>
      <Text style={[styles.criteriaText, done && { color }]}>{done ? '✓ ' : ''}{label}</Text>
    </View>
  );
}

function MenuItem({ label, icon, badge, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconWrap}><Text style={styles.menuIcon}>{icon}</Text></View>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge && <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{badge}</Text></View>}
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingTop: 28, marginBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, borderWidth: 3,
  },
  avatarText: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 28 },
  name: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 22, marginBottom: 3 },
  email: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  levelTag: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  levelTagText: { fontFamily: FONTS.uiBold, fontSize: 12 },
  langTag: { backgroundColor: 'rgba(245,239,227,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(126,102,58,0.3)' },
  langTagText: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 12 },
  sublevelTag: { backgroundColor: 'rgba(126,102,58,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  sublevelTagText: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 20, marginBottom: 2 },
  statLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, textAlign: 'center' },

  progressCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 18, marginBottom: 20 },
  progressCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  progressCardLabel: { fontFamily: FONTS.uiBold, color: 'rgba(249,244,232,0.6)', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  progressCardLevel: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 18 },
  progressCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progressCircleText: { fontFamily: FONTS.uiBold, fontSize: 13 },
  progressBar: { height: 5, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3, marginBottom: 12 },
  progressFill: { height: 5, borderRadius: 3 },
  progressDetailBtn: {
    backgroundColor: 'rgba(184,137,58,0.12)',
    borderRadius: 10, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)',
    alignItems: 'center',
  },
  progressDetailBtnText: {
    fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13, letterSpacing: 0.5,
  },
  criteriaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  criteriaChip: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(245,239,227,0.08)', borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)',
  },
  criteriaText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 11 },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  detailCard: {
    width: '47%', backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)',
  },
  detailIcon: { fontSize: 20, marginBottom: 6 },
  detailValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 20, marginBottom: 3 },
  detailLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, textAlign: 'center' },

  qcmRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.1)',
  },
  qcmScore: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  qcmScoreText: { fontFamily: FONTS.displayBold, fontSize: 16 },
  qcmLabel: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13, marginBottom: 2 },
  qcmDate: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  qcmStatus: { fontSize: 18, marginLeft: 8 },

  sectionLabel: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  menu: {
    backgroundColor: 'rgba(245,239,227,0.04)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)', marginBottom: 20, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.1)',
  },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(126,102,58,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuIcon: { fontSize: 16 },
  menuLabel: { flex: 1, fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  menuBadge: { backgroundColor: 'rgba(184,137,58,0.2)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  menuBadgeText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 0.5 },
  menuArrow: { color: COLORS.muted, fontSize: 20 },
  logoutBtn: { borderWidth: 1, borderColor: 'rgba(161,94,45,0.5)', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  logoutText: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 13, letterSpacing: 1 },
  version: { fontFamily: FONTS.ui, color: 'rgba(174,145,130,0.4)', fontSize: 12, textAlign: 'center', marginBottom: 8 },
});
