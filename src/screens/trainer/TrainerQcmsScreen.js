import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

export default function TrainerQcmsScreen({ navigation }) {
  const [qcms, setQcms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/qcms/mine')
      .then(r => setQcms(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.levelCode} · {item.theme ?? '—'}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: item.status === 'PUBLISHED' ? '#10B981' : COLORS.muted }]}>
          <Text style={[styles.statusText, { color: item.status === 'PUBLISHED' ? '#10B981' : COLORS.muted }]}>
            {item.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
          </Text>
        </View>
      </View>
      <Text style={styles.qCount}>{item.questions?.length ?? 0} questions</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes QCM</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation?.navigate('CreateQcm')}>
          <Text style={styles.addBtnText}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : qcms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>✏️</Text>
          <Text style={styles.emptyText}>Aucun QCM créé</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation?.navigate('CreateQcm')}>
            <Text style={styles.emptyBtnText}>Créer mon premier QCM</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={qcms} keyExtractor={i => String(i.id)} renderItem={renderItem} contentContainerStyle={styles.list} />
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
  cardTop: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  cardTitle: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14 },
  cardMeta: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12, marginTop: 3 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontFamily: FONTS.uiBold, fontSize: 10 },
  qCount: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
  emptyBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13 },
});
