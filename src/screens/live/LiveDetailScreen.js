import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';
import api from '../../services/api';

function formatDateLong(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function StatBox({ icon, value, label, color = COLORS.accent }) {
  return (
    <View style={s.statBox}>
      <Ionicons name={icon} size={22} color={color} style={{ marginBottom: 6 }} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function LiveDetailScreen({ navigation, route }) {
  const { sessionId } = route.params ?? {};
  const { accessToken } = useAuthStore();

  const [session, setSession] = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data } = await api.get(`/sessions/${sessionId}`);
      setSession(data);

      if (data.status === 'ENDED') {
        try {
          const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/stats`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) setStats(await res.json());
        } catch {}
      }
    } catch {
      Alert.alert('Erreur', 'Session introuvable');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Impossible de rejoindre', data.error || `HTTP ${res.status}`);
        return;
      }
      navigation.navigate('LiveSession', { sessionId, isTrainer: false });
    } catch (e) {
      Alert.alert('Erreur réseau', e.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator style={{ marginTop: 60 }} size="large" color={COLORS.accent} />
    </SafeAreaView>
  );

  if (!session) return null;

  const isLive      = session.status === 'LIVE';
  const isScheduled = session.status === 'SCHEDULED';
  const isEnded     = session.status === 'ENDED';
  const isCancelled = session.status === 'CANCELLED';

  const statusCfg = {
    LIVE:      { label: '● EN DIRECT',  color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    SCHEDULED: { label: '◷ PROGRAMMÉ', color: COLORS.gold, bg: 'rgba(184,137,58,0.15)' },
    ENDED:     { label: '✓ TERMINÉ',   color: '#94A3B8',  bg: 'rgba(100,116,139,0.15)' },
    CANCELLED: { label: '✕ ANNULÉ',   color: '#64748B',  bg: 'rgba(100,116,139,0.1)' },
  };
  const sc = statusCfg[session.status] ?? statusCfg.SCHEDULED;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Bouton retour */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.parchment} />
          <Text style={s.backText}>Sessions live</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={[s.hero, isLive && s.heroLive]}>
          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[s.statusLabel, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Text style={s.heroTitle}>{session.title}</Text>
          {session.trainerName ? (
            <View style={s.trainerRow}>
              <Ionicons name="person-circle-outline" size={16} color={COLORS.muted} />
              <Text style={s.trainerName}>{session.trainerName}</Text>
            </View>
          ) : null}
        </View>

        {/* Infos générales */}
        <View style={s.infoCard}>
          <InfoRow icon="calendar-outline" label="Date & heure" value={formatDateLong(session.scheduledStart)} />
          <View style={s.separator} />
          <InfoRow icon="time-outline" label="Durée prévue" value={`${session.durationMinutes ?? '—'} minutes`} />
          <View style={s.separator} />
          <InfoRow icon="school-outline" label="Niveau" value={session.levelCode ?? '—'} />
          {session.description ? (
            <>
              <View style={s.separator} />
              <View style={s.descBlock}>
                <Text style={s.descLabel}>Description</Text>
                <Text style={s.descText}>{session.description}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* ── État SCHEDULED : message d'attente ─────────────────────────── */}
        {isScheduled && (
          <View style={s.waitCard}>
            <Ionicons name="hourglass-outline" size={32} color={COLORS.gold} />
            <Text style={s.waitTitle}>Session pas encore démarrée</Text>
            <Text style={s.waitText}>
              Votre formateur démarrera la session à l'heure prévue. Vous pourrez la rejoindre dès qu'elle sera en direct.
            </Text>
          </View>
        )}

        {/* ── État CANCELLED ─────────────────────────────────────────────── */}
        {isCancelled && (
          <View style={s.cancelCard}>
            <Ionicons name="close-circle-outline" size={32} color="#64748B" />
            <Text style={s.cancelText}>Cette session a été annulée par le formateur.</Text>
          </View>
        )}

        {/* ── État ENDED : stats ─────────────────────────────────────────── */}
        {isEnded && stats && (
          <View style={s.statsSection}>
            <Text style={s.sectionTitle}>Récapitulatif de la session</Text>
            <View style={s.statsGrid}>
              <StatBox icon="people-outline"    value={stats.totalRegistered ?? 0}    label="Inscrits"        color={COLORS.accent} />
              <StatBox icon="enter-outline"      value={stats.totalJoined ?? 0}         label="Ont rejoint"     color="#10B981" />
              <StatBox icon="checkmark-circle-outline" value={stats.stayedUntilEnd ?? 0} label="Restés jusqu'à la fin" color="#8B5CF6" />
              <StatBox icon="time-outline"       value={`${stats.avgDurationMinutes ?? 0} min`} label="Durée moy." color={COLORS.gold} />
            </View>
            <View style={s.attendanceRow}>
              <Text style={s.attendanceLabel}>Taux de présence</Text>
              <Text style={s.attendanceValue}>{stats.attendanceRate ?? 0}%</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.min(100, stats.attendanceRate ?? 0)}%` }]} />
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── CTA bas de page ─────────────────────────────────────────────── */}
      {isLive && (
        <View style={s.cta}>
          <TouchableOpacity
            style={s.joinBtn}
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.88}
          >
            {joining
              ? <ActivityIndicator color="white" />
              : <>
                  <Ionicons name="play-circle" size={20} color="white" />
                  <Text style={s.joinBtnText}>REJOINDRE LE LIVE</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <Ionicons name={icon} size={16} color={COLORS.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll:    { paddingBottom: 100 },

  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backText: { fontFamily: FONTS.uiMedium, color: COLORS.parchment, fontSize: 14 },

  hero:     { marginHorizontal: 18, marginTop: 8, marginBottom: 16, padding: 22, borderRadius: 14, backgroundColor: 'rgba(245,239,227,0.06)', borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)' },
  heroLive: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.05)' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  statusLabel: { fontFamily: FONTS.uiBold, fontSize: 11, letterSpacing: 0.8 },
  heroTitle:   { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 24, lineHeight: 32, marginBottom: 8 },
  trainerRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trainerName: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic' },

  infoCard:  { marginHorizontal: 18, marginBottom: 16, backgroundColor: 'rgba(245,239,227,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(126,102,58,0.18)', overflow: 'hidden' },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  infoIcon:  { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(126,102,58,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  infoLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 10, letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  separator: { height: 1, backgroundColor: 'rgba(126,102,58,0.1)', marginLeft: 14 },
  descBlock: { padding: 14 },
  descLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 10, letterSpacing: 0.5, marginBottom: 6 },
  descText:  { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 13, lineHeight: 20 },

  waitCard:  { marginHorizontal: 18, padding: 24, backgroundColor: 'rgba(184,137,58,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)', alignItems: 'center', gap: 10 },
  waitTitle: { fontFamily: FONTS.display, color: COLORS.gold, fontSize: 18, fontStyle: 'italic', textAlign: 'center' },
  waitText:  { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  cancelCard: { marginHorizontal: 18, padding: 20, backgroundColor: 'rgba(100,116,139,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)', alignItems: 'center', gap: 8 },
  cancelText: { fontFamily: FONTS.regular, color: '#94A3B8', fontSize: 13, textAlign: 'center' },

  statsSection:   { marginHorizontal: 18, marginBottom: 20 },
  sectionTitle:   { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 18, fontStyle: 'italic', marginBottom: 14 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox:        { flex: 1, minWidth: '44%', backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(126,102,58,0.18)', alignItems: 'center' },
  statValue:      { fontFamily: FONTS.display, fontSize: 28, fontStyle: 'italic', marginBottom: 2 },
  statLabel:      { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 10, letterSpacing: 0.5, textAlign: 'center' },
  attendanceRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  attendanceLabel:{ fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13 },
  attendanceValue:{ fontFamily: FONTS.display, color: COLORS.accent, fontSize: 22, fontStyle: 'italic' },
  progressBar:    { height: 6, backgroundColor: 'rgba(245,239,227,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },

  cta:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.deep, borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)' },
  joinBtn: { backgroundColor: '#DC2626', paddingVertical: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  joinBtnText: { fontFamily: FONTS.uiBold, color: 'white', fontSize: 15, letterSpacing: 1 },
});
