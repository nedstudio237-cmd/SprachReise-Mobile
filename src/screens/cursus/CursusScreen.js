import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const LEVEL_IDS = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:6 };

export default function CursusScreen({ navigation }) {
  const { level, qcmAttempts, gameStats } = useAuthStore();
  const userLevel = level ?? 'A1';

  const [qcms, setQcms] = useState([]);
  const [loadingQcm, setLoadingQcm] = useState(true);

  useEffect(() => {
    api.get('/qcm', { params: { levelId: LEVEL_IDS[userLevel] ?? 1 } })
      .then(({ data }) => setQcms(data))
      .catch(() => {})
      .finally(() => setLoadingQcm(false));
  }, [userLevel]);

  const qcmAvg = qcmAttempts.length > 0
    ? Math.round(qcmAttempts.reduce((s, a) => s + a.percentage, 0) / qcmAttempts.length)
    : null;

  const wmPlayed  = gameStats.wordMatch.played;
  const wmCorrect = gameStats.wordMatch.correct;
  const fbPlayed  = gameStats.fillBlank.played;
  const fbCorrect = gameStats.fillBlank.correct;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.heading}>Cursus</Text>
          <Text style={styles.sub}>Entraînez-vous et progressez — niveau {userLevel}</Text>
        </View>

        {/* ── Stats rapides ── */}
        <View style={styles.statsRow}>
          <MiniStat icon="✏️" label="QCM passés" value={`${qcmAttempts.length}`} />
          <MiniStat icon="📊" label="Score moyen" value={qcmAvg !== null ? `${qcmAvg}%` : '—'} />
          <MiniStat icon="🎮" label="Jeux joués" value={`${wmPlayed + fbPlayed}`} />
        </View>

        {/* ── QCMs ── */}
        <Text style={styles.sectionLabel}>QCM DE NIVEAU — {userLevel}</Text>
        {loadingQcm ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
        ) : qcms.length === 0 ? (
          <Text style={styles.emptyText}>Aucun QCM disponible pour ce niveau.</Text>
        ) : (
          <View style={styles.qcmGrid}>
            {qcms.map((q) => {
              const attempts = qcmAttempts.filter((a) => a.qcmId === q.id);
              const best     = attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : null;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={styles.qcmCard}
                  onPress={() => navigation?.navigate('Qcm', { qcmId: q.id, levelId: LEVEL_IDS[userLevel] })}
                  activeOpacity={0.82}
                >
                  <View style={styles.qcmTop}>
                    <Text style={styles.qcmTheme}>{q.theme ?? 'Général'}</Text>
                    {best !== null && (
                      <View style={[styles.bestBadge, { backgroundColor: best >= 70 ? '#10B98120' : '#F59E0B20' }]}>
                        <Text style={[styles.bestText, { color: best >= 70 ? '#10B981' : '#F59E0B' }]}>
                          {best}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.qcmTitle}>{q.title}</Text>
                  <Text style={styles.qcmMeta}>
                    {q.questions?.length ?? '—'} questions
                    {attempts.length > 0 ? ` · ${attempts.length} tentative${attempts.length > 1 ? 's' : ''}` : ''}
                  </Text>
                  <View style={styles.qcmStartRow}>
                    <Text style={styles.qcmStartBtn}>
                      {attempts.length > 0 ? 'RECOMMENCER' : 'COMMENCER'} ›
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Mini-jeux ── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>MINI-JEUX</Text>

        {/* Jeux vocabulaire/grammaire */}
        <GameCard emoji="🃏" title="Association de mots" desc="Mot allemand → traduction française"
          color="#B8893A" tag="Vocabulaire" level={userLevel}
          onPress={() => navigation?.navigate('WordMatch')} />
        <GameCard emoji="✏️" title="Compléter la phrase" desc="Choisissez le mot manquant"
          color="#8B5CF6" tag="Grammaire" level={userLevel}
          onPress={() => navigation?.navigate('FillBlank')} />

        {/* Exercices audio */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>EXERCICES AUDIO 🎧</Text>
        <GameCard emoji="🔊" title="Écoute & Choisis" desc="Écoute la phrase, trouve la bonne traduction"
          color="#3B82F6" tag="Écoute" level={userLevel}
          onPress={() => navigation?.navigate('ListenChoose')} />
        <GameCard emoji="📝" title="Dictée" desc="Écoute et écris ce que tu entends"
          color="#10B981" tag="Compréhension" level={userLevel}
          onPress={() => navigation?.navigate('Dictee')} />
        <GameCard emoji="🎤" title="Prononciation" desc="Écoute, répète et évalue ta prononciation"
          color="#EC4899" tag="Expression orale" level={userLevel}
          onPress={() => navigation?.navigate('Pronounce')} />
        <GameCard emoji="🃏" title="Ordre des mots" desc="Écoute et remets les mots dans le bon ordre"
          color="#F59E0B" tag="Structure" level={userLevel}
          onPress={() => navigation?.navigate('WordOrder')} />

      </ScrollView>
    </SafeAreaView>
  );
}

function GameCard({ emoji, title, desc, color, tag, level, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.gameCard, { borderColor: color + '40', backgroundColor: color + '0D' }]}
      onPress={onPress} activeOpacity={0.82}
    >
      <View style={styles.gameCardInner}>
        <Text style={styles.gameEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.gameTitle}>{title}</Text>
          <Text style={styles.gameDesc}>{desc}</Text>
        </View>
        <Text style={[styles.gameArrow, { color }]}>›</Text>
      </View>
      <View style={styles.gameTags}>
        <View style={[styles.gameTag, { backgroundColor: color + '20' }]}>
          <Text style={[styles.gameTagText, { color }]}>{tag}</Text>
        </View>
        <View style={styles.gameTag}><Text style={styles.gameTagText}>{level}</Text></View>
      </View>
    </TouchableOpacity>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatIcon}>{icon}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 24, marginBottom: 18 },
  heading: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 28, marginBottom: 4 },
  sub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, fontStyle: 'italic' },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, textAlign: 'center', marginVertical: 16, fontStyle: 'italic' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  miniStat: {
    flex: 1, backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(126,102,58,0.18)',
  },
  miniStatIcon: { fontSize: 20, marginBottom: 4 },
  miniStatValue: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 20, marginBottom: 2 },
  miniStatLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, textAlign: 'center' },

  sectionLabel: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 12 },

  qcmGrid: { gap: 12 },
  qcmCard: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 16, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  qcmTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  qcmTheme: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 1 },
  bestBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  bestText: { fontFamily: FONTS.uiBold, fontSize: 12 },
  qcmTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 15, marginBottom: 4 },
  qcmMeta: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12, marginBottom: 10 },
  qcmStartRow: { alignItems: 'flex-end' },
  qcmStartBtn: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 12, letterSpacing: 1 },

  gameCard: {
    borderRadius: 12, padding: 18, marginBottom: 14,
    borderWidth: 1,
  },
  gameCardGold: { backgroundColor: 'rgba(184,137,58,0.08)', borderColor: 'rgba(184,137,58,0.25)' },
  gameCardPurple: { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.25)' },
  gameCardInner: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gameEmoji: { fontSize: 36, marginRight: 14 },
  gameTitle: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 17, marginBottom: 4 },
  gameDesc: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 13, lineHeight: 18 },
  gameStat: { fontFamily: FONTS.uiMedium, color: COLORS.gold, fontSize: 11, marginTop: 4 },
  gameArrow: { color: COLORS.gold, fontSize: 24, marginLeft: 8 },
  gameTags: { flexDirection: 'row', gap: 8 },
  gameTag: {
    backgroundColor: 'rgba(245,239,227,0.08)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  gameTagText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 11 },
});
