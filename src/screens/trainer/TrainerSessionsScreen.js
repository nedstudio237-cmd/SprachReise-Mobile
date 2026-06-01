import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

const STATUS_COLORS = { SCHEDULED: COLORS.accent, LIVE: '#E63946', ENDED: COLORS.muted, CANCELLED: '#EF4444' };
const STATUS_LABELS = { SCHEDULED: 'Planifiée', LIVE: '● LIVE', ENDED: 'Terminée', CANCELLED: 'Annulée' };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TrainerSessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/sessions/mine')
      .then(r => setSessions(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const startSession = async (id) => {
    try {
      const { data } = await api.post(`/sessions/${id}/start`);
      Alert.alert('Session démarrée', `Token Agora : ${data.agoraToken ?? 'généré'}`);
      load();
    } catch { Alert.alert('Erreur', 'Impossible de démarrer la session'); }
  };

  const endSession = async (id) => {
    try {
      await api.post(`/sessions/${id}/end`);
      load();
    } catch { Alert.alert('Erreur', 'Impossible de terminer la session'); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDate}>{formatDate(item.scheduledStart)} · {item.durationMinutes} min</Text>
        </View>
        <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? COLORS.muted }]}>
          {STATUS_LABELS[item.status] ?? item.status}
        </Text>
      </View>
      {item.status === 'SCHEDULED' && (
        <TouchableOpacity style={styles.startBtn} onPress={() => startSession(item.id)}>
          <Text style={styles.startBtnText}>▶ Démarrer</Text>
        </TouchableOpacity>
      )}
      {item.status === 'LIVE' && (
        <TouchableOpacity style={[styles.startBtn, { backgroundColor: '#E63946' }]} onPress={() => endSession(item.id)}>
          <Text style={styles.startBtnText}>■ Terminer la session</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes sessions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation?.navigate('CreateSession')}>
          <Text style={styles.addBtnText}>+ Planifier</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📡</Text>
          <Text style={styles.emptyText}>Aucune session planifiée</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation?.navigate('CreateSession')}>
            <Text style={styles.emptyBtnText}>Planifier une session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={sessions} keyExtractor={i => String(i.id)} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 12 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  cardTop: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  cardTitle: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  cardDate: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12, marginTop: 3 },
  statusText: { fontFamily: FONTS.uiBold, fontSize: 11, alignSelf: 'flex-start' },
  startBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8, padding: 10, alignItems: 'center',
  },
  startBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
  emptyBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13 },
});
