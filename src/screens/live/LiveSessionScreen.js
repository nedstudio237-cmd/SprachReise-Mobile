import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  KeyboardAvoidingView, Platform, Alert, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const { height: SCREEN_H } = Dimensions.get('window');

const STOMP_URL = API_BASE_URL
  .replace('/api', '/ws/websocket')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

// ══════════════════════════════════════════════════════════════════════════════
export default function LiveSessionScreen({ route, navigation }) {
  const { sessionId, isTrainer = false } = route.params || {};
  const { accessToken, user } = useAuthStore();

  const [session, setSession]         = useState(null);
  const [sessionStatus, setStatus]    = useState('SCHEDULED');
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [showChat, setShowChat]       = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [attendees, setAttendees]     = useState(1);
  const [jitsiReady, setJitsiReady]   = useState(false);

  const stompRef    = useRef(null);
  const flatRef     = useRef(null);
  const chatAnim    = useRef(new Animated.Value(0)).current;
  const showChatRef = useRef(false);
  const webviewRef  = useRef(null);

  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Participant';
  // Nom de room Jitsi unique par session
  const jitsiRoom = `SprachReise-Session-${sessionId}`;

  // ── Charger la session ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/sessions/${sessionId}/join`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await r.json();
        if (!r.ok) { Alert.alert('Erreur', data.error || 'Impossible de rejoindre'); navigation.goBack(); return; }
        setSession(data.session);
        setStatus(data.session?.status ?? 'SCHEDULED');
      } catch (e) { Alert.alert('Erreur réseau', e.message); navigation.goBack(); }
    })();
  }, [sessionId]);

  // ── STOMP — chat + statut + présence ─────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !accessToken) return;

    const client = new Client({
      brokerURL: STOMP_URL,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Chat instantané
        client.subscribe(`/topic/live/${sessionId}/chat`, (msg) => {
          const body = JSON.parse(msg.body);
          setMessages(prev => [...prev, body]);
          if (!showChatRef.current) setUnreadCount(c => c + 1);
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
        });

        // Changement de statut (SCHEDULED → LIVE → ENDED)
        client.subscribe(`/topic/live/${sessionId}/status`, (msg) => {
          const body = JSON.parse(msg.body);
          setStatus(body.status);
          if (body.status === 'ENDED' && !isTrainer) {
            Alert.alert('Session terminée', 'Le formateur a mis fin à la session.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
        });

        // Présence — compteur de participants
        client.subscribe(`/topic/live/${sessionId}/presence`, (msg) => {
          const body = JSON.parse(msg.body);
          if (body.count != null) setAttendees(body.count);
        });

        client.publish({
          destination: `/app/live/${sessionId}/presence`,
          body: JSON.stringify({ event: 'JOIN' }),
        });
      },
    });
    client.activate();
    stompRef.current = client;

    return () => {
      if (client.connected) {
        client.publish({ destination: `/app/live/${sessionId}/presence`, body: JSON.stringify({ event: 'LEAVE' }) });
      }
      client.deactivate();
    };
  }, [sessionId, accessToken]);

  useEffect(() => {
    showChatRef.current = showChat;
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  // ── Démarrer le live ──────────────────────────────────────────────────────
  const startLive = async () => {
    try {
      await fetch(`${API_BASE_URL}/sessions/${sessionId}/status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIVE' }),
      });
    } catch (e) { Alert.alert('Erreur', e.message); }
  };

  // ── Quitter / Terminer ────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    Alert.alert(
      isTrainer ? 'Terminer la session' : 'Quitter le live',
      isTrainer ? 'Cela terminera la session pour tous les participants.' : 'Voulez-vous quitter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isTrainer ? 'Terminer' : 'Quitter', style: 'destructive',
          onPress: async () => {
            if (isTrainer) {
              await fetch(`${API_BASE_URL}/sessions/${sessionId}/status`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ENDED' }),
              }).catch(() => {});
            } else {
              await fetch(`${API_BASE_URL}/sessions/${sessionId}/leave`, {
                method: 'POST', headers: { Authorization: `Bearer ${accessToken}` },
              }).catch(() => {});
            }
            navigation.goBack();
          },
        },
      ]
    );
  }, [sessionId, isTrainer, accessToken]);

  // ── Envoyer un message ────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !stompRef.current?.connected) return;
    stompRef.current.publish({
      destination: `/app/live/${sessionId}/chat`,
      body: JSON.stringify({ message: input.trim() }),
    });
    setInput('');
  };

  // ── Animation chat ────────────────────────────────────────────────────────
  const toggleChat = () => {
    const toValue = showChat ? 0 : 1;
    setShowChat(!showChat);
    Animated.spring(chatAnim, { toValue, useNativeDriver: true, tension: 60, friction: 12 }).start();
  };

  const chatTranslateY = chatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H * 0.45, 0],
  });

  // ── HTML Jitsi Meet (injection dans WebView) ──────────────────────────────
  const jitsiHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#0A0C14; overflow:hidden; }
    #jitsi-container { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="jitsi-container"></div>
  <script src="https://meet.jit.si/external_api.js"></script>
  <script>
    var domain = 'meet.jit.si';
    var options = {
      roomName: '${jitsiRoom}',
      width: '100%',
      height: '100%',
      parentNode: document.getElementById('jitsi-container'),
      userInfo: {
        displayName: '${userName.replace(/'/g, "\\'")}${isTrainer ? ' (Formateur)' : ''}',
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        toolbarButtons: ['microphone','camera','hangup','tileview','chat'],
        notifications: [],
        hideConferenceSubject: true,
        disableInviteFunctions: true,
        disableProfile: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: ['microphone','camera','hangup','tileview'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_POWERED_BY: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        DEFAULT_BACKGROUND: '#0A0C14',
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        HIDE_INVITE_MORE_HEADER: true,
      },
    };
    var api = new JitsiMeetExternalAPI(domain, options);
    api.addEventListener('videoConferenceJoined', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    });
    api.addEventListener('participantJoined', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'participant-joined', id: e.id }));
    });
    api.addEventListener('participantLeft', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'participant-left', id: e.id }));
    });
  </script>
</body>
</html>
`;

  // ── Salle d'attente ───────────────────────────────────────────────────────
  if (sessionStatus === 'SCHEDULED') {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.waitingRoom}>
          <View style={s.waitingIcon}><Text style={{ fontSize: 56 }}>🎓</Text></View>
          <Text style={s.waitingTitle}>{session?.title ?? 'Session en attente'}</Text>
          <Text style={s.waitingSubtitle}>La session n'a pas encore commencé</Text>
          {isTrainer ? (
            <TouchableOpacity style={s.startBtn} onPress={startLive}>
              <Ionicons name="radio" size={20} color="white" />
              <Text style={s.startBtnTxt}>DÉMARRER LE LIVE</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.waitingSpinner}>
              <View style={s.waitingDot} />
              <Text style={s.waitingHint}>En attente du formateur…</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.leaveWaiting}>
            <Text style={s.leaveWaitingTxt}>Quitter la salle d'attente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionStatus === 'ENDED' && isTrainer) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.waitingRoom}>
          <Text style={{ fontSize: 56 }}>✅</Text>
          <Text style={s.waitingTitle}>Session terminée</Text>
          <TouchableOpacity style={s.startBtn} onPress={() => navigation.replace('LiveStats', { sessionId })}>
            <Text style={s.startBtnTxt}>VOIR LES STATISTIQUES</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Session LIVE ──────────────────────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* ── Jitsi WebView — vidéo + audio réels ── */}
      <WebView
        ref={webviewRef}
        style={s.webview}
        source={{ html: jitsiHtml }}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'ready') setJitsiReady(true);
            if (msg.type === 'participant-joined') setAttendees(c => c + 1);
            if (msg.type === 'participant-left')   setAttendees(c => Math.max(1, c - 1));
          } catch {}
        }}
      />

      {/* ── Header flottant ── */}
      <View style={s.floatingHeader}>
        <View style={s.livePill}>
          <View style={s.liveDot} />
          <Text style={s.liveLabel}>EN DIRECT</Text>
        </View>
        <Text style={s.sessionName} numberOfLines={1}>{session?.title ?? 'Live'}</Text>
        <View style={s.attendeePill}>
          <Ionicons name="people" size={13} color={COLORS.gold} />
          <Text style={s.attendeeNum}>{attendees}</Text>
        </View>
      </View>

      {/* ── Boutons flottants droite ── */}
      <View style={s.floatingRight}>
        {/* Chat SprachReise */}
        <TouchableOpacity style={[s.fab, showChat && s.fabActive]} onPress={toggleChat}>
          <Ionicons name="chatbubbles" size={22} color="white" />
          {unreadCount > 0 && (
            <View style={s.fabBadge}>
              <Text style={s.fabBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Raccrocher */}
        <TouchableOpacity style={[s.fab, s.fabLeave]} onPress={handleLeave}>
          <Ionicons name="call" size={22} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* ── Panneau chat STOMP (questions/réponses instantanées) ── */}
      <Animated.View style={[s.chatPanel, { transform: [{ translateY: chatTranslateY }] }]}>
        <View style={s.chatHandle}><View style={s.handleBar} /></View>

        <View style={s.chatHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.chatTitle}>Chat · {session?.title}</Text>
            <View style={s.livePillSmall}>
              <View style={s.liveDotSmall} />
              <Text style={s.liveLabelSmall}>INSTANTANÉ</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleChat}>
            <Ionicons name="chevron-down" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMe = item.sender === userName;
            return (
              <View style={[s.msgRow, isMe && s.msgRowMe]}>
                {!isMe && (
                  <View style={s.msgAvatar}>
                    <Text style={s.msgAvatarTxt}>{(item.sender || '?')[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ maxWidth: '75%' }}>
                  {!isMe && <Text style={s.msgSender}>{item.sender}</Text>}
                  <View style={[s.msgBubble, isMe && s.msgBubbleMe]}>
                    <Text style={s.msgText}>{item.message}</Text>
                    <Text style={s.msgTime}>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={s.chatEmptyBox}>
              <Text style={s.chatEmptyIcon}>💬</Text>
              <Text style={s.chatEmpty}>Aucun message pour l'instant.</Text>
              <Text style={s.chatEmptySub}>Posez vos questions ici, tout le monde les voit en temps réel.</Text>
            </View>
          }
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.chatInputRow}>
            <TextInput
              style={s.chatInput}
              placeholder="Posez une question…"
              placeholderTextColor="#6B7280"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[s.chatSendBtn, !input.trim() && s.chatSendBtnDisabled]}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0C14' },

  webview: { flex: 1 },

  // ── Header ──
  floatingHeader: {
    position: 'absolute', top: 50, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(10,12,20,0.88)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    zIndex: 10,
  },
  livePill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#7F1D1D', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  liveLabel: { color: '#EF4444', fontSize: 10, fontFamily: FONTS.uiBold, letterSpacing: 1 },
  sessionName: { flex: 1, color: 'white', fontSize: 13, fontFamily: FONTS.uiBold },
  attendeePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  attendeeNum: { color: COLORS.gold, fontSize: 13, fontFamily: FONTS.uiBold },

  // ── FABs ──
  floatingRight: { position: 'absolute', right: 14, bottom: 80, gap: 10, alignItems: 'center', zIndex: 10 },
  fab:       { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(30,32,48,0.92)', alignItems: 'center', justifyContent: 'center' },
  fabActive: { backgroundColor: 'rgba(29,78,216,0.9)' },
  fabLeave:  { backgroundColor: 'rgba(239,68,68,0.9)' },
  fabBadge:  { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  fabBadgeTxt: { color: 'white', fontSize: 9, fontFamily: FONTS.uiBold },

  // ── Chat ──
  chatPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_H * 0.45,
    backgroundColor: '#12151F', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: 'hidden', zIndex: 20,
  },
  chatHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handleBar:  { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  chatTitle:  { color: 'white', fontFamily: FONTS.uiBold, fontSize: 14 },
  livePillSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  liveDotSmall:  { width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981' },
  liveLabelSmall:{ color: '#10B981', fontSize: 9, fontFamily: FONTS.uiBold, letterSpacing: 0.5 },

  msgRow:    { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end', gap: 8 },
  msgRowMe:  { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  msgAvatarTxt: { color: COLORS.gold, fontSize: 12, fontFamily: FONTS.uiBold },
  msgSender: { color: COLORS.gold, fontSize: 11, fontFamily: FONTS.uiBold, marginBottom: 2, marginLeft: 2 },
  msgBubble: { backgroundColor: '#1E2030', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 8 },
  msgBubbleMe: { backgroundColor: '#1D4ED8', borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  msgText:   { color: '#F9FAFB', fontSize: 14, fontFamily: FONTS.regular, lineHeight: 20 },
  msgTime:   { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 3, textAlign: 'right' },

  chatEmptyBox: { alignItems: 'center', marginTop: 30, gap: 8 },
  chatEmptyIcon:{ fontSize: 32 },
  chatEmpty:    { color: '#6B7280', fontFamily: FONTS.uiBold, fontSize: 14 },
  chatEmptySub: { color: '#4B5563', fontFamily: FONTS.regular, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },

  chatInputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#1E2030' },
  chatInput:    { flex: 1, backgroundColor: '#1E2030', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, color: 'white', fontFamily: FONTS.regular, fontSize: 14 },
  chatSendBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  chatSendBtnDisabled:{ backgroundColor: '#374151' },

  // ── Salle d'attente ──
  waitingRoom:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  waitingIcon:     { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E2030', alignItems: 'center', justifyContent: 'center' },
  waitingTitle:    { color: 'white', fontFamily: FONTS.display, fontSize: 22, textAlign: 'center', fontStyle: 'italic' },
  waitingSubtitle: { color: '#9CA3AF', fontFamily: FONTS.regular, fontSize: 15, textAlign: 'center' },
  waitingSpinner:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waitingDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  waitingHint:     { color: '#9CA3AF', fontFamily: FONTS.regular, fontStyle: 'italic' },
  startBtn:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EF4444', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  startBtnTxt:     { color: 'white', fontFamily: FONTS.uiBold, fontSize: 15, letterSpacing: 0.5 },
  leaveWaiting:    { marginTop: 8 },
  leaveWaitingTxt: { color: '#6B7280', fontFamily: FONTS.regular, fontSize: 13, textDecorationLine: 'underline' },
});
