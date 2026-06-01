import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const LEVEL_COLORS = { A1:'#10B981', A2:'#3B82F6', B1:'#8B5CF6', B2:'#F59E0B', C1:'#EC4899', C2:'#EF4444' };

function StatCard({ icon, value, label, color = COLORS.gold }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function TrainerDashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/trainers/me'),
      api.get('/courses/mine'),
      api.get('/sessions/mine'),
    ]).then(([pRes, cRes, sRes]) => {
      setProfile(pRes.data);
      setCourses(cRes.data ?? []);
      setSessions(sRes.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const levelCode = profile?.assignedLevelCode ?? '—';
  const levelColor = LEVEL_COLORS[levelCode] ?? COLORS.accent;
  const upcomingSessions = sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'LIVE');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>TABLEAU DE BORD</Text>
          <Text style={styles.headerTitle}>Bonjour, {user?.firstName} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.navigate('Messages')}>
          <Text style={{ fontSize: 26 }}>💬</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Badge niveau */}
          <LinearGradient colors={[levelColor + '25', levelColor + '08']} style={styles.levelCard}>
            <View>
              <Text style={styles.levelLabel}>NIVEAU ENSEIGNÉ</Text>
              <Text style={[styles.levelCode, { color: levelColor }]}>{levelCode}</Text>
            </View>
            <View style={styles.quotaWrap}>
              <Text style={[styles.quotaNum, { color: levelColor }]}>
                {profile?.currentStudents ?? 0}
              </Text>
              <Text style={styles.quotaOf}>/ {profile?.maxStudents ?? 30}</Text>
              <Text style={styles.quotaLabel}>apprenants</Text>
            </View>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard icon="📚" value={courses.length} label="Cours publiés" />
            <StatCard icon="📡" value={upcomingSessions.length} label="Sessions à venir" color={COLORS.accent} />
            <StatCard icon="⭐" value={profile?.ratingAvg ?? '—'} label="Note moy." color='#FFD700' />
          </View>

          {/* Accès rapides */}
          <Text style={styles.sectionTitle}>ACTIONS RAPIDES</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: '📹', label: 'Nouveau cours',    screen: 'CreateCourse' },
              { icon: '📡', label: 'Nouvelle session', screen: 'CreateSession' },
              { icon: '✏️', label: 'Nouveau QCM',      screen: 'CreateQcm' },
              { icon: '📝', label: 'Épreuves',         screen: 'TrainerExams' },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionCard}
                onPress={() => navigation?.navigate(a.screen)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>{a.icon}</Text>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sessions à venir */}
          {upcomingSessions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>SESSIONS À VENIR</Text>
              {upcomingSessions.slice(0, 3).map((s) => (
                <View key={s.id} style={styles.sessionRow}>
                  <View style={[styles.sessionDot, s.status === 'LIVE' && { backgroundColor: '#E63946' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionTitle}>{s.title}</Text>
                    <Text style={styles.sessionDate}>
                      {s.scheduledStart ? new Date(s.scheduledStart).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  {s.status === 'LIVE' && <Text style={styles.liveBadge}>● LIVE</Text>}
                </View>
              ))}
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  headerSub: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 10, letterSpacing: 2 },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  levelCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  levelLabel: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  levelCode: { fontFamily: FONTS.displayBold, fontSize: 44, lineHeight: 48 },
  quotaWrap: { alignItems: 'center' },
  quotaNum: { fontFamily: FONTS.displayBold, fontSize: 36 },
  quotaOf: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 14 },
  quotaLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontFamily: FONTS.displayBold, fontSize: 24, marginBottom: 2 },
  statLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, textAlign: 'center' },

  sectionTitle: {
    fontFamily: FONTS.uiBold, color: COLORS.gold,
    fontSize: 10, letterSpacing: 2.5, marginBottom: 12,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: {
    width: '47%', backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 10,
    padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 12, textAlign: 'center' },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(245,239,227,0.05)', borderRadius: 10,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)',
  },
  sessionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  sessionTitle: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13 },
  sessionDate: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginTop: 2 },
  liveBadge: { fontFamily: FONTS.uiBold, color: '#E63946', fontSize: 11 },
});
