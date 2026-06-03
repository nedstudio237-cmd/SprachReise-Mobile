import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      + '\n' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function StatusBadge({ status }) {
  const cfg = {
    LIVE:      { label: '● EN DIRECT', bg: 'rgba(239,68,68,0.18)', color: '#EF4444' },
    SCHEDULED: { label: '◷ PROGRAMMÉ',  bg: 'rgba(184,137,58,0.18)', color: COLORS.gold },
    ENDED:     { label: '✓ TERMINÉ',    bg: 'rgba(100,116,139,0.18)', color: '#94A3B8' },
    CANCELLED: { label: '✕ ANNULÉ',    bg: 'rgba(100,116,139,0.12)', color: '#64748B' },
  };
  const c = cfg[status] ?? cfg.SCHEDULED;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export default function LiveSessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/sessions')
      .then(r => { if (!cancelled) setSessions(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (!cancelled) setSessions([]); })
      .finally(() => { if (!cancelled) { setLoading(false); setRefreshing(false); } });
    return () => { cancelled = true; };
  }, []);

  useFocusEffect(fetch);

  const onRefresh = () => { setRefreshing(true); fetch(); };

  const liveCount = sessions.filter(s => s.status === 'LIVE').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sessions Live</Text>
          <Text style={styles.subtitle}>Cours en direct de votre formateur</Text>
        </View>
        {liveCount > 0 && (
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveChipText}>{liveCount} en direct</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={COLORS.accent} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={s => String(s.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="radio-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>Aucune session</Text>
              <Text style={styles.emptyText}>Votre formateur n'a pas encore programmé de session live.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.status === 'LIVE' && styles.cardLive, item.status === 'ENDED' && styles.cardEnded]}
              onPress={() => navigation.navigate('LiveDetail', { sessionId: item.id })}
              activeOpacity={0.82}
            >
              <View style={styles.cardRow}>
                <StatusBadge status={item.status} />
                {item.durationMinutes ? (
                  <Text style={styles.duration}>{item.durationMinutes} min</Text>
                ) : null}
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.trainerName ? (
                <Text style={styles.cardTrainer}>
                  <Ionicons name="person-outline" size={12} color={COLORS.muted} /> {item.trainerName}
                </Text>
              ) : null}
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.muted} />
                  <Text style={styles.dateText}>{formatDate(item.scheduledStart)}</Text>
                </View>
                <View style={[styles.chevron, item.status === 'LIVE' && styles.chevronLive]}>
                  <Ionicons
                    name={item.status === 'LIVE' ? 'play-circle' : item.status === 'ENDED' ? 'stats-chart' : 'chevron-forward'}
                    size={item.status === 'LIVE' ? 20 : 16}
                    color={item.status === 'LIVE' ? '#EF4444' : COLORS.muted}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  header:   { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:    { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 28 },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, marginTop: 3, fontStyle: 'italic' },

  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', marginTop: 4 },
  liveDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EF4444' },
  liveChipText: { fontFamily: FONTS.uiBold, color: '#EF4444', fontSize: 11 },

  list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32, gap: 12 },

  card:      { backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(126,102,58,0.22)' },
  cardLive:  { borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.05)' },
  cardEnded: { borderColor: 'rgba(100,116,139,0.25)', opacity: 0.85 },

  cardRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:  { fontFamily: FONTS.uiBold, fontSize: 10, letterSpacing: 0.5 },
  duration:   { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },

  cardTitle:   { fontFamily: FONTS.bold, color: COLORS.parchment, fontSize: 16, marginBottom: 4, lineHeight: 22 },
  cardTrainer: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginBottom: 6, fontStyle: 'italic' },
  cardDesc:    { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 13, lineHeight: 19, marginBottom: 10, opacity: 0.8 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.12)', paddingTop: 10 },
  dateRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, flex: 1 },
  dateText:   { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 12, lineHeight: 18 },
  chevron:    { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(245,239,227,0.07)', alignItems: 'center', justifyContent: 'center' },
  chevronLive:{ backgroundColor: 'rgba(239,68,68,0.15)' },

  empty:      { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: FONTS.display, color: COLORS.cream, fontSize: 20, fontStyle: 'italic' },
  emptyText:  { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
