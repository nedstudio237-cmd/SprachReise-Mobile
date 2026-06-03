import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS } from '../../constants/config';

export default function TrainerPendingScreen() {
  const { user, trainerStatus, logout } = useAuthStore();

  const isRejected = trainerStatus === 'REJECTED';

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <Text style={s.icon}>{isRejected ? '✗' : '⏳'}</Text>

        <Text style={s.title}>
          {isRejected ? 'Candidature refusée' : 'Candidature en attente'}
        </Text>

        <View style={s.divider} />

        <Text style={s.body}>
          {isRejected
            ? 'Votre candidature formateur n\'a pas été retenue.\nVous pouvez soumettre une nouvelle candidature avec un dossier complet.'
            : `Bonjour ${user?.firstName},\n\nVotre dossier est en cours d'examen par l'administration.\n\nVous recevrez un email dès qu'il sera traité (sous 48 h).`
          }
        </Text>

        <View style={s.infoBox}>
          <Text style={s.infoLabel}>STATUT</Text>
          <Text style={[s.infoValue, { color: isRejected ? COLORS.error : COLORS.warning }]}>
            {isRejected ? 'REFUSÉE' : 'EN ATTENTE D\'APPROBATION'}
          </Text>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  icon: { fontSize: 52, marginBottom: 24 },
  title: {
    fontFamily: FONTS.display, color: COLORS.parchment,
    fontSize: 28, textAlign: 'center', marginBottom: 14,
  },
  divider: { width: 50, height: 1.5, backgroundColor: COLORS.gold, marginBottom: 24 },
  body: {
    fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 15,
    textAlign: 'center', lineHeight: 24, marginBottom: 28,
  },
  infoBox: {
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)',
    borderRadius: 8, padding: 16, width: '100%', alignItems: 'center', marginBottom: 36,
  },
  infoLabel: {
    fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 10, letterSpacing: 2, marginBottom: 6,
  },
  infoValue: { fontFamily: FONTS.uiBold, fontSize: 13, letterSpacing: 1 },
  logoutBtn: {
    borderWidth: 1.5, borderColor: COLORS.muted, borderRadius: 6,
    paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center',
  },
  logoutText: { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 13, letterSpacing: 1.5 },
});
