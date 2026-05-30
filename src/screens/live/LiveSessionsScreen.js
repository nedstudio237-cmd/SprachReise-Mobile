import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';

const SESSIONS = [
  {
    id: 1,
    title: 'Grammaire A1 — Les articles',
    trainer: 'Dr. Emma Nguema',
    level: 'A1',
    date: 'Aujourd\'hui',
    time: '18:00',
    duration: '60 min',
    spots: 3,
    status: 'live',
  },
  {
    id: 2,
    title: 'Conversation quotidienne — A2',
    trainer: 'Hans Becker',
    level: 'A2',
    date: 'Demain',
    time: '10:00',
    duration: '90 min',
    spots: 8,
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'Vocabulaire professionnel — B1',
    trainer: 'Marie Dubois',
    level: 'B1',
    date: 'Ven. 30 mai',
    time: '17:30',
    duration: '60 min',
    spots: 12,
    status: 'upcoming',
  },
  {
    id: 4,
    title: 'Expression écrite — B2',
    trainer: 'Dr. Klaus Weber',
    level: 'B2',
    date: 'Sam. 31 mai',
    time: '09:00',
    duration: '120 min',
    spots: 0,
    status: 'full',
  },
  {
    id: 5,
    title: 'Prononciation & phonétique',
    trainer: 'Sophie Martin',
    level: 'A1',
    date: 'Lun. 2 juin',
    time: '16:00',
    duration: '45 min',
    spots: 15,
    status: 'upcoming',
  },
  {
    id: 6,
    title: 'Culture & civilisation allemande',
    trainer: 'Prof. Anna Schmidt',
    level: 'B1',
    date: 'Mar. 3 juin',
    time: '19:00',
    duration: '90 min',
    spots: 20,
    status: 'upcoming',
  },
];

const LEVELS_FILTER = ['Tous', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function LiveSessionsScreen() {
  const [activeFilter, setActiveFilter] = useState('Tous');

  const filtered = activeFilter === 'Tous'
    ? SESSIONS
    : SESSIONS.filter((s) => s.level === activeFilter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Sessions Live</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>En direct</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {LEVELS_FILTER.map((lvl) => (
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

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SessionCard({ session }) {
  const isLive = session.status === 'live';
  const isFull = session.status === 'full';

  return (
    <View style={[styles.card, isLive && styles.cardLive]}>
      <View style={styles.cardTop}>
        <View style={styles.meta}>
          <View style={[styles.levelBadge, isLive && styles.levelBadgeLive]}>
            <Text style={styles.levelBadgeText}>{session.level}</Text>
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
        <Text style={styles.duration}>{session.duration}</Text>
      </View>

      <Text style={styles.sessionTitle}>{session.title}</Text>
      <Text style={styles.trainer}>{session.trainer}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.timeBlock}>
          <Text style={styles.dateText}>{session.date} · {session.time}</Text>
          {!isFull && (
            <Text style={styles.spotsText}>
              {isLive ? 'Rejoindre maintenant' : `${session.spots} place${session.spots > 1 ? 's' : ''} restante${session.spots > 1 ? 's' : ''}`}
            </Text>
          )}
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

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  screenTitle: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 28,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveLabel: {
    fontFamily: FONTS.uiBold,
    color: '#EF4444',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  filterBar: { maxHeight: 48, marginTop: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(245,239,227,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.25)',
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterText: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.muted,
    fontSize: 13,
  },
  filterTextActive: { color: COLORS.parchment },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  card: {
    backgroundColor: 'rgba(245,239,227,0.06)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.25)',
  },
  cardLive: {
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    backgroundColor: 'rgba(184,137,58,0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelBadgeLive: { backgroundColor: 'rgba(239,68,68,0.15)' },
  levelBadgeText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  livePillDot: {
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
  fullPill: {
    backgroundColor: 'rgba(126,102,58,0.15)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  fullPillText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  duration: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 12,
  },

  sessionTitle: {
    fontFamily: FONTS.bold,
    color: COLORS.parchment,
    fontSize: 16,
    marginBottom: 4,
    lineHeight: 22,
  },
  trainer: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 14,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  timeBlock: { flex: 1 },
  dateText: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.cream,
    fontSize: 12,
    marginBottom: 2,
  },
  spotsText: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 11,
  },

  actionBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 5,
    marginLeft: 12,
  },
  actionBtnLive: { backgroundColor: '#DC2626' },
  actionBtnFull: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.3)',
  },
  actionBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 11,
    letterSpacing: 1,
  },
  actionBtnTextFull: { color: COLORS.muted },
});
