import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Guten Tag,</Text>
            <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Niveau actuel</Text>
          <Text style={styles.cardValue}>A1 — Débutant</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '15%' }]} />
          </View>
          <Text style={styles.progressText}>15% complété</Text>
        </View>

        <Text style={styles.sectionTitle}>Continuer l'apprentissage</Text>

        {['Introduction à l\'allemand', 'Les salutations', 'Chiffres et couleurs'].map((title, i) => (
          <TouchableOpacity key={i} style={styles.lessonCard}>
            <View style={styles.lessonIcon}>
              <Text style={styles.lessonIconText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lessonTitle}>{title}</Text>
              <Text style={styles.lessonSub}>Niveau A1 · 20 min</Text>
            </View>
            <Text style={styles.lessonArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Sessions live à venir</Text>
        <View style={styles.liveCard}>
          <Text style={styles.liveBadge}>🔴 LIVE</Text>
          <Text style={styles.liveTitle}>Grammaire A1 — Conversation</Text>
          <Text style={styles.liveSub}>Demain à 18h00 · Dr. Nguema</Text>
          <TouchableOpacity style={styles.liveBtn}>
            <Text style={styles.liveBtnText}>RÉSERVER MA PLACE</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    marginBottom: 24,
  },
  greeting: { color: COLORS.muted, fontSize: 14 },
  name: { color: COLORS.parchment, fontSize: 22, fontWeight: 'bold' },
  logoutBtn: { padding: 8 },
  logoutText: { color: COLORS.muted, fontSize: 12 },
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 20,
    marginBottom: 28,
  },
  cardLabel: { color: 'rgba(249,244,232,0.7)', fontSize: 12, marginBottom: 4 },
  cardValue: { color: COLORS.parchment, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  progressBar: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    height: 6,
    marginBottom: 6,
  },
  progressFill: { backgroundColor: COLORS.gold, borderRadius: 4, height: 6 },
  progressText: { color: 'rgba(249,244,232,0.6)', fontSize: 11 },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  lessonCard: {
    backgroundColor: 'rgba(245,239,227,0.07)',
    borderRadius: 6,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.3)',
  },
  lessonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonIconText: { color: COLORS.parchment, fontWeight: 'bold' },
  lessonTitle: { color: COLORS.parchment, fontSize: 14, fontWeight: '600' },
  lessonSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  lessonArrow: { color: COLORS.gold, fontSize: 22 },
  liveCard: {
    backgroundColor: 'rgba(161,94,45,0.15)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  liveBadge: { color: '#EF4444', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  liveTitle: { color: COLORS.parchment, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  liveSub: { color: COLORS.muted, fontSize: 13, marginBottom: 14 },
  liveBtn: {
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  liveBtnText: { color: COLORS.parchment, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
});
