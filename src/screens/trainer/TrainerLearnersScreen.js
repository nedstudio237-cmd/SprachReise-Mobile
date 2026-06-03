import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const STATUS_COLORS = { ACTIF: '#3B82F6', EN_RETARD: '#F59E0B', CERTIFIE: '#10B981' };
const STATUS_FR     = { ACTIF: 'Actif', EN_RETARD: 'En retard', CERTIFIE: 'Certifié ✓' };

export default function TrainerLearnersScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [learners, setLearners]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('ALL');
  const [detail, setDetail]       = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await fetch(`${API_BASE_URL}/trainer/learners`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json();
      setLearners(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, [accessToken]);

  useState(() => { load(); }, []);

  const loadDetail = async (learner) => {
    setDetail({ ...learner, examResults: [] });
    setLoadingDetail(true);
    try {
      const r = await fetch(`${API_BASE_URL}/trainer/learners/${learner.learnerId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await r.json();
      setDetail(data);
    } catch { }
    setLoadingDetail(false);
  };

  const filtered = filter === 'ALL' ? learners : learners.filter(l => l.learnerStatus === filter);

  const stats = {
    total:    learners.length,
    actif:    learners.filter(l => l.learnerStatus === 'ACTIF').length,
    retard:   learners.filter(l => l.learnerStatus === 'EN_RETARD').length,
    certifie: learners.filter(l => l.learnerStatus === 'CERTIFIE').length,
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mes apprenants</Text>
        <Text style={s.count}>{learners.length}</Text>
      </View>

      {/* Statistiques globales */}
      <View style={s.statsRow}>
        <StatChip value={stats.total}    label="Total"    color="#9CA3AF" />
        <StatChip value={stats.actif}    label="Actifs"   color="#3B82F6" />
        <StatChip value={stats.retard}   label="En retard" color="#F59E0B" />
        <StatChip value={stats.certifie} label="Certifiés" color="#10B981" />
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {[['ALL','Tous'], ['ACTIF','Actifs'], ['EN_RETARD','En retard'], ['CERTIFIE','Certifiés']].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setFilter(key)} style={[s.filterBtn, filter === key && s.filterBtnActive]}>
            <Text style={[s.filterText, filter === key && s.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.gold} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {filtered.length === 0 && (
            <Text style={s.empty}>Aucun apprenant{filter !== 'ALL' ? ' dans cette catégorie' : ''}.</Text>
          )}
          {filtered.map(learner => (
            <TouchableOpacity key={learner.learnerId} onPress={() => loadDetail(learner)} style={s.card}>
              <View style={s.cardRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(learner.firstName || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{learner.firstName} {learner.lastName}</Text>
                  <Text style={s.cardEmail}>{learner.email}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[learner.learnerStatus] || '#6B7280' }]}>
                  <Text style={s.statusText}>{STATUS_FR[learner.learnerStatus] || learner.learnerStatus}</Text>
                </View>
              </View>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>Progression</Text>
                <Text style={s.progressPct}>{Math.round(learner.completionPercentage || 0)}%</Text>
              </View>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${Math.min(learner.completionPercentage || 0, 100)}%` }]} />
              </View>
              <View style={s.metaRow}>
                <Text style={s.metaText}>📚 {learner.coursesCompleted || 0} cours</Text>
                <Text style={s.metaText}>📺 {learner.sessionsAttended || 0} sessions</Text>
                <Text style={s.metaText}>📊 {Math.round(learner.qcmAvgScore || 0)}% QCM</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Modal détail apprenant */}
      <Modal visible={!!detail} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.modal, { maxHeight: '85%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{detail?.firstName} {detail?.lastName}</Text>
              <TouchableOpacity onPress={() => setDetail(null)}>
                <Text style={{ color: '#9CA3AF', fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            {loadingDetail ? (
              <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 30 }} />
            ) : detail ? (
              <ScrollView>
                <Text style={s.detailEmail}>{detail.email}</Text>
                {detail.phone  && <Text style={s.detailMeta}>📞 {detail.phone}</Text>}
                {detail.city   && <Text style={s.detailMeta}>📍 {detail.city}</Text>}

                <View style={s.detailStats}>
                  <DetailStat value={`${Math.round(detail.completionPercentage || 0)}%`} label="Avancement" />
                  <DetailStat value={detail.coursesCompleted  || 0} label="Cours" />
                  <DetailStat value={detail.sessionsAttended  || 0} label="Sessions" />
                  <DetailStat value={`${Math.round(detail.qcmAvgScore || 0)}%`} label="QCM moy." />
                </View>

                {detail.certified && (
                  <View style={s.certBadge}>
                    <Text style={s.certText}>🏆 Niveau certifié</Text>
                  </View>
                )}

                {/* Bouton message direct */}
                <TouchableOpacity
                  style={s.msgBtn}
                  onPress={() => {
                    setDetail(null);
                    const name = `${detail.firstName ?? ''} ${detail.lastName ?? ''}`.trim();
                    navigation.navigate('Conversation', { otherUserId: detail.id ?? detail.userId, otherName: name });
                  }}
                >
                  <Text style={s.msgBtnTxt}>💬 Envoyer un message</Text>
                </TouchableOpacity>

                {detail.examResults && detail.examResults.length > 0 && (
                  <>
                    <Text style={s.sectionTitle}>RÉSULTATS AUX ÉVALUATIONS</Text>
                    {detail.examResults.map((er, i) => (
                      <View key={i} style={s.examResult}>
                        <Text style={s.examTitle}>{er.examTitle}</Text>
                        {er.grade != null && <Text style={{ color: COLORS.gold, fontFamily: FONTS.bold }}>Note : {er.grade}/20</Text>}
                        {er.feedback && <Text style={s.detailMeta}>Feedback : {er.feedback}</Text>}
                        <Text style={s.detailMeta}>{er.submittedAt ? er.submittedAt.substring(0, 16) : '—'}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatChip({ value, label, color }) {
  return (
    <View style={sc.chip}>
      <Text style={[sc.chipValue, { color }]}>{value}</Text>
      <Text style={sc.chipLabel}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  chip: { alignItems: 'center', flex: 1 },
  chipValue: { fontSize: 22, fontFamily: FONTS.bold },
  chipLabel: { color: '#6B7280', fontSize: 11, fontFamily: FONTS.regular, marginTop: 2 },
});

function DetailStat({ value, label }) {
  return (
    <View style={ds.item}>
      <Text style={ds.value}>{value}</Text>
      <Text style={ds.label}>{label}</Text>
    </View>
  );
}
const ds = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', backgroundColor: '#2A2D3E', borderRadius: 10, padding: 10 },
  value: { color: COLORS.gold, fontSize: 18, fontFamily: FONTS.bold },
  label: { color: '#9CA3AF', fontSize: 10, fontFamily: FONTS.regular, marginTop: 2, textAlign: 'center' },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark || '#0F1117' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E2030' },
  back: { marginRight: 12 },
  backText: { color: COLORS.gold, fontSize: 14, fontFamily: FONTS.regular },
  title: { flex: 1, color: '#fff', fontSize: 18, fontFamily: FONTS.bold },
  count: { color: COLORS.gold, fontSize: 22, fontFamily: FONTS.bold },
  statsRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E2030' },
  filterRow: { borderBottomWidth: 1, borderBottomColor: '#1E2030', paddingVertical: 10 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#2A2D3E' },
  filterBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterText: { color: '#9CA3AF', fontSize: 13, fontFamily: FONTS.regular },
  filterTextActive: { color: '#000', fontFamily: FONTS.bold },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 50, fontFamily: FONTS.regular },
  card: { backgroundColor: '#1E2030', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2D3E', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.gold, fontSize: 18, fontFamily: FONTS.bold },
  cardName: { color: '#fff', fontSize: 15, fontFamily: FONTS.bold },
  cardEmail: { color: '#6B7280', fontSize: 12, fontFamily: FONTS.regular },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 10, fontFamily: FONTS.bold },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { color: '#9CA3AF', fontSize: 11, fontFamily: FONTS.regular },
  progressPct: { color: COLORS.gold, fontSize: 11, fontFamily: FONTS.bold },
  progressBar: { height: 6, backgroundColor: '#2A2D3E', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 3 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaText: { color: '#6B7280', fontSize: 11, fontFamily: FONTS.regular },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1E2030', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: FONTS.bold, flex: 1 },
  detailEmail: { color: '#9CA3AF', fontSize: 13, fontFamily: FONTS.regular, marginBottom: 4 },
  detailMeta: { color: '#6B7280', fontSize: 12, fontFamily: FONTS.regular, marginBottom: 3 },
  detailStats: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  msgBtn:    { backgroundColor: '#A15E2D', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  msgBtnTxt: { color: '#F9F4E8', fontFamily: FONTS.bold, fontSize: 14 },
  certBadge: { backgroundColor: '#064E3B', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 16 },
  certText: { color: '#10B981', fontFamily: FONTS.bold, fontSize: 15 },
  sectionTitle: { color: '#9CA3AF', fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },
  examResult: { backgroundColor: '#2A2D3E', borderRadius: 10, padding: 12, marginBottom: 8 },
  examTitle: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13, marginBottom: 4 },
});
