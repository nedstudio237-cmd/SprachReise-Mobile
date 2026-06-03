import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, COLORS, FONTS } from '../../constants/config';

const api = (path, method = 'GET', body, token) =>
  fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());

const LEVEL_LABELS = { A1:'Découverte', A2:'Survie', B1:'Seuil', B2:'Avancé', C1:'Autonome', C2:'Maîtrise' };
const LEVEL_COLORS = { A1:'#10B981', A2:'#3B82F6', B1:'#8B5CF6', B2:'#F59E0B', C1:'#EF4444', C2:'#B8893A' };

export default function AdminCertificatesScreen({ navigation }) {
  const { accessToken } = useAuthStore();

  const [tab, setTab]               = useState('eligible'); // 'eligible' | 'issued'
  const [eligible, setEligible]     = useState([]);
  const [issued, setIssued]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emitting, setEmitting]     = useState(null); // learnerId en cours d'émission

  // Révocation
  const [revokeModal, setRevokeModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [el, is] = await Promise.all([
        api('/certificates/admin/eligible', 'GET', null, accessToken),
        api('/certificates/admin/all',      'GET', null, accessToken),
      ]);
      setEligible(Array.isArray(el) ? el : []);
      setIssued(Array.isArray(is) ? is : []);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const emitCert = async (learnerId, learnerName, levelCode) => {
    Alert.alert(
      'Émettre le certificat',
      `Émettre le certificat ${levelCode} pour ${learnerName} ?\nUn email lui sera envoyé automatiquement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Émettre',
          onPress: async () => {
            setEmitting(learnerId);
            try {
              const res = await api(`/certificates/admin/emit/${learnerId}`, 'POST', {}, accessToken);
              if (res.error) { Alert.alert('Erreur', res.error); return; }
              Alert.alert('✅ Certificat émis', `N° ${res.certificateNumber}\nEmail envoyé à l'apprenant.`);
              load();
            } catch (e) {
              Alert.alert('Erreur', e.message);
            } finally {
              setEmitting(null);
            }
          },
        },
      ]
    );
  };

  const confirmRevoke = async () => {
    if (!revokeReason.trim()) { Alert.alert('Motif requis', 'Veuillez saisir un motif de révocation.'); return; }
    try {
      await api(`/certificates/admin/revoke/${revokeTarget.id}`, 'POST', { reason: revokeReason }, accessToken);
      Alert.alert('Certificat révoqué', `N° ${revokeTarget.certificateNumber}`);
      setRevokeModal(false);
      setRevokeReason('');
      load();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const renderEligible = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.levelBadge, { backgroundColor: LEVEL_COLORS[item.levelCode] + '22', borderColor: LEVEL_COLORS[item.levelCode] }]}>
          <Text style={[s.levelBadgeTxt, { color: LEVEL_COLORS[item.levelCode] }]}>{item.levelCode}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.learnerName}>{item.learnerName}</Text>
          <Text style={s.learnerEmail}>{item.email}</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <Stat icon="school" label="Cours" value={item.coursesCompleted ?? 0} />
        <Stat icon="videocam" label="Sessions" value={item.sessionsAttended ?? 0} />
        <Stat icon="bar-chart" label="QCM" value={`${Math.round(item.qcmScore ?? 0)}%`} />
        <Stat icon="trophy" label="Complétion" value={`${Math.round(item.completion ?? 0)}%`} color={COLORS.gold} />
      </View>

      <TouchableOpacity
        style={[s.emitBtn, emitting === item.learnerId && s.emitBtnDisabled]}
        onPress={() => emitCert(item.learnerId, item.learnerName, item.levelCode)}
        disabled={emitting === item.learnerId}>
        {emitting === item.learnerId
          ? <ActivityIndicator size="small" color="white" />
          : <>
              <Ionicons name="ribbon" size={16} color="white" />
              <Text style={s.emitBtnTxt}>ÉMETTRE LE CERTIFICAT</Text>
            </>}
      </TouchableOpacity>
    </View>
  );

  const renderIssued = ({ item }) => (
    <View style={[s.card, item.revoked && s.cardRevoked]}>
      <View style={s.cardHeader}>
        <View style={[s.levelBadge, {
          backgroundColor: item.revoked ? '#6B728022' : (LEVEL_COLORS[item.levelCode] + '22'),
          borderColor: item.revoked ? '#6B7280' : LEVEL_COLORS[item.levelCode],
        }]}>
          <Text style={[s.levelBadgeTxt, { color: item.revoked ? '#6B7280' : LEVEL_COLORS[item.levelCode] }]}>
            {item.levelCode}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.learnerName}>{item.learnerName}</Text>
          <Text style={s.learnerEmail}>{item.learnerEmail}</Text>
          <Text style={s.certNumber}>N° {item.certificateNumber}</Text>
        </View>
        {item.revoked
          ? <View style={s.revokedBadge}><Text style={s.revokedTxt}>RÉVOQUÉ</Text></View>
          : <Ionicons name="checkmark-circle" size={22} color={COLORS.success ?? '#10B981'} />}
      </View>

      <View style={s.issuedFooter}>
        <Text style={s.issuedDate}>Émis le {item.issuedAt}</Text>
        {!item.revoked && (
          <TouchableOpacity
            style={s.revokeBtn}
            onPress={() => { setRevokeTarget(item); setRevokeModal(true); }}>
            <Ionicons name="trash" size={14} color={COLORS.error ?? '#EF4444'} />
            <Text style={s.revokeBtnTxt}>Révoquer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.deep} />
        </TouchableOpacity>
        <Text style={s.title}>Certificats</Text>
        <TouchableOpacity onPress={load} style={s.backBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'eligible' && s.tabActive]} onPress={() => setTab('eligible')}>
          <Text style={[s.tabTxt, tab === 'eligible' && s.tabTxtActive]}>
            Éligibles ({eligible.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'issued' && s.tabActive]} onPress={() => setTab('issued')}>
          <Text style={[s.tabTxt, tab === 'issued' && s.tabTxtActive]}>
            Émis ({issued.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={tab === 'eligible' ? eligible : issued}
          keyExtractor={(_, i) => i.toString()}
          renderItem={tab === 'eligible' ? renderEligible : renderIssued}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name={tab === 'eligible' ? 'checkmark-done-circle' : 'ribbon'} size={48} color={COLORS.muted} />
              <Text style={s.emptyTxt}>
                {tab === 'eligible' ? 'Aucun apprenant éligible pour l\'instant.' : 'Aucun certificat émis.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal révocation */}
      <Modal visible={revokeModal} transparent animationType="slide" onRequestClose={() => setRevokeModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>⚠️ Révoquer le certificat</Text>
            <Text style={s.modalSub}>
              N° {revokeTarget?.certificateNumber}{'\n'}
              {revokeTarget?.learnerName} · {revokeTarget?.levelCode}
            </Text>
            <Text style={s.modalLabel}>Motif obligatoire</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Raison de la révocation…"
              placeholderTextColor={COLORS.muted}
              value={revokeReason}
              onChangeText={setRevokeReason}
              multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setRevokeModal(false); setRevokeReason(''); }}>
                <Text style={s.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={confirmRevoke}>
                <Text style={s.modalConfirmTxt}>Révoquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value, color }) {
  return (
    <View style={s.stat}>
      <Ionicons name={icon} size={14} color={color ?? COLORS.muted} />
      <Text style={[s.statVal, color && { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.paper },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:      { fontFamily: FONTS.display, fontSize: 20, color: COLORS.deep, fontStyle: 'italic' },

  tabs:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  tab:        { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:  { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabTxt:     { fontFamily: FONTS.uiBold, fontSize: 12, letterSpacing: 1, color: COLORS.muted },
  tabTxtActive:{ color: COLORS.accent },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTxt:   { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, textAlign: 'center', fontStyle: 'italic' },

  card:       { backgroundColor: COLORS.parchment, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.paperDeep },
  cardRevoked:{ opacity: 0.6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

  levelBadge:    { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  levelBadgeTxt: { fontFamily: FONTS.uiBold, fontSize: 15 },

  learnerName:  { fontFamily: FONTS.uiBold, fontSize: 15, color: COLORS.deep },
  learnerEmail: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  certNumber:   { fontFamily: FONTS.ui, fontSize: 11, color: COLORS.muted, marginTop: 2 },

  statsRow:   { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.paperDeep, borderRadius: 10, paddingVertical: 10, marginBottom: 12 },
  stat:       { alignItems: 'center', gap: 3 },
  statVal:    { fontFamily: FONTS.uiBold, fontSize: 14, color: COLORS.deep },
  statLbl:    { fontFamily: FONTS.ui, fontSize: 9, color: COLORS.muted, letterSpacing: 0.5 },

  emitBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.deep, borderRadius: 10, paddingVertical: 12 },
  emitBtnDisabled: { opacity: 0.5 },
  emitBtnTxt:      { fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.parchment, letterSpacing: 0.5 },

  issuedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.paperDeep },
  issuedDate:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, fontStyle: 'italic' },
  revokeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revokeBtnTxt: { fontFamily: FONTS.uiBold, fontSize: 12, color: '#EF4444' },
  revokedBadge: { backgroundColor: '#6B728022', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  revokedTxt:   { fontFamily: FONTS.uiBold, fontSize: 10, color: '#6B7280', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: COLORS.parchment, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:   { fontFamily: FONTS.uiBold, fontSize: 18, color: COLORS.deep, marginBottom: 8 },
  modalSub:     { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginBottom: 16, lineHeight: 20 },
  modalLabel:   { fontFamily: FONTS.uiBold, fontSize: 12, color: COLORS.primary, letterSpacing: 1, marginBottom: 8 },
  modalInput:   { backgroundColor: COLORS.paperDeep, borderRadius: 10, padding: 12, fontFamily: FONTS.regular, color: COLORS.deep, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalBtns:    { flexDirection: 'row', gap: 12 },
  modalCancel:  { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: COLORS.paperDeep },
  modalCancelTxt:{ fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.muted },
  modalConfirm: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: '#EF4444' },
  modalConfirmTxt:{ fontFamily: FONTS.uiBold, fontSize: 13, color: 'white' },
});
