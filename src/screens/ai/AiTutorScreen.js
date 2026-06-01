import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import MarkdownText from '../../components/MarkdownText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import api from '../../services/api';

const QUICK_QUESTIONS = [
  { label: '📚 Dativ',              text: 'Explique le cas Dativ avec des exemples simples.' },
  { label: '🔤 Verbe "sein"',       text: 'Comment conjuguer "sein" au présent ?' },
  { label: '🔢 der / die / das',    text: 'Quelle est la différence entre der, die, das ?' },
  { label: '💬 Se présenter',       text: 'Donne-moi une phrase pour me présenter en allemand.' },
  { label: '✏️ Corriger',           text: 'Peux-tu corriger cette phrase : ' },
];

function makeWelcome(userLevel) {
  return {
    id: 'welcome',
    role: 'assistant',
    text: `Hallo! 👋 Je suis **Max**, ton tuteur d'allemand IA.\n\nJe suis là pour t'aider avec :\n- 📚 Grammaire et règles\n- 🔤 Vocabulaire et traduction\n- ✏️ Corriger tes phrases\n- 💡 Expliquer les concepts\n\nTu es au niveau **${userLevel}**. Pose-moi ta première question !`,
  };
}

export default function AiTutorScreen({ navigation, route }) {
  const { level, user } = useAuthStore();
  const { saveConversation } = useChatStore();

  const userLevel   = level ?? 'A1';
  const resumeConv  = route?.params?.resumeConv ?? null;   // reprendre une conv existante
  const initialCtx  = route?.params?.context ?? '';
  const initialQ    = route?.params?.question ?? '';

  // ID de la conversation en cours (null = pas encore sauvegardée)
  const convIdRef = useRef(resumeConv?.id ?? null);
  const convContextRef = useRef(resumeConv?.context ?? initialCtx);

  const [messages, setMessages] = useState(() => {
    if (resumeConv) {
      // Reprendre une conversation existante : ajouter le message de bienvenue en tête
      return [makeWelcome(userLevel), ...resumeConv.messages];
    }
    const welcome = makeWelcome(userLevel);
    if (initialQ) return [welcome, { id: 'init_user', role: 'user', text: initialQ }];
    return [welcome];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  // ── Sauvegarde automatique dès qu'il y a une réponse IA ──────────────
  const autoSave = useCallback(async (msgs) => {
    const realMsgs = msgs.filter((m) => m.id !== 'welcome');
    if (realMsgs.length < 2) return;
    const savedId = await saveConversation({
      id:      convIdRef.current,
      level:   userLevel,
      context: convContextRef.current,
      messages: realMsgs,
    });
    if (savedId && !convIdRef.current) convIdRef.current = savedId;
  }, [userLevel, saveConversation]);

  // ── Envoyer la question initiale une seule fois ───────────────────────
  const initSent = useRef(false);
  useEffect(() => {
    if (initialQ && !initSent.current) {
      initSent.current = true;
      setTimeout(() => sendMessage(initialQ), 400);
    }
  }, []);

  // ── Sauvegarde quand on quitte l'écran ───────────────────────────────
  useEffect(() => {
    return () => { autoSave(messages); };
  }, [messages]);

  async function sendMessage(text) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput('');
    setLoading(true);

    const userMsg = { id: Date.now().toString(), role: 'user', text: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    const history = nextMessages
      .filter((m) => m.id !== 'welcome' && m.id !== 'init_user')
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

    // Ajouter le vrai message init_user s'il n'est pas encore dans history
    const initMsg = nextMessages.find((m) => m.id === 'init_user');
    if (initMsg && !history.find((h) => h.content === initMsg.text)) {
      history.unshift({ role: 'user', content: initMsg.text });
    }

    try {
      const { data } = await api.post('/ai/chat', {
        level:     userLevel,
        context:   convContextRef.current,
        firstName: user?.firstName ?? '',
        city:      user?.city ?? '',
        messages:  history,
      });
      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', text: data.reply };
      const withAI = [...nextMessages, aiMsg];
      setMessages(withAI);
      autoSave(withAI);   // sauvegarde après chaque réponse IA
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: '❌ Je ne suis pas disponible pour le moment. Vérifiez votre connexion internet.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  const renderBubble = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          {isUser
            ? <Text style={styles.bubbleTextUser}>{item.text}</Text>
            : <MarkdownText>{item.text}</MarkdownText>
          }
        </View>
      </View>
    );
  }, []);

  const isResumed = !!resumeConv;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>🤖 Tuteur IA Max</Text>
          <Text style={styles.headerSub}>
            {isResumed ? `Reprise · ${resumeConv.messages.length} messages` : `Niveau ${userLevel} · Toujours disponible`}
          </Text>
        </View>
        {/* Bouton historique */}
        <TouchableOpacity onPress={() => navigation?.navigate('ChatHistory')} style={styles.historyBtn}>
          <Text style={styles.historyIcon}>🕐</Text>
        </TouchableOpacity>
        <View style={styles.onlineDot} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderBubble}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading ? (
            <View style={styles.typingIndicator}>
              <View style={styles.avatar}><Text style={styles.avatarText}>🤖</Text></View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={COLORS.gold} />
                <Text style={styles.typingText}>Max rédige...</Text>
              </View>
            </View>
          ) : null}
        />

        {/* Questions rapides */}
        {messages.length <= 1 && (
          <View style={styles.quickContainer}>
            <Text style={styles.quickLabel}>Questions rapides :</Text>
            <FlatList
              data={QUICK_QUESTIONS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={styles.quickList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.quickChip} onPress={() => sendMessage(item.text)}>
                  <Text style={styles.quickChipText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Zone de saisie */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pose ta question à Max..."
            placeholderTextColor={COLORS.muted}
            multiline
            maxLength={500}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)',
  },
  backBtn: { padding: 4, marginRight: 8 },
  backText: { fontFamily: FONTS.regular, color: COLORS.gold, fontSize: 22 },
  headerInfo: { flex: 1 },
  headerTitle: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 15 },
  headerSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginTop: 1 },
  historyBtn: { padding: 6, marginRight: 6 },
  historyIcon: { fontSize: 18 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  messagesList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(184,137,58,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 6,
  },
  avatarText: { fontSize: 16 },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleAI: {
    backgroundColor: 'rgba(245,239,227,0.08)',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: { backgroundColor: COLORS.accent, borderBottomRightRadius: 4 },
  bubbleTextUser: { fontFamily: FONTS.regular, color: COLORS.parchment, fontSize: 14, lineHeight: 22 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  typingText: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, fontStyle: 'italic' },
  quickContainer: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.15)',
  },
  quickLabel: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11, marginBottom: 8 },
  quickList: { gap: 8 },
  quickChip: {
    backgroundColor: 'rgba(184,137,58,0.12)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(184,137,58,0.3)',
  },
  quickChipText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)',
    gap: 10,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(245,239,227,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(126,102,58,0.35)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: COLORS.parchment, fontFamily: FONTS.regular, fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(161,94,45,0.3)' },
  sendIcon: { color: COLORS.parchment, fontSize: 16, marginLeft: 2 },
});
