import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../../constants/config';
import api from '../../services/api';

export default function TrainerExamsScreen({ navigation }) {
  const [exams, setExams]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newInstr, setNewInstr]   = useState('');
  const [creating, setCreating]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/exams/mine')
      .then(r => setExams(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  const createExam = async () => {
    if (!newTitle.trim()) { Alert.alert('Erreur', 'Titre obligatoire'); return; }
    setCreating(true);
    try {
      await api.post('/exams', { title: newTitle.trim(), instructions: newInstr.trim(), status: 'PUBLISHED' });
      setShowCreate(false); setNewTitle(''); setNewInstr('');
      load();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.error ?? 'Erreur');
    } finally { setCreating(false); }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { borderColor: item.status === 'PUBLISHED' ? '#10B981' : COLORS.muted }]}>
          <Text style={[styles.statusText, { color: item.status === 'PUBLISHED' ? '#10B981' : COLORS.muted }]}>
            {item.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
          </Text>
        </View>
      </View>
      {item.instructions ? <Text style={styles.cardInstr} numberOfLines={2}>{item.instructions}</Text> : null}
      {item.scheduledAt && <Text style={styles.cardDate}>📅 {new Date(item.scheduledAt).toLocaleDateString('fr-FR')}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Mes épreuves</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : exams.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📝</Text>
          <Text style={styles.emptyText}>Aucune épreuve créée</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.emptyBtnText}>Créer une épreuve</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={exams} keyExtractor={i => String(i.id)} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}

      {/* Modal création */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvelle épreuve</Text>
            <TextInput style={styles.modalInput} value={newTitle} onChangeText={setNewTitle} placeholder="Titre *" placeholderTextColor={COLORS.muted} />
            <TextInput
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
              value={newInstr} onChangeText={setNewInstr}
              placeholder="Consignes..." placeholderTextColor={COLORS.muted} multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, creating && { opacity: 0.6 }]} onPress={createExam} disabled={creating}>
                {creating ? <ActivityIndicator color={COLORS.parchment} size="small" /> : <Text style={styles.confirmBtnText}>Créer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backText: { color: COLORS.gold, fontSize: 26 },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20 },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 12 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 14, flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: FONTS.uiBold, fontSize: 10 },
  cardInstr: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, fontStyle: 'italic', marginBottom: 4 },
  cardDate: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15, fontStyle: 'italic' },
  emptyBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.deep, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 1, borderColor: 'rgba(126,102,58,0.3)' },
  modalTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20, marginBottom: 20 },
  modalInput: {
    backgroundColor: 'rgba(245,239,227,0.07)', borderWidth: 1, borderColor: 'rgba(126,102,58,0.4)',
    borderRadius: 8, padding: 14, color: COLORS.parchment, fontSize: 15,
    fontFamily: FONTS.regular, marginBottom: 14,
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.muted, borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 13 },
  confirmBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 8, padding: 14, alignItems: 'center' },
  confirmBtnText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13 },
});
