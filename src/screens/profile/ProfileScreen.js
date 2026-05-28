import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const initial = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ?? 'LEARNER'}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Niveau" value="A1" />
          <StatCard label="Cours" value="0" />
          <StatCard label="Certificats" value="0" />
        </View>

        <View style={styles.menu}>
          <MenuItem label="Mon abonnement" icon="💎" />
          <MenuItem label="Mes certificats" icon="📜" />
          <MenuItem label="Paramètres" icon="⚙️" />
          <MenuItem label="Aide & Support" icon="💬" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ label, icon }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  avatarText: { color: COLORS.parchment, fontSize: 28, fontWeight: 'bold' },
  name: { color: COLORS.parchment, fontSize: 22, fontWeight: 'bold' },
  email: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  roleBadge: {
    backgroundColor: 'rgba(161,94,45,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    marginBottom: 24,
  },
  roleText: { color: COLORS.gold, fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28, width: '100%' },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(245,239,227,0.07)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.3)',
  },
  statValue: { color: COLORS.parchment, fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  menu: { width: '100%', marginBottom: 24 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  menuIcon: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, color: COLORS.parchment, fontSize: 15 },
  menuArrow: { color: COLORS.muted, fontSize: 20 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  logoutText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
});
