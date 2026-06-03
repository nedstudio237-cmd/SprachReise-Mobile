import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const STATUS_FR = { DRAFT: 'Brouillon', PUBLISHED: 'Publié' };

export default function TrainerExamsScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [exams, setExams]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [submissions, setSubmissions]   = useState([]);
  const [showSubs, setShowSubs]   = useState(false);

  const [form, setForm] = useState({ title: '', instructions: '', scheduledAt: '' });

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch(`${API_BASE_URL}/trainer/exams`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json();
      setExams(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, [accessToken]);

  useState(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    setSaving(true);
    try {
      const body = { title: form.title.trim(), instructions: form.instructions.trim() || null };
      if (form.scheduledAt.trim()) body.scheduledAt = form.scheduledAt.trim();
      const r = await fetch(`${API_BASE_URL}/trainer/exams`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setShowModal(false);
        setForm({ title: '', instructions: '', scheduledAt: '' });
        load();
      } else {
        const err = await r.json();
        Alert.alert('Erreur', err.error || 'Erreur lors de la création');
      }
    } catch { Alert.alert('Erreur', 'Connexion impossible'); }
    setSaving(false);
  };

  const togglePublish = async (id) => {
    await fetch(`${API_BASE_URL}/trainer/exams/${id}/publish`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
    });
    load();
  };

  const loadSubmissions = async (exam) => {
    setSelectedExam(exam);
    setSubmissions([]);
    setShowSubs(true);
    try {
      const r = await fetch(`${API_BASE_URL}/trainer/exams/${exam.id}/submissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Évaluations</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={s.addBtn}>
          <Text style={s.addText}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.gold} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {exams.length === 0 && (
            <Text style={s.empty}>Aucune évaluation.{'\n'}Appuie sur ＋ pour en créer une.</Text>
          )}
          {exams.map(exam => (
            <View key={exam.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.statusBadge, { backgroundColor: exam.status === 'PUBLISHED' ? '#10B981' : '#6B7280' }]}>
                  <Text style={s.statusText}>{STATUS_FR[exam.status] || exam.status}</Text>
                </View>
                <Text style={s.subCount}>{exam.submissions} réponse{exam.submissions !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={s.cardTitle}>{exam.title}</Text>
              {exam.instructions && <Text style={s.cardDesc} numberOfLines={2}>{exam.instructions}</Text>}
              {exam.scheduledAt && (
                <Text style={s.metaText}>📅 {exam.scheduledAt.replace('T', ' ').substring(0, 16)}</Text>
              )}
              <View style={s.actions}>
                <TouchableOpacity onPress={() => togglePublish(exam.id)} style={[s.actionBtn, { borderColor: exam.status === 'PUBLISHED' ? '#EF4444' : '#10B981' }]}>
                  <Text style={[s.actionText, { color: exam.status === 'PUBLISHED' ? '#EF4444' : '#10B981' }]}>
                    {exam.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => loadSubmissions(exam)} style={[s.actionBtn, { borderColor: COLORS.gold }]}>
                  <Text style={[s.actionText, { color: COLORS.gold }]}>Voir réponses</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal créer évaluation */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Nouvelle évaluation</Text>
            <Text style={s.label}>Titre *</Text>
            <TextInput
              style={s.input} placeholder="Ex: Épreuve finale B1"
              value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
            />
            <Text style={s.label}>Instructions (optionnel)</Text>
            <TextInput
              style={[s.input, { height: 80 }]} multiline placeholder="Consignes pour les apprenants..."
              value={form.instructions} onChangeText={v => setForm(f => ({ ...f, instructions: v }))}
            />
            <Text style={s.label}>Date de programmation (optionnel, format: 2026-06-20T10:00:00)</Text>
            <TextInput
              style={s.input} placeholder="2026-06-20T10:00:00"
              value={form.scheduledAt} onChangeText={v => setForm(f => ({ ...f, scheduledAt: v }))}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={s.cancelModalBtn}>
                <Text style={s.cancelModalText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={s.submitBtn} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.submitText}>Créer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal voir réponses */}
      <Modal visible={showSubs} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={s.modalTitle}>{selectedExam?.title}</Text>
              <TouchableOpacity onPress={() => setShowSubs(false)}>
                <Text style={{ color: '#9CA3AF', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {submissions.length === 0 ? (
                <Text style={s.empty}>Aucune réponse pour cette évaluation.</Text>
              ) : (
                submissions.map(sub => (
                  <View key={sub.id} style={[s.card, { marginBottom: 10 }]}>
                    <Text style={s.cardTitle}>{sub.learnerName || `Apprenant #${sub.learnerId}`}</Text>
                    <Text style={s.metaText}>{sub.learnerEmail}</Text>
                    <Text style={s.metaText}>Soumis : {sub.submittedAt ? sub.submittedAt.substring(0, 16) : '—'}</Text>
                    {sub.grade != null && <Text style={{ color: COLORS.gold, fontFamily: FONTS.bold, marginTop: 4 }}>Note : {sub.grade}/20</Text>}
                    {sub.feedback && <Text style={s.cardDesc}>Feedback : {sub.feedback}</Text>}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark || '#0F1117' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E2030' },
  back: { marginRight: 12 },
  backText: { color: COLORS.gold, fontSize: 14, fontFamily: FONTS.regular },
  title: { flex: 1, color: '#fff', fontSize: 18, fontFamily: FONTS.bold },
  addBtn: { backgroundColor: COLORS.gold, borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#000', fontSize: 22, fontWeight: 'bold' },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 40, lineHeight: 24, fontFamily: FONTS.regular },
  card: { backgroundColor: '#1E2030', borderRadius: 12, padding: 14, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 11, fontFamily: FONTS.bold },
  subCount: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular },
  cardTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold, marginBottom: 4 },
  cardDesc: { color: '#9CA3AF', fontSize: 13, fontFamily: FONTS.regular, marginBottom: 6 },
  metaText: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  actionText: { fontSize: 13, fontFamily: FONTS.regular },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1E2030', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: FONTS.bold, marginBottom: 4 },
  label: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: '#2A2D3E', borderRadius: 8, color: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.regular, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelModalBtn: { flex: 1, borderWidth: 1, borderColor: '#4B5563', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelModalText: { color: '#9CA3AF', fontFamily: FONTS.regular },
  submitBtn: { flex: 1, backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  submitText: { color: '#000', fontFamily: FONTS.bold, fontSize: 15 },
});
