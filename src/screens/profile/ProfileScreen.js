import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const initial = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '');
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Mon Profil';
  const role = user?.role ?? 'LEARNER';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Niveau" value="A1" />
          <StatCard label="Cours" value="2" />
          <StatCard label="Certificats" value="0" />
        </View>

        <Text style={styles.sectionLabel}>MON COMPTE</Text>
        <View style={styles.menu}>
          <MenuItem label="Mon abonnement" icon="💎" badge="STANDARD" />
          <MenuItem label="Mes certificats" icon="📜" />
          <MenuItem label="Mon historique" icon="📊" />
        </View>

        <Text style={styles.sectionLabel}>PARAMÈTRES</Text>
        <View style={styles.menu}>
          <MenuItem label="Notifications" icon="🔔" />
          <MenuItem label="Langue de l'interface" icon="🌐" badge="FR" />
          <MenuItem label="Aide & Support" icon="💬" />
          <MenuItem label="À propos" icon="ℹ️" />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SprachReise v1.0.0</Text>

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

function MenuItem({ label, icon, badge }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuIconWrap}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingTop: 32, marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(184,137,58,0.4)',
  },
  avatarText: {
    fontFamily: FONTS.displayBold,
    color: COLORS.parchment,
    fontSize: 28,
  },
  name: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 22,
    marginBottom: 4,
  },
  email: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(161,94,45,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(161,94,45,0.3)',
  },
  roleText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 1,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(245,239,227,0.06)',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.2)',
  },
  statValue: {
    fontFamily: FONTS.displayBold,
    color: COLORS.parchment,
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 11,
  },

  sectionLabel: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  menu: {
    backgroundColor: 'rgba(245,239,227,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.15)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(126,102,58,0.1)',
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(126,102,58,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: { fontSize: 16 },
  menuLabel: {
    flex: 1,
    fontFamily: FONTS.uiMedium,
    color: COLORS.cream,
    fontSize: 14,
  },
  menuBadge: {
    backgroundColor: 'rgba(184,137,58,0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  menuBadgeText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  menuArrow: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 20,
  },

  logoutBtn: {
    borderWidth: 1,
    borderColor: 'rgba(161,94,45,0.5)',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.accent,
    fontSize: 13,
    letterSpacing: 1,
  },

  version: {
    fontFamily: FONTS.ui,
    color: 'rgba(174,145,130,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
});
