/**
 * Bouton + Modal tuteur IA réutilisable partout dans l'app.
 * Usage :
 *   <AiTutorButton question="..." context="..." level="A1" />
 */
import { useState } from 'react';
import {
  TouchableOpacity, Text, View, Modal, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { COLORS, FONTS } from '../constants/config';
import api from '../services/api';

export default function AiTutorButton({ question, context = '', level = 'A1', mode = 'explain', label }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState(null);
  const [visible, setVisible] = useState(false);

  const ask = async () => {
    if (loading) return;
    setLoading(true);
    setText(null);
    try {
      const { data } = await api.post('/ai/explain', { level, question, context, mode });
      setText(data.explanation ?? 'Réponse reçue.');
    } catch {
      setText('Tuteur IA indisponible pour le moment. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      setVisible(true);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={ask} disabled={loading}>
        {loading
          ? <ActivityIndicator size="small" color={COLORS.gold} />
          : <Text style={styles.btnText}>{label ?? '🤖  Demander au tuteur IA'}</Text>
        }
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>🤖 Tuteur IA</Text>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.body}>{text}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.close} onPress={() => setVisible(false)}>
              <Text style={styles.closeText}>FERMER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scroll: { maxHeight: 320, marginBottom: 8 },
  body: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 24 },
  close: {
    backgroundColor: COLORS.accent, borderRadius: 8, padding: 14,
    alignItems: 'center', marginTop: 16,
  },
  closeText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 13, letterSpacing: 1 },
});
