import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const LANG_NAMES = { de: '🇩🇪 Allemand', en: '🇬🇧 Anglais', es: '🇪🇸 Espagnol', zh: '🇨🇳 Mandarin' };
const LEVEL_LABELS = { A1: 'A1 — Débutant', A2: 'A2 — Élémentaire', B1: 'B1 — Intermédiaire', B2: 'B2 — Intermédiaire supérieur', C1: 'C1 — Avancé', C2: 'C2 — Maîtrise' };

export default function AdminApplicationDetail({ route, navigation }) {
  const { application: app, onRefresh } = route.params;
  const { accessToken } = useAuthStore();
  const [motif, setMotif]     = useState('');
  const [loading, setLoading] = useState(false);

  const approve = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/applications/${app.profileId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ maxStudents: 30 }),
      });
      if (res.ok) {
        Alert.alert('Approuvée ✓', `La candidature de ${app.firstName} a été approuvée. Un email lui a été envoyé.`, [
          { text: 'OK', onPress: () => { onRefresh?.(); navigation.goBack(); } },
        ]);
      } else {
        const j = await res.json();
        Alert.alert('Erreur', j.error || `HTTP ${res.status}`);
      }
    } catch (e) { Alert.alert('Erreur réseau', e.message); }
    finally { setLoading(false); }
  };

  const reject = async () => {
    if (!motif.trim()) { Alert.alert('Motif requis', 'Veuillez saisir le motif de refus.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/applications/${app.profileId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ motif: motif.trim() }),
      });
      if (res.ok) {
        Alert.alert('Refusée', `La candidature de ${app.firstName} a été refusée.`, [
          { text: 'OK', onPress: () => { onRefresh?.(); navigation.goBack(); } },
        ]);
      } else {
        const j = await res.json();
        Alert.alert('Erreur', j.error || `HTTP ${res.status}`);
      }
    } catch (e) { Alert.alert('Erreur réseau', e.message); }
    finally { setLoading(false); }
  };

  const isPending = app.status === 'PENDING';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>‹ Retour</Text>
        </TouchableOpacity>

        <Text style={s.overline}>DOSSIER CANDIDATURE</Text>
        <Text style={s.name}>{app.firstName} {app.lastName}</Text>
        <View style={s.divider} />

        <InfoRow label="Email"    value={app.email} />
        <InfoRow label="Téléphone" value={app.phone || '—'} />
        <InfoRow label="Langue maternelle" value={app.nativeLanguage || '—'} />
        <InfoRow label="Niveau souhaité"   value={LEVEL_LABELS[app.teachingLevel] || app.teachingLevel} />
        <InfoRow label="Langue à enseigner" value={LANG_NAMES[app.teachingLang] || app.teachingLang?.toUpperCase()} />
        <InfoRow label="Soumis le" value={app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('fr') : '—'} />

        {/* Bouton consulter diplôme */}
        <TouchableOpacity
          style={s.diplomaBtn}
          onPress={() => navigation.navigate('DiplomaViewer', {
            profileId: app.profileId,
            candidateName: `${app.firstName} ${app.lastName}`,
          })}
          activeOpacity={0.8}
        >
          <Text style={s.diplomaIcon}>📄</Text>
          <Text style={s.diplomaText}>Consulter le diplôme (PDF)</Text>
          <Text style={s.diplomaArrow}>↗</Text>
        </TouchableOpacity>

        {app.bio ? (
          <View style={s.block}>
            <Text style={s.blockLabel}>BIOGRAPHIE</Text>
            <Text style={s.blockText}>{app.bio}</Text>
          </View>
        ) : null}

        {app.motivation ? (
          <View style={s.block}>
            <Text style={s.blockLabel}>LETTRE DE MOTIVATION</Text>
            <Text style={s.blockText}>{app.motivation}</Text>
          </View>
        ) : null}

        {app.reviewMotif ? (
          <View style={[s.block, { borderColor: COLORS.error + '44' }]}>
            <Text style={[s.blockLabel, { color: COLORS.error }]}>MOTIF DE REFUS</Text>
            <Text style={s.blockText}>{app.reviewMotif}</Text>
          </View>
        ) : null}

        {isPending && (
          <>
            <View style={s.separator} />
            <Text style={s.decisionTitle}>DÉCISION</Text>

            <TextInput
              style={s.motifInput}
              value={motif}
              onChangeText={setMotif}
              placeholder="Motif de refus (obligatoire si refus)..."
              placeholderTextColor={COLORS.muted}
              multiline
            />

            {loading ? (
              <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />
            ) : (
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.btn, s.btnApprove]} onPress={approve} activeOpacity={0.8}>
                  <Text style={s.btnText}>✓ APPROUVER</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.btnReject]} onPress={reject} activeOpacity={0.8}>
                  <Text style={[s.btnText, { color: COLORS.error }]}>✗ REFUSER</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { padding: 24, paddingBottom: 50 },

  back:     { marginBottom: 24 },
  backText: { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 15 },

  overline: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 10, letterSpacing: 3, marginBottom: 6 },
  name:     { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 28, marginBottom: 12 },
  divider:  { width: 50, height: 1.5, backgroundColor: COLORS.gold, marginBottom: 24 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(249,244,232,0.08)' },
  infoLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 12, letterSpacing: 0.5 },
  infoValue: { fontFamily: FONTS.regular, color: COLORS.parchment, fontSize: 13, flex: 1, textAlign: 'right' },

  diplomaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(184,137,58,0.12)', borderWidth: 1.5, borderColor: COLORS.gold,
    borderRadius: 8, padding: 14, marginTop: 16, marginBottom: 4,
  },
  diplomaIcon: { fontSize: 20 },
  diplomaText: { flex: 1, fontFamily: FONTS.uiMedium, color: COLORS.gold, fontSize: 14 },
  diplomaArrow: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 16 },

  block: { marginTop: 20, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(184,137,58,0.25)', backgroundColor: 'rgba(249,244,232,0.04)' },
  blockLabel: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  blockText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 14, lineHeight: 22 },

  separator: { height: 1, backgroundColor: 'rgba(249,244,232,0.1)', marginVertical: 24 },
  decisionTitle: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 10, letterSpacing: 3, marginBottom: 14 },

  motifInput: {
    backgroundColor: 'rgba(249,244,232,0.06)', borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)',
    borderRadius: 8, padding: 14, color: COLORS.parchment, fontFamily: FONTS.regular,
    fontSize: 14, height: 80, textAlignVertical: 'top', marginBottom: 20,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1.5 },
  btnApprove: { backgroundColor: COLORS.success + '22', borderColor: COLORS.success },
  btnReject:  { backgroundColor: COLORS.error + '11', borderColor: COLORS.error },
  btnText: { fontFamily: FONTS.uiBold, color: COLORS.success, fontSize: 13, letterSpacing: 1 },
});
