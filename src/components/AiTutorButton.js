/**
 * Bouton tuteur IA réutilisable.
 * - mode "inline" : répond dans un Modal (rapide, contextuel)
 * - mode "chat"   : ouvre l'écran de chat complet AiTutorScreen
 */
import { useState } from 'react';
import {
  TouchableOpacity, Text, View, Modal, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../constants/config';
import api from '../services/api';

export default function AiTutorButton({
  question = '',
  context  = '',
  level    = 'A1',
  mode     = 'explain',
  label,
  chatMode = false, // true → ouvre AiTutorScreen
}) {
  const navigation = useNavigation();
  const [loading, setLoading]   = useState(false);
  const [text, setText]         = useState(null);
  const [visible, setVisible]   = useState(false);

  const openChat = () => {
    navigation.navigate('AiTutor', { question, context, level });
  };

  const askInline = async () => {
    if (loading) return;
    setLoading(true);
    setText(null);
    try {
      const { data } = await api.post('/ai/explain', { level, question, context, mode });
      setText(data.explanation ?? 'Réponse reçue.');
    } catch {
      setText('Tuteur IA indisponible. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setVisible(true);
    }
  };

  const btnLabel = label ?? '🤖  Demander au tuteur IA';

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={chatMode ? openChat : askInline}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator size="small" color={COLORS.gold} />
          : <Text style={styles.btnText}>{btnLabel}</Text>
        }
      </TouchableOpacity>

      {/* Modal inline (non chatMode) */}
      {!chatMode && (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
          <View style={styles.overlay}>
            <View style={styles.card}>
              <Text style={styles.title}>🤖 Tuteur IA</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.body}>{text}</Text>
              </ScrollView>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => { setVisible(false); openChat(); }}
                >
                  <Text style={styles.chatBtnText}>💬 Continuer la conversation</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.close} onPress={() => setVisible(false)}>
                  <Text style={styles.closeText}>FERMER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.4)',
    borderRadius: 8, paddingVertical: 11, paddingHorizontal: 16,
    marginTop: 8,
  },
  btnText: { fontFamily: FONTS.uiMedium, color: COLORS.gold, fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#2A1D14', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 24, maxHeight: '72%',
  },
  title: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 20, marginBottom: 16 },
  scroll: { maxHeight: 260, marginBottom: 8 },
  body: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 24 },
  actions: { gap: 10, marginTop: 12 },
  chatBtn: {
    backgroundColor: 'rgba(184,137,58,0.15)', borderRadius: 8, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)',
  },
  chatBtnText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13 },
  close: {
    backgroundColor: COLORS.accent, borderRadius: 8, padding: 14, alignItems: 'center',
  },
  closeText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1 },
});
