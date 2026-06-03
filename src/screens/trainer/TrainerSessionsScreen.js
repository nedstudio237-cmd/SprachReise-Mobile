import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const STATUS_COLORS = {
  SCHEDULED: '#3B82F6', LIVE: '#EF4444', ENDED: '#6B7280', CANCELLED: '#9CA3AF',
};
const STATUS_FR = {
  SCHEDULED: 'Programmée', LIVE: '🔴 EN DIRECT', ENDED: 'Terminée', CANCELLED: 'Annulée',
};

function formatDate(d) {
  if (!d) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}
function displayDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

export default function TrainerSessionsScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);

  // DatePicker state
  const [selectedDate, setSelectedDate]   = useState(new Date(Date.now() + 3600000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', durationMinutes: '60',
  });

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch(`${API_BASE_URL}/trainer/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, [accessToken]);

  useState(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE_URL}/trainer/sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          scheduledAt: formatDate(selectedDate),
          durationMinutes: parseInt(form.durationMinutes) || 60,
        }),
      });
      if (r.ok) {
        setShowModal(false);
        setForm({ title: '', description: '', durationMinutes: '60' });
        setSelectedDate(new Date(Date.now() + 3600000));
        load();
      } else {
        const err = await r.json();
        Alert.alert('Erreur', err.error || 'Erreur lors de la création');
      }
    } catch { Alert.alert('Erreur', 'Connexion impossible'); }
    setSaving(false);
  };

  const handleCancel = (id) => {
    Alert.alert('Annuler la session', 'Confirmer l\'annulation ?', [
      { text: 'Non' },
      { text: 'Oui', style: 'destructive', onPress: async () => {
        await fetch(`${API_BASE_URL}/trainer/sessions/${id}/cancel`, {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
        });
        load();
      }},
    ]);
  };

  const startLive = async (id) => {
    await fetch(`${API_BASE_URL}/sessions/${id}/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'LIVE' }),
    });
    load();
  };

  const endLive = async (id) => {
    Alert.alert('Terminer le live', 'Confirmer la fin de session ?', [
      { text: 'Non' },
      { text: 'Oui', onPress: async () => {
        await fetch(`${API_BASE_URL}/sessions/${id}/status`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ENDED' }),
        });
        load();
      }},
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Sessions live</Text>
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
          {sessions.length === 0 && (
            <Text style={s.empty}>Aucune session programmée.{'\n'}Appuie sur ＋ pour en créer une.</Text>
          )}
          {sessions.map(session => (
            <View key={session.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[session.status] || '#6B7280' }]}>
                  <Text style={s.statusText}>{STATUS_FR[session.status] || session.status}</Text>
                </View>
                <Text style={s.levelBadge}>Niveau {session.levelCode}</Text>
              </View>
              <Text style={s.cardTitle}>{session.title}</Text>
              {session.description ? <Text style={s.cardDesc}>{session.description}</Text> : null}
              <View style={s.cardMeta}>
                <Text style={s.metaText}>📅 {session.scheduledStart ? session.scheduledStart.replace('T', ' ').substring(0, 16) : '—'}</Text>
                <Text style={s.metaText}>⏱ {session.durationMinutes} min</Text>
              </View>

              {/* Actions selon statut */}
              <View style={s.actionRow}>
                {session.status === 'SCHEDULED' && (
                  <>
                    <TouchableOpacity onPress={() => startLive(session.id)} style={s.liveBtn}>
                      <Text style={s.liveBtnText}>▶ Démarrer le live</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCancel(session.id)} style={s.cancelBtn}>
                      <Text style={s.cancelText}>Annuler</Text>
                    </TouchableOpacity>
                  </>
                )}
                {session.status === 'LIVE' && (
                  <>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('LiveSession', { sessionId: session.id, isTrainer: true })}
                      style={s.joinBtn}
                    >
                      <Text style={s.joinText}>📡 Rejoindre le live</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => endLive(session.id)} style={s.cancelBtn}>
                      <Text style={s.cancelText}>Terminer</Text>
                    </TouchableOpacity>
                  </>
                )}
                {session.status === 'ENDED' && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('LiveStats', { sessionId: session.id })}
                    style={s.statsBtn}
                  >
                    <Text style={s.statsBtnText}>📊 Voir les stats</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal création avec DatePicker */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <ScrollView>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Nouvelle session live</Text>

              <Text style={s.label}>Titre *</Text>
              <TextInput
                style={s.input} placeholder="Ex: Grammaire B1 – Le datif"
                value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
              />

              <Text style={s.label}>Description (optionnel)</Text>
              <TextInput
                style={[s.input, { height: 72 }]} multiline placeholder="Contenu de la session..."
                value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))}
              />

              {/* Date */}
              <Text style={s.label}>Date de la session</Text>
              <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={s.dateBtnText}>📅 {selectedDate.toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</Text>
              </TouchableOpacity>

              {/* Heure */}
              <Text style={[s.label, { marginTop: 12 }]}>Heure de début</Text>
              <TouchableOpacity style={s.dateBtn} onPress={() => setShowTimePicker(true)}>
                <Text style={s.dateBtnText}>🕐 {selectedDate.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</Text>
              </TouchableOpacity>

              {/* DatePicker natif */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const merged = new Date(date);
                      merged.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                      setSelectedDate(merged);
                    }
                  }}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    setShowTimePicker(false);
                    if (date) setSelectedDate(date);
                  }}
                />
              )}

              {/* Résumé sélection */}
              <View style={s.summaryBox}>
                <Text style={s.summaryText}>📆 {displayDate(selectedDate)}</Text>
              </View>

              <Text style={[s.label, { marginTop: 12 }]}>Durée (minutes)</Text>
              <TextInput
                style={s.input} placeholder="60" keyboardType="number-pad"
                value={form.durationMinutes} onChangeText={v => setForm(f => ({ ...f, durationMinutes: v }))}
              />

              <View style={s.modalBtns}>
                <TouchableOpacity onPress={() => setShowModal(false)} style={s.cancelModalBtn}>
                  <Text style={s.cancelModalText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} style={s.submitBtn} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitText}>Créer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 60, lineHeight: 24, fontFamily: FONTS.regular },
  card: { backgroundColor: '#1E2030', borderRadius: 12, padding: 14, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 11, fontFamily: FONTS.bold },
  levelBadge: { color: COLORS.gold, fontSize: 11, fontFamily: FONTS.bold },
  cardTitle: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold, marginBottom: 4 },
  cardDesc: { color: '#9CA3AF', fontSize: 13, fontFamily: FONTS.regular, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaText: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  liveBtn: { backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  liveBtnText: { color: '#fff', fontSize: 13, fontFamily: FONTS.bold },
  joinBtn: { backgroundColor: '#8B5CF6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  joinText: { color: '#fff', fontSize: 13, fontFamily: FONTS.bold },
  statsBtn: { borderWidth: 1, borderColor: COLORS.gold, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  statsBtnText: { color: COLORS.gold, fontSize: 13, fontFamily: FONTS.regular },
  cancelBtn: { borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  cancelText: { color: '#EF4444', fontSize: 12, fontFamily: FONTS.regular },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: { backgroundColor: '#1E2030', margin: 20, borderRadius: 20, padding: 20, paddingBottom: 40, marginTop: 60 },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: FONTS.bold, marginBottom: 16, textAlign: 'center' },
  label: { color: '#9CA3AF', fontSize: 12, fontFamily: FONTS.regular, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#2A2D3E', borderRadius: 8, color: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.regular, fontSize: 14 },
  dateBtn: { backgroundColor: '#2A2D3E', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: COLORS.gold },
  dateBtnText: { color: '#fff', fontFamily: FONTS.regular, fontSize: 14 },
  summaryBox: { backgroundColor: 'rgba(184,137,58,0.15)', borderRadius: 8, padding: 12, marginTop: 10, borderWidth: 1, borderColor: COLORS.gold },
  summaryText: { color: COLORS.gold, fontFamily: FONTS.bold, fontSize: 13, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelModalBtn: { flex: 1, borderWidth: 1, borderColor: '#4B5563', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelModalText: { color: '#9CA3AF', fontFamily: FONTS.regular },
  submitBtn: { flex: 1, backgroundColor: COLORS.gold, borderRadius: 10, padding: 14, alignItems: 'center' },
  submitText: { color: '#000', fontFamily: FONTS.bold, fontSize: 15 },
});
