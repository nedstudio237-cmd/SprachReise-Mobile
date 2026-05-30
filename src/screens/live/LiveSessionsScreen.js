import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, LEVELS } from '../../constants/config';
import api from '../../services/api';

const LEVEL_IDS = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
const LEVEL_CODES = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };
const FILTER_LEVELS = ['Tous', ...LEVELS];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
      + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function LiveSessionsScreen() {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async (level) => {
    try {
      const params = level !== 'Tous' ? { levelId: LEVEL_IDS[level] } : {};
      const { data } = await api.get('/sessions', { params });
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSessions(activeFilter);
  }, [activeFilter, fetchSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions(activeFilter);
  };

  const liveSessions = sessions.filter((s) => s.status === 'LIVE');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Sessions Live</Text>
        <View style={[styles.liveIndicator, liveSessions.length > 0 && styles.liveIndicatorActive]}>
          <View style={[styles.liveDot, liveSessions.length > 0 && styles.liveDotActive]} />
          <Text style={[styles.liveLabel, liveSessions.length > 0 && styles.liveLabelActive]}>
            {liveSessions.length > 0 ? `${liveSessions.length} en direct` : 'À venir'}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_LEVELS.map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.filterChip, activeFilter === lvl && styles.filterChipActive]}
            onPress={() => setActiveFilter(lvl)}
          >
            <Text style={[styles.filterText, activeFilter === lvl && styles.filterTextActive]}>
              {lvl}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        >
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>Aucune session disponible pour ce niveau.</Text>
          ) : (
            sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SessionCard({ session }) {
  const isLive = session.status === 'LIVE';
  const isFull = session.status === 'FULL';
  const levelCode = LEVEL_CODES[session.levelId] ?? '—';

  return (
    <View style={[styles.card, isLive && styles.cardLive]}>
      <View style={styles.cardTop}>
        <View style={styles.meta}>
          <View style={[styles.levelBadge, isLive && styles.levelBadgeLive]}>
            <Text style={styles.levelBadgeText}>{levelCode}</Text>
          </View>
          {isLive && (
            <View style={styles.livePill}>
              <View style={styles.livePillDot} />
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          )}
          {isFull && (
            <View style={styles.fullPill}>
              <Text style={styles.fullPillText}>COMPLET</Text>
            </View>
          )}
        </View>
        {session.durationMinutes ? (
          <Text style={styles.duration}>{session.durationMinutes} min</Text>
        ) : null}
      </View>

      <Text style={styles.sessionTitle}>{session.title}</Text>
      {session.trainerName ? (
        <Text style={styles.trainer}>{session.trainerName}</Text>
      ) : null}
      {session.description ? (
        <Text style={styles.sessionDesc}>{session.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.timeBlock}>
          <Text style={styles.dateText}>{formatDate(session.scheduledStart)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            isLive && styles.actionBtnLive,
            isFull && styles.actionBtnFull,
          ]}
          disabled={isFull}
        >
          <Text style={[styles.actionBtnText, isFull && styles.actionBtnTextFull]}>
            {isLive ? 'REJOINDRE' : isFull ? 'COMPLET' : 'RÉSERVER'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8,
  },
  screenTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 28 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(126,102,58,0.15)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.3)',
  },
  liveIndicatorActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.muted, marginRight: 6 },
  liveDotActive: { backgroundColor: '#EF4444' },
  liveLabel: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 11, letterSpacing: 0.5 },
  liveLabelActive: { color: '#EF4444' },

  filterBar: { maxHeight: 48, marginTop: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(245,239,227,0.07)',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)',
  },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  filterTextActive: { color: COLORS.parchment },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  card: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)',
  },
  cardLive: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.06)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: { backgroundColor: 'rgba(184,137,58,0.2)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  levelBadgeLive: { backgroundColor: 'rgba(239,68,68,0.15)' },
  levelBadgeText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 0.5 },
  livePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3,
  },
  livePillDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444', marginRight: 5 },
  livePillText: { fontFamily: FONTS.uiBold, color: '#EF4444', fontSize: 10, letterSpacing: 0.5 },
  fullPill: { backgroundColor: 'rgba(126,102,58,0.15)', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  fullPillText: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 10, letterSpacing: 0.5 },
  duration: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  sessionTitle: { fontFamily: FONTS.bold, color: COLORS.parchment, fontSize: 16, marginBottom: 3, lineHeight: 22 },
  trainer: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, marginBottom: 4, fontStyle: 'italic' },
  sessionDesc: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 13, lineHeight: 19, marginBottom: 12, opacity: 0.85 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  timeBlock: { flex: 1 },
  dateText: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 12 },
  actionBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 5, marginLeft: 12 },
  actionBtnLive: { backgroundColor: '#DC2626' },
  actionBtnFull: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(126,102,58,0.3)' },
  actionBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 11, letterSpacing: 1 },
  actionBtnTextFull: { color: COLORS.muted },
});
