import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const LEVEL_NAMES = { A1:'Débutant', A2:'Élémentaire', B1:'Intermédiaire', B2:'Inter. supérieur', C1:'Avancé', C2:'Maîtrise' };
const LANG_NAMES  = { de:'🇩🇪 Allemand', en:'🇬🇧 Anglais', es:'🇪🇸 Espagnol', zh:'🇨🇳 Mandarin' };
const LEVELS = ['A1','A2','B1','B2','C1','C2'];

export default function AdminUserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { accessToken } = useAuthStore();

  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showQuota, setShowQuota]   = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [quotaVal, setQuotaVal] = useState('30');
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => { setUser(data); setQuotaVal(String(data.trainerProfile?.maxStudents ?? 30)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-active`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
      });
      load();
    } catch { Alert.alert('Erreur', 'Impossible de modifier'); }
  };

  const resetPassword = () => {
    Alert.alert('Réinitialiser le mot de passe', 'Un nouveau mot de passe temporaire sera envoyé par email.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
            method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
          });
          const j = await res.json();
          Alert.alert('✓', j.message || 'Email envoyé');
        } catch { Alert.alert('Erreur', 'Impossible de réinitialiser'); }
      }},
    ]);
  };

  const updateQuota = async () => {
    const n = parseInt(quotaVal);
    if (isNaN(n) || n < 1) { Alert.alert('Erreur', 'Quota invalide'); return; }
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/admin/users/${userId}/trainer-quota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ maxStudents: n }),
      });
      setShowQuota(false);
      load();
    } catch { Alert.alert('Erreur', 'Impossible de modifier'); }
    finally { setSaving(false); }
  };

  const reassignLevel = async (level) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/admin/users/${userId}/trainer-reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ level }),
      });
      setShowReassign(false);
      load();
    } catch { Alert.alert('Erreur', 'Impossible de réassigner'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator color={COLORS.gold} style={{ marginTop: 100 }} />
    </SafeAreaView>
  );

  if (!user) return (
    <SafeAreaView style={s.container}>
      <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 80 }}>Utilisateur introuvable</Text>
    </SafeAreaView>
  );

  const isTrainer = user.role === 'TRAINER';
  const isLearner = user.role === 'LEARNER';
  const tp = user.trainerProfile;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>

        {/* Header avatar */}
        <View style={s.avatarRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.firstName?.[0]}{user.lastName?.[0]}</Text>
          </View>
          <View style={s.avatarInfo}>
            <Text style={s.name}>{user.firstName} {user.lastName}</Text>
            <View style={s.badges}>
              <View style={[s.badge, { backgroundColor: roleColor(user.role) + '22', borderColor: roleColor(user.role) }]}>
                <Text style={[s.badgeText, { color: roleColor(user.role) }]}>{roleLabel(user.role)}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: user.active ? COLORS.success + '22' : COLORS.error + '22', borderColor: user.active ? COLORS.success : COLORS.error }]}>
                <Text style={[s.badgeText, { color: user.active ? COLORS.success : COLORS.error }]}>
                  {user.active ? 'Actif' : 'Suspendu'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Infos de base */}
        <Section label="INFORMATIONS GÉNÉRALES" />
        <InfoRow label="Email"    value={user.email} />
        <InfoRow label="Téléphone" value={user.phone || '—'} />
        <InfoRow label="Ville"    value={user.city || '—'} />
        <InfoRow label="Membre depuis" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr') : '—'} />

        {/* Actions générales */}
        <Section label="ACTIONS" />
        <View style={s.actionRow}>
          <ActionBtn
            label={user.active ? 'Suspendre' : 'Réactiver'}
            color={user.active ? COLORS.error : COLORS.success}
            onPress={toggleActive}
          />
          <ActionBtn label="Reset mot de passe" color={COLORS.warning} onPress={resetPassword} />
        </View>

        {/* ── FORMATEUR ── */}
        {isTrainer && tp && (
          <>
            <Section label="PROFIL FORMATEUR" />
            <InfoRow label="Niveau enseigné" value={`${tp.teachingLevel} — ${LEVEL_NAMES[tp.teachingLevel] || ''}`} />
            <InfoRow label="Langue"          value={LANG_NAMES[tp.teachingLang] || tp.teachingLang} />
            <InfoRow label="Quota apprenants" value={`${tp.maxStudents} max`} />
            <InfoRow label="Note moyenne"     value={tp.ratingAvg ? `${tp.ratingAvg}/5` : '—'} />
            <InfoRow label="Cours total"      value={String(tp.totalCourses ?? 0)} />
            <InfoRow label="Cours publiés"    value={String(tp.publishedCourses ?? 0)} />
            <InfoRow label="Statut dossier"   value={tp.status} />

            <View style={s.actionRow}>
              <ActionBtn label="Modifier quota" color={COLORS.primary} onPress={() => setShowQuota(true)} />
              <ActionBtn label="Changer niveau" color={COLORS.accent} onPress={() => setShowReassign(true)} />
            </View>
          </>
        )}

        {/* ── APPRENANT : PROGRESSION ── */}
        {isLearner && Array.isArray(user.progress) && user.progress.length > 0 && (
          <>
            <Section label="PROGRESSION PAR NIVEAU" />
            {user.progress.map(p => (
              <View key={p.levelId} style={s.progressCard}>
                <View style={s.progressHeader}>
                  <Text style={s.progressLevel}>{p.levelCode}</Text>
                  <Text style={s.progressLabel}>{LEVEL_NAMES[p.levelCode]}</Text>
                  {p.certified && <Text style={s.certBadge}>🏅 Certifié</Text>}
                </View>
                {/* Barre de progression */}
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${Math.min(100, p.completionPercentage || 0)}%` }]} />
                </View>
                <Text style={s.progressPct}>{Math.round(p.completionPercentage || 0)} %</Text>
                <View style={s.progressStats}>
                  <MiniStat label="Cours" value={p.coursesCompleted} />
                  <MiniStat label="Sessions" value={p.sessionsAttended} />
                  <MiniStat label="Score QCM" value={p.qcmAvgScore ? `${Math.round(p.qcmAvgScore)}%` : '—'} />
                  <MiniStat label="Minutes" value={p.totalMinutes} />
                </View>
              </View>
            ))}
          </>
        )}

        {isLearner && (!user.progress || user.progress.length === 0) && (
          <View style={s.emptyProgress}>
            <Text style={s.emptyText}>Aucune progression enregistrée.</Text>
          </View>
        )}

      </ScrollView>

      {/* Modal quota */}
      <Modal visible={showQuota} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Modifier le quota</Text>
            <TextInput
              style={s.modalInput} value={quotaVal}
              onChangeText={setQuotaVal} keyboardType="number-pad"
              placeholder="Nombre max d'apprenants"
              placeholderTextColor={COLORS.muted}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowQuota(false)}>
                <Text style={s.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={updateQuota} disabled={saving}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={s.modalConfirmText}>Sauvegarder</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal réassigner niveau */}
      <Modal visible={showReassign} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Changer le niveau</Text>
            <Text style={s.modalSub}>Niveau actuel : {tp?.teachingLevel}</Text>
            <View style={s.levelGrid}>
              {LEVELS.map(lv => (
                <TouchableOpacity
                  key={lv}
                  style={[s.levelChip, tp?.teachingLevel === lv && s.levelChipActive]}
                  onPress={() => reassignLevel(lv)}
                  disabled={saving}
                >
                  <Text style={[s.levelChipText, tp?.teachingLevel === lv && { color: 'white' }]}>{lv}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.modalCancel} onPress={() => setShowReassign(false)}>
              <Text style={s.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sous-composants ──────────────────────────────────────────────────────────
const Section = ({ label }) => (
  <View style={s.sectionRow}>
    <View style={s.sectionLine} />
    <Text style={s.sectionLabel}>{label}</Text>
    <View style={s.sectionLine} />
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

const ActionBtn = ({ label, color, onPress }) => (
  <TouchableOpacity style={[s.actionBtn, { borderColor: color + '88' }]} onPress={onPress} activeOpacity={0.8}>
    <Text style={[s.actionBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const MiniStat = ({ label, value }) => (
  <View style={s.miniStat}>
    <Text style={s.miniStatVal}>{value ?? 0}</Text>
    <Text style={s.miniStatLabel}>{label}</Text>
  </View>
);

const roleColor = r => ({ ADMIN: COLORS.gold, TRAINER: COLORS.accent, LEARNER: COLORS.primary }[r] || COLORS.muted);
const roleLabel = r => ({ ADMIN: 'Admin', TRAINER: 'Formateur', LEARNER: 'Apprenant' }[r] || r);

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll:    { padding: 22, paddingBottom: 50 },

  back:     { marginBottom: 20 },
  backText: { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 15 },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.accent + '33', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gold,
  },
  avatarText: { fontFamily: FONTS.displayBold, color: COLORS.gold, fontSize: 22 },
  avatarInfo: { flex: 1, gap: 6 },
  name:  { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 22 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: FONTS.uiBold, fontSize: 11 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 18 },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(249,244,232,0.1)' },
  sectionLabel: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 2 },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(249,244,232,0.07)',
  },
  infoLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12 },
  infoValue: { fontFamily: FONTS.regular, color: COLORS.parchment, fontSize: 13, flex: 1, textAlign: 'right', marginLeft: 12 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 8, padding: 12, alignItems: 'center' },
  actionBtnText: { fontFamily: FONTS.uiBold, fontSize: 12, letterSpacing: 0.5 },

  // Progression
  progressCard: {
    backgroundColor: 'rgba(249,244,232,0.05)', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)', marginBottom: 10,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressLevel: { fontFamily: FONTS.displayBold, color: COLORS.gold, fontSize: 20 },
  progressLabel: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, flex: 1 },
  certBadge: { fontFamily: FONTS.uiBold, color: COLORS.success, fontSize: 12 },
  barBg: { height: 7, backgroundColor: 'rgba(249,244,232,0.1)', borderRadius: 4, marginBottom: 5 },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.accent },
  progressPct: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, textAlign: 'right', marginBottom: 10 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStat: { alignItems: 'center' },
  miniStatVal:   { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 16 },
  miniStatLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 10, letterSpacing: 1 },

  emptyProgress: { padding: 20, alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: COLORS.deep, borderRadius: 12, padding: 24, width: '85%', borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)' },
  modalTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20, marginBottom: 6 },
  modalSub: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, marginBottom: 14 },
  modalInput: {
    backgroundColor: 'rgba(249,244,232,0.07)', borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)',
    borderRadius: 8, padding: 12, color: COLORS.parchment, fontFamily: FONTS.regular, fontSize: 15, marginBottom: 16,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(249,244,232,0.2)', marginTop: 8 },
  modalCancelText: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  modalConfirm: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.accent },
  modalConfirmText: { fontFamily: FONTS.uiBold, color: 'white', fontSize: 13 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  levelChip: { borderWidth: 1.5, borderColor: 'rgba(184,137,58,0.4)', borderRadius: 6, paddingHorizontal: 18, paddingVertical: 10 },
  levelChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  levelChipText: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 14 },
});
