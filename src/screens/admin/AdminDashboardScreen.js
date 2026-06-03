import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const LEVEL_ORDER = ['A1','A2','B1','B2','C1','C2'];

export default function AdminDashboardScreen({ navigation }) {
  const { user, accessToken, logout } = useAuthStore();
  const [kpis, setKpis]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(setKpis)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byLevel = kpis?.learnersByLevel || {};
  const maxLevel = Math.max(1, ...Object.values(byLevel).map(Number));

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.overline}>ADMINISTRATION</Text>
            <Text style={s.title}>SprachReise</Text>
            <Text style={s.welcome}>Bonjour, {user?.firstName} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Text style={s.logoutIcon}>⎋</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 50 }} />
        ) : kpis ? (
          <>
            {/* ── Alertes ── */}
            {kpis.overdueApplications > 0 && (
              <TouchableOpacity style={s.alert} onPress={() => navigation.navigate('AdminApplications')} activeOpacity={0.8}>
                <Text style={s.alertIcon}>⚠</Text>
                <Text style={s.alertText}>
                  {kpis.overdueApplications} candidature(s) en attente depuis plus de 48h
                </Text>
                <Text style={s.alertArrow}>›</Text>
              </TouchableOpacity>
            )}
            {kpis.pendingApplications > 0 && kpis.overdueApplications === 0 && (
              <TouchableOpacity style={[s.alert, { borderColor: COLORS.warning + '66' }]} onPress={() => navigation.navigate('AdminApplications')} activeOpacity={0.8}>
                <Text style={s.alertIcon}>📋</Text>
                <Text style={[s.alertText, { color: COLORS.warning }]}>
                  {kpis.pendingApplications} candidature(s) en attente
                </Text>
                <Text style={[s.alertArrow, { color: COLORS.warning }]}>›</Text>
              </TouchableOpacity>
            )}

            {/* ── 6 KPIs ── */}
            <Text style={s.sectionTitle}>STATISTIQUES GÉNÉRALES</Text>
            <View style={s.kpiGrid}>
              <KpiCard value={kpis.activeLearners}    total={kpis.totalLearners}  label="Apprenants actifs" icon="🎓" color={COLORS.primary} />
              <KpiCard value={kpis.approvedTrainers}  total={kpis.totalTrainers}  label="Formateurs validés" icon="👨‍🏫" color={COLORS.accent} />
              <KpiCard value={kpis.publishedCourses}  total={kpis.totalCourses}   label="Cours publiés" icon="📚" color={COLORS.gold} />
              <KpiCard value={kpis.totalCertificates} label="Certificats délivrés" icon="🏅" color={COLORS.success} />
              <KpiCard value={kpis.pendingApplications} label="Candidatures en attente" icon="⏳" color={COLORS.warning} accent={kpis.pendingApplications > 0} />
              <KpiCard value={`${kpis.avgQcmScore}%`} label="Score QCM moyen" icon="📊" color={COLORS.muted} />
            </View>

            {/* ── Répartition niveaux ── */}
            <Text style={s.sectionTitle}>RÉPARTITION PAR NIVEAU</Text>
            <View style={s.levelChart}>
              {LEVEL_ORDER.map(lv => {
                const count = byLevel[lv] || 0;
                const pct = maxLevel > 0 ? (count / maxLevel) * 100 : 0;
                return (
                  <View key={lv} style={s.levelBar}>
                    <Text style={s.levelCount}>{count}</Text>
                    <View style={s.levelBarBg}>
                      <View style={[s.levelBarFill, { height: `${Math.max(4, pct)}%` }]} />
                    </View>
                    <Text style={s.levelLabel}>{lv}</Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 40 }}>Impossible de charger les données</Text>
        )}

        {/* ── Actions ── */}
        <Text style={s.sectionTitle}>GESTION</Text>
        <ActionCard icon="📋" title="Candidatures formateurs" sub={kpis ? `${kpis.pendingApplications} en attente` : '…'} onPress={() => navigation.navigate('AdminApplications')} urgent={kpis?.pendingApplications > 0} />
        <ActionCard icon="👥" title="Utilisateurs" sub={kpis ? `${kpis.totalLearners} apprenants · ${kpis.totalTrainers} formateurs` : '…'} onPress={() => navigation.navigate('AdminUsers')} />
        <ActionCard icon="🎬" title="Modération des cours" sub={kpis ? `${kpis.publishedCourses} cours publiés` : '…'} onPress={() => navigation.navigate('AdminContent')} />
        <ActionCard icon="🎓" title="Certificats" sub="Émettre · Révoquer · Traçabilité" onPress={() => navigation.navigate('AdminCertificates')} />

      </ScrollView>
    </SafeAreaView>
  );
}

const KpiCard = ({ value, total, label, icon, color, accent }) => (
  <View style={[s.kpiCard, accent && { borderColor: color + '66', backgroundColor: color + '11' }]}>
    <Text style={s.kpiIcon}>{icon}</Text>
    <Text style={[s.kpiValue, { color }]}>{value ?? 0}</Text>
    {total != null && <Text style={s.kpiTotal}>/ {total}</Text>}
    <Text style={s.kpiLabel}>{label}</Text>
  </View>
);

const ActionCard = ({ icon, title, sub, onPress, urgent }) => (
  <TouchableOpacity style={[s.actionCard, urgent && { borderColor: COLORS.warning + '55' }]} onPress={onPress} activeOpacity={0.8}>
    <Text style={s.actionIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={s.actionTitle}>{title}</Text>
      <Text style={s.actionSub}>{sub}</Text>
    </View>
    <Text style={s.actionArrow}>›</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll:    { padding: 22, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  overline: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 10, letterSpacing: 3 },
  title:    { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 28, marginTop: 2 },
  welcome:  { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutIcon: { fontSize: 22, color: COLORS.muted },

  alert: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1.5, borderColor: COLORS.error + '66',
    borderRadius: 8, padding: 12, marginBottom: 14,
  },
  alertIcon: { fontSize: 16 },
  alertText: { flex: 1, fontFamily: FONTS.uiMedium, color: COLORS.error, fontSize: 13 },
  alertArrow: { fontFamily: FONTS.regular, color: COLORS.error, fontSize: 18 },

  sectionTitle: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 10, letterSpacing: 3, marginBottom: 12, marginTop: 18 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '47%', backgroundColor: 'rgba(249,244,232,0.05)',
    borderRadius: 10, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)', gap: 2,
  },
  kpiIcon:  { fontSize: 20, marginBottom: 4 },
  kpiValue: { fontFamily: FONTS.displayBold, fontSize: 26 },
  kpiTotal: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 11 },
  kpiLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 10, letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },

  levelChart: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    height: 110, backgroundColor: 'rgba(249,244,232,0.04)',
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(184,137,58,0.15)',
  },
  levelBar: { alignItems: 'center', flex: 1, gap: 4 },
  levelCount: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 11 },
  levelBarBg: { width: 20, flex: 1, backgroundColor: 'rgba(249,244,232,0.1)', borderRadius: 4, justifyContent: 'flex-end' },
  levelBarFill: { width: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },
  levelLabel: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11 },

  actionCard: {
    backgroundColor: 'rgba(249,244,232,0.05)', borderRadius: 10, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.2)',
  },
  actionIcon:  { fontSize: 22 },
  actionTitle: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 15 },
  actionSub:   { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginTop: 2 },
  actionArrow: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 22 },
});
