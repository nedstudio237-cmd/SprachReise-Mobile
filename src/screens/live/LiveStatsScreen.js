import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

export default function LiveStatsScreen({ route, navigation }) {
  const { sessionId } = route.params || {};
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/sessions/${sessionId}/stats`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setStats(await r.json());
      } catch {}
      setLoading(false);
    })();
  }, [sessionId]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Stats de la session</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : stats ? (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.sessionName}>{stats.sessionTitle}</Text>
          <Text style={s.sub}>Durée prévue : {stats.scheduledDuration} min</Text>

          <View style={s.grid}>
            <StatCard
              value={stats.totalRegistered}
              label="Inscrits"
              icon="📋"
              color="#3B82F6"
            />
            <StatCard
              value={stats.totalJoined}
              label="Ont rejoint"
              icon="✅"
              color="#10B981"
            />
            <StatCard
              value={stats.stayedUntilEnd}
              label="Restés jusqu'à la fin"
              icon="⏱"
              color={COLORS.gold}
            />
            <StatCard
              value={`${stats.attendanceRate}%`}
              label="Taux de présence"
              icon="📊"
              color="#8B5CF6"
            />
          </View>

          <View style={s.detailBox}>
            <Text style={s.detailTitle}>Détails</Text>
            <DetailRow label="Durée moyenne de connexion" value={`${stats.avgDurationMinutes} min`} />
            <DetailRow label="Absents" value={`${stats.totalRegistered - stats.totalJoined}`} />
            <DetailRow label="Ont quitté avant la fin" value={`${stats.totalJoined - stats.stayedUntilEnd}`} />
          </View>
        </ScrollView>
      ) : (
        <Text style={s.error}>Impossible de charger les statistiques.</Text>
      )}
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon, color }) {
  return (
    <View style={[sc.card, { borderColor: color + '40' }]}>
      <Text style={sc.icon}>{icon}</Text>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { width: '47%', backgroundColor: '#1E2030', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  icon: { fontSize: 28, marginBottom: 8 },
  value: { fontSize: 30, fontFamily: FONTS.bold },
  label: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular, marginTop: 4, textAlign: 'center' },
});

function DetailRow({ label, value }) {
  return (
    <View style={dr.row}>
      <Text style={dr.label}>{label}</Text>
      <Text style={dr.value}>{value}</Text>
    </View>
  );
}
const dr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A2D3E' },
  label: { color: '#9CA3AF', fontFamily: FONTS.regular, fontSize: 13 },
  value: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#1E2030' },
  back: { color: COLORS.gold, fontFamily: FONTS.regular, fontSize: 14 },
  title: { color: '#fff', fontFamily: FONTS.bold, fontSize: 18 },
  scroll: { padding: 20, paddingBottom: 40 },
  sessionName: { color: '#fff', fontFamily: FONTS.bold, fontSize: 20, marginBottom: 4 },
  sub: { color: '#9CA3AF', fontFamily: FONTS.regular, fontSize: 13, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailBox: { backgroundColor: '#1E2030', borderRadius: 14, padding: 16, marginTop: 8 },
  detailTitle: { color: '#fff', fontFamily: FONTS.bold, fontSize: 15, marginBottom: 12 },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 40, fontFamily: FONTS.regular },
});
