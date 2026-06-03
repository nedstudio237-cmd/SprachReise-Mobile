import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, COLORS, FONTS } from '../../constants/config';

const STATUS_CONFIG = {
  TRIAL:   { label: 'Essai gratuit', color: '#10B981', bg: '#ECFDF5', icon: 'gift' },
  ACTIVE:  { label: 'Actif',         color: COLORS.gold, bg: '#FEF9EE', icon: 'checkmark-circle' },
  EXPIRED: { label: 'Expiré',        color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle' },
  CANCELLED:{ label: 'Annulé',       color: '#6B7280', bg: '#F9FAFB', icon: 'remove-circle' },
};

const PLAN_ICONS = { TRIAL: '🎁', BASIC: '🥉', STANDARD: '⭐', PREMIUM: '🏆' };

const METHOD_LABELS = {
  STRIPE: 'Carte bancaire',
  CAMPAY_ORANGE: 'Orange Money',
  CAMPAY_MTN: 'MTN Money',
  PAYPAL: 'PayPal',
};

export default function SubscriptionScreen({ navigation }) {
  const { accessToken } = useAuthStore();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await r.json();
      setData(json);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const status    = data ? (STATUS_CONFIG[data.status] ?? STATUS_CONFIG.TRIAL) : null;
  const isExpired = data?.status === 'EXPIRED' || data?.status === 'CANCELLED';
  const isTrial   = data?.status === 'TRIAL';
  const isActive  = data?.status === 'ACTIVE';

  const goToPay = (plan = 'STANDARD') => navigation.navigate('Payment', { plan, fromProfile: true });

  if (loading) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.deep} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mon abonnement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>

        {/* ── Statut actuel ── */}
        {data && (
          <View style={[s.statusCard, { borderColor: status.color + '44', backgroundColor: status.bg }]}>
            <View style={s.statusRow}>
              <View style={[s.statusBadge, { backgroundColor: status.color }]}>
                <Ionicons name={status.icon} size={16} color="white" />
                <Text style={s.statusBadgeTxt}>{status.label.toUpperCase()}</Text>
              </View>
              <Text style={s.planBig}>{PLAN_ICONS[data.plan] ?? '📦'} {data.planName}</Text>
            </View>

            {/* Jours restants */}
            {(isTrial || isActive) && data.daysLeft >= 0 && (
              <View style={s.daysBox}>
                <Text style={[s.daysNum, { color: data.daysLeft <= 5 ? '#EF4444' : status.color }]}>
                  {data.daysLeft}
                </Text>
                <Text style={s.daysTxt}>jour{data.daysLeft > 1 ? 's' : ''} restant{data.daysLeft > 1 ? 's' : ''}</Text>
              </View>
            )}

            <View style={s.dateRow}>
              {isTrial && data.trialEndsAt && (
                <Text style={s.dateInfo}>⏳ Essai jusqu'au <Text style={{ fontWeight: '700' }}>{data.trialEndsAt}</Text></Text>
              )}
              {isActive && data.subscriptionEndsAt && (
                <Text style={s.dateInfo}>📅 Renouvellement le <Text style={{ fontWeight: '700' }}>{data.subscriptionEndsAt}</Text></Text>
              )}
              {isExpired && (
                <Text style={[s.dateInfo, { color: '#EF4444' }]}>❌ Abonnement expiré — accès suspendu</Text>
              )}
            </View>

            {/* Barre de progression de la période */}
            {(isTrial || isActive) && (
              <View style={s.progressBar}>
                <View style={[s.progressFill, {
                  width: `${Math.min(100, Math.max(0, (1 - data.daysLeft / (isTrial ? 7 : 30)) * 100))}%`,
                  backgroundColor: data.daysLeft <= 5 ? '#EF4444' : status.color
                }]} />
              </View>
            )}
          </View>
        )}

        {/* ── CTA renouvellement / souscription ── */}
        {(isExpired || isTrial) && (
          <View style={s.ctaBox}>
            <Text style={s.ctaTitle}>{isExpired ? '🔄 Renouveler l\'abonnement' : '🚀 Passer à un plan payant'}</Text>
            <Text style={s.ctaSub}>
              {isExpired
                ? 'Votre accès est suspendu. Renouvelez pour reprendre vos cours.'
                : 'Profitez de toutes les fonctionnalités sans limite.'}
            </Text>
            <View style={s.ctaPlans}>
              {[['BASIC','3 000 FCFA','🥉'],['STANDARD','7 500 FCFA','⭐'],['PREMIUM','15 000 FCFA','🏆']].map(([key,price,icon]) => (
                <TouchableOpacity key={key} style={s.ctaPlan} onPress={() => goToPay(key)}>
                  <Text style={s.ctaPlanIcon}>{icon}</Text>
                  <Text style={s.ctaPlanName}>{key}</Text>
                  <Text style={s.ctaPlanPrice}>{price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isActive && (
          <TouchableOpacity style={s.renewBtn} onPress={() => goToPay(data.plan)}>
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={s.renewBtnTxt}>RENOUVELER MAINTENANT</Text>
          </TouchableOpacity>
        )}

        {/* ── Fonctionnalités du plan ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CE QUI EST INCLUS</Text>
          {getFeaturesForPlan(data?.plan).map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} />
              <Text style={s.featureTxt}>{f}</Text>
            </View>
          ))}
        </View>

        {/* ── Historique des paiements ── */}
        {data?.payments?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>HISTORIQUE DES PAIEMENTS</Text>
            {data.payments.map((p, i) => (
              <View key={i} style={s.payRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.payPlan}>{PLAN_ICONS[p.plan] ?? '📦'} {p.plan}</Text>
                  <Text style={s.payMeta}>{METHOD_LABELS[p.method] ?? p.method} · {p.date}</Text>
                </View>
                <View>
                  <Text style={s.payAmount}>{parseFloat(p.amount).toLocaleString()} {p.currency}</Text>
                  <View style={[s.payStatusBadge, { backgroundColor: p.status === 'SUCCESS' ? '#ECFDF5' : '#FEF2F2' }]}>
                    <Text style={[s.payStatusTxt, { color: p.status === 'SUCCESS' ? '#10B981' : '#EF4444' }]}>
                      {p.status === 'SUCCESS' ? 'Payé' : p.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Info CGU ── */}
        <View style={s.legalBox}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.muted} />
          <Text style={s.legalTxt}>
            L'abonnement se renouvelle automatiquement chaque mois. Vous pouvez annuler à tout moment
            depuis cette page. Vos données et progression sont conservées même après expiration.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getFeaturesForPlan(plan) {
  const base = ['Cursus QCM et mini-jeux','Profils formateurs publics','Tuteur IA Max 24h/24','Suivi de progression'];
  const std  = [...base, 'Vidéos de cours','Téléchargement PDF','Évaluations formateur'];
  const prem = [...std, 'Sessions live en direct','Certificats signés','Contact direct formateurs'];
  if (plan === 'PREMIUM') return prem;
  if (plan === 'STANDARD') return std;
  return base;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.deep, fontStyle: 'italic' },

  statusCard: { borderRadius: 16, padding: 20, borderWidth: 1.5 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusBadgeTxt:{ fontFamily: FONTS.uiBold, fontSize: 10, color: 'white', letterSpacing: 1 },
  planBig:    { fontFamily: FONTS.uiBold, fontSize: 18, color: COLORS.deep },

  daysBox:    { alignItems: 'center', marginVertical: 8 },
  daysNum:    { fontFamily: FONTS.displayBold, fontSize: 48, lineHeight: 52 },
  daysTxt:    { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },

  dateRow:    { marginTop: 8 },
  dateInfo:   { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.deep },

  progressBar:  { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  ctaBox:    { backgroundColor: COLORS.parchment, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.paperDeep },
  ctaTitle:  { fontFamily: FONTS.uiBold, fontSize: 18, color: COLORS.deep, marginBottom: 6 },
  ctaSub:    { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginBottom: 16, lineHeight: 20 },
  ctaPlans:  { flexDirection: 'row', gap: 10 },
  ctaPlan:   { flex: 1, backgroundColor: COLORS.paperDeep, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  ctaPlanIcon:{ fontSize: 22 },
  ctaPlanName:{ fontFamily: FONTS.uiBold, fontSize: 11, color: COLORS.deep },
  ctaPlanPrice:{ fontFamily: FONTS.ui, fontSize: 10, color: COLORS.muted },

  renewBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14 },
  renewBtnTxt: { fontFamily: FONTS.uiBold, fontSize: 14, color: 'white', letterSpacing: 0.5 },

  section:      { backgroundColor: COLORS.parchment, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.paperDeep },
  sectionTitle: { fontFamily: FONTS.uiBold, fontSize: 11, color: COLORS.muted, letterSpacing: 2, marginBottom: 12 },
  featureRow:   { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 },
  featureTxt:   { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.deep, flex: 1 },

  payRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  payPlan:        { fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.deep },
  payMeta:        { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 2 },
  payAmount:      { fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.accent, textAlign: 'right' },
  payStatusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-end' },
  payStatusTxt:   { fontFamily: FONTS.uiBold, fontSize: 10 },

  legalBox: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: COLORS.paperDeep, borderRadius: 10 },
  legalTxt: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, flex: 1, lineHeight: 17 },
});
