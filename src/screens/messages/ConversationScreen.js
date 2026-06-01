import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ConversationScreen({ route, navigation }) {
  const { otherUserId, otherName } = route?.params ?? {};
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/messages/conversation/${otherUserId}`);
      setMessages(data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [otherUserId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setText('');
    try {
      await api.post('/messages', { recipientId: otherUserId, content });
      await load();
    } catch {} finally { setSending(false); }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {item.sentAt ? new Date(item.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{otherName ?? 'Conversation'}</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Écrire un message..."
            placeholderTextColor={COLORS.muted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
            onPress={send}
            disabled={!text.trim() || sending}
          >
            {sending ? <ActivityIndicator color={COLORS.parchment} size="small" /> : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  backText: { color: COLORS.gold, fontSize: 26 },
  headerTitle: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 17 },
  list: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '78%', borderRadius: 14, padding: 12,
    backgroundColor: 'rgba(245,239,227,0.08)',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderColor: 'rgba(126,102,58,0.4)',
  },
  bubbleOther: { alignSelf: 'flex-start' },
  bubbleText: { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 22 },
  bubbleTextMe: { color: COLORS.parchment },
  bubbleTime: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(249,244,232,0.6)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)',
    backgroundColor: COLORS.deep,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(245,239,227,0.07)',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.4)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: COLORS.parchment, fontFamily: FONTS.regular, fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: COLORS.parchment, fontSize: 18 },
});
