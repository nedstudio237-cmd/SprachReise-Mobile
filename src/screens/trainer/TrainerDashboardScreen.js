import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

export default function TrainerDashboardScreen({ navigation }) {
  const { user, accessToken, logout } = useAuthStore();
  const totalUnread = useMessageStore(s => s.totalUnread());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/trainer/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.overline}>ESPACE FORMATEUR</Text>
            <Text style={s.title}>Bonjour, {user?.firstName} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Text style={s.logoutText}>⎋</Text>
          </TouchableOpacity>
        </View>

        {/* Badge niveau */}
        {stats && (
          <View style={s.levelBadge}>
            <Text style={s.levelText}>Niveau {stats.teachingLevel} · Formateur approuvé</Text>
          </View>
        )}

        {/* Stats */}
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : stats ? (
          <View style={s.statsRow}>
            <StatCard value={stats.publishedCourses} label="Cours publiés" />
            <StatCard value={stats.totalLearners}    label="Apprenants" />
            <StatCard value={stats.upcomingSessions} label="Sessions" />
          </View>
        ) : null}

        <View style={s.divider} />

        {/* Actions */}
        <Text style={s.sectionTitle}>ACTIONS RAPIDES</Text>

        <ActionCard
          icon="📚"
          title="Mes cours"
          subtitle="Gérer et publier vos cours"
          onPress={() => navigation.navigate('TrainerCourses')}
        />
        <ActionCard
          icon="➕"
          title="Créer un cours"
          subtitle="Nouveau cours vidéo + PDF"
          onPress={() => navigation.navigate('TrainerCreateCourse')}
        />
        <ActionCard
          icon="📅"
          title="Sessions live"
          subtitle="Programmer une session en direct"
          onPress={() => navigation.navigate('TrainerSessions')}
        />
        <ActionCard
          icon="📝"
          title="Évaluations"
          subtitle="Créer et corriger des épreuves"
          onPress={() => navigation.navigate('TrainerExams')}
        />
        <ActionCard
          icon="🧩"
          title="Mes QCMs"
          subtitle="Créer et publier des questionnaires"
          onPress={() => navigation.navigate('TrainerQcms')}
        />
        <ActionCard
          icon="👥"
          title="Mes apprenants"
          subtitle="Suivi de progression"
          onPress={() => navigation.navigate('TrainerLearners')}
        />
        <ActionCard
          icon="💬"
          title="Messages"
          subtitle="Conversations apprenants"
          onPress={() => navigation.navigate('TrainerMessages')}
          badge={totalUnread > 0 ? totalUnread : null}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ value, label }) => (
  <View style={s.statCard}>
    <Text style={s.statValue}>{value ?? 0}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const ActionCard = ({ icon, title, subtitle, onPress, disabled, badge }) => (
  <TouchableOpacity
    style={[s.actionCard, disabled && { opacity: 0.45 }]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <Text style={s.actionIcon}>{icon}</Text>
    <View style={s.actionText}>
      <Text style={s.actionTitle}>{title}</Text>
      <Text style={s.actionSub}>{subtitle}</Text>
    </View>
    {badge ? (
      <View style={s.badge}>
        <Text style={s.badgeTxt}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    ) : (
      <Text style={s.actionArrow}>›</Text>
    )}
  </TouchableOpacity>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  scroll:    { padding: 24, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  overline: { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 10, letterSpacing: 3 },
  title:    { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 26, marginTop: 4 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 20, color: COLORS.muted },

  levelBadge: {
    backgroundColor: COLORS.deep, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    alignSelf: 'flex-start', marginBottom: 24,
  },
  levelText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 12, letterSpacing: 1 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 8,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.paperDeep,
  },
  statValue: { fontFamily: FONTS.displayBold, color: COLORS.accent, fontSize: 28 },
  statLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 11, letterSpacing: 1, marginTop: 4 },

  divider: { height: 1, backgroundColor: COLORS.paperDeep, marginBottom: 20 },
  sectionTitle: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 10, letterSpacing: 3, marginBottom: 14 },

  actionCard: {
    backgroundColor: 'white', borderRadius: 8, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.paperDeep,
  },
  actionIcon:  { fontSize: 22 },
  actionText:  { flex: 1 },
  actionTitle: { fontFamily: FONTS.uiBold, color: COLORS.deep, fontSize: 15 },
  actionSub:   { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, marginTop: 2 },
  actionArrow: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 22 },
  badge:    { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 11 },
});
