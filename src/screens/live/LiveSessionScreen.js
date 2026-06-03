import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Modal,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STOMP_URL = API_BASE_URL
  .replace('/api', '/ws/websocket')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

const SIGNAL_URL = API_BASE_URL
  .replace('/api', '/signal')
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

const PEER_COLORS = ['#1D4ED8', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2'];
const CHUNK_MS = 800; // durée de chaque chunk audio en millisecondes

export default function LiveSessionScreen({ route, navigation }) {
  const { sessionId, isTrainer = false } = route.params || {};
  const { accessToken, user } = useAuthStore();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission,    requestMicPermission]    = useMicrophonePermissions();

  const [session, setSession]             = useState(null);
  const [sessionStatus, setSessionStatus] = useState('SCHEDULED');
  const [messages, setMessages]           = useState([]);
  const [peers, setPeers]                 = useState({});
  const [input, setInput]                 = useState('');
  const [showChat, setShowChat]           = useState(false);
  const [showNotes, setShowNotes]         = useState(false);
  const [noteText, setNoteText]           = useState('');
  const [notes, setNotes]                 = useState([]);
  const [micOn, setMicOn]                 = useState(true);
  const [camOn, setCamOn]                 = useState(true);
  const [facing, setFacing]               = useState('front');
  const [unreadCount, setUnreadCount]     = useState(0);

  const stompRef       = useRef(null);
  const wsRef          = useRef(null);
  const flatRef        = useRef(null);
  const chatAnim       = useRef(new Animated.Value(0)).current;
  const showChatRef    = useRef(false);
  const micOnRef       = useRef(true);
  const audioLoopRef   = useRef(false); // flag pour stopper la boucle
  const recordingRef   = useRef(null);  // instance Audio.Recording en cours

  const peerId   = useRef(`${user?.id ?? 'anon'}-${Date.now()}`).current;
  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  // ── Permissions ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!micPermission?.granted)    await requestMicPermission();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    })();
  }, []);

  // ── Rejoindre la session ──────────────────────────────────────────────────
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
        setSessionStatus(data.session?.status ?? 'SCHEDULED');
      } catch (e) { Alert.alert('Erreur réseau', e.message); navigation.goBack(); }
    })();
  }, [sessionId]);

  // ── STOMP — chat instantané + statut ─────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !accessToken) return;

    const client = new Client({
      brokerURL: STOMP_URL,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe(`/topic/live/${sessionId}/chat`, (msg) => {
          const body = JSON.parse(msg.body);
          setMessages(prev => [...prev, body]);
          if (!showChatRef.current) setUnreadCount(c => c + 1);
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
        });

        client.subscribe(`/topic/live/${sessionId}/status`, (msg) => {
          const body = JSON.parse(msg.body);
          setSessionStatus(body.status);
          if (body.status === 'ENDED' && !isTrainer) {
            Alert.alert('Session terminée', 'Le formateur a mis fin à la session.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
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

  // ── WebSocket signalisation + relay audio ─────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(SIGNAL_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join', roomId: `session-${sessionId}`,
        peerId, name: userName || 'Participant', isTrainer,
      }));
    };

    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === 'room-state') {
          const map = {};
          for (const p of msg.peers) map[p.peerId] = { name: p.name, isTrainer: p.isTrainer, micMuted: false, camMuted: false };
          setPeers(map);
        }
        if (msg.type === 'peer-joined' && msg.peerId !== peerId) {
          setPeers(prev => ({ ...prev, [msg.peerId]: { name: msg.name, isTrainer: msg.isTrainer, micMuted: false, camMuted: false } }));
        }
        if (msg.type === 'mute-state') {
          setPeers(prev => {
            if (!prev[msg.peerId]) return prev;
            return { ...prev, [msg.peerId]: { ...prev[msg.peerId], micMuted: msg.audioMuted, camMuted: msg.videoMuted } };
          });
        }
        if (msg.type === 'peer-left') {
          setPeers(prev => { const n = { ...prev }; delete n[msg.peerId]; return n; });
        }

        // ── Recevoir un chunk audio et le jouer ──────────────────────────
        if (msg.type === 'audio-relay' && msg.peerId !== peerId && msg.data) {
          const path = FileSystem.cacheDirectory + 'rx_' + Date.now() + '.m4a';
          try {
            await FileSystem.writeAsStringAsync(path, msg.data, { encoding: FileSystem.EncodingType.Base64 });
            const { sound } = await Audio.Sound.createAsync({ uri: path });
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate(async (st) => {
              if (st.didJustFinish) {
                await sound.unloadAsync();
                await FileSystem.deleteAsync(path, { idempotent: true });
              }
            });
          } catch {}
        }
      } catch {}
    };

    ws.onclose = () => {};

    return () => {
      try { ws.send(JSON.stringify({ type: 'leave' })); } catch {}
      ws.close();
    };
  }, [sessionId]);

  // ── Boucle d'enregistrement audio (chunks 800ms) ──────────────────────────
  useEffect(() => {
    if (sessionStatus !== 'LIVE') return;

    audioLoopRef.current = true;

    const loop = async () => {
      while (audioLoopRef.current) {
        if (!micOnRef.current || wsRef.current?.readyState !== WebSocket.OPEN) {
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        try {
          const rec = new Audio.Recording();
          recordingRef.current = rec;
          await rec.prepareToRecordAsync({
            android: {
              extension: '.m4a',
              outputFormat: 2,   // MPEG_4
              audioEncoder: 3,   // AAC
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 32000,
            },
            ios: {
              extension: '.m4a',
              audioQuality: 0,   // LOW
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 32000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {},
          });
          await rec.startAsync();
          await new Promise(r => setTimeout(r, CHUNK_MS));
          await rec.stopAndUnloadAsync();
          recordingRef.current = null;

          const uri = rec.getURI();
          if (uri && wsRef.current?.readyState === WebSocket.OPEN && micOnRef.current) {
            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            wsRef.current.send(JSON.stringify({
              type: 'audio-relay',
              roomId: `session-${sessionId}`,
              peerId,
              data: b64,
            }));
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        } catch {
          await new Promise(r => setTimeout(r, 300));
        }
      }
    };

    loop();

    return () => {
      audioLoopRef.current = false;
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, [sessionStatus]);

  useEffect(() => { showChatRef.current = showChat; if (showChat) setUnreadCount(0); }, [showChat]);
  useEffect(() => { micOnRef.current = micOn; }, [micOn]);

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
      isTrainer ? 'Cela terminera la session pour tous.' : 'Voulez-vous quitter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isTrainer ? 'Terminer' : 'Quitter', style: 'destructive',
          onPress: async () => {
            audioLoopRef.current = false;
            if (recordingRef.current) { await recordingRef.current.stopAndUnloadAsync().catch(() => {}); recordingRef.current = null; }
            wsRef.current?.close();
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

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'mute-state', audioMuted: !next, videoMuted: !camOn }));
    }
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'mute-state', audioMuted: !micOn, videoMuted: !next }));
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !stompRef.current?.connected) return;
    stompRef.current.publish({
      destination: `/app/live/${sessionId}/chat`,
      body: JSON.stringify({ message: input.trim() }),
    });
    setInput('');
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    setNotes(prev => [...prev, { content: noteText.trim(), timestamp: new Date().toISOString() }]);
    setNoteText('');
  };

  const toggleChat = () => {
    setShowChat(v => !v);
    Animated.spring(chatAnim, { toValue: showChat ? 0 : 1, useNativeDriver: true, tension: 60, friction: 12 }).start();
  };

  const chatTranslateY = chatAnim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.45, 0] });
  const peerList = Object.entries(peers);

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

      {/* ── Grille vidéo ── */}
      <View style={s.grid}>

        {/* Tuile locale */}
        <View style={[s.tile, s.tileSelf, peerList.length === 0 && s.tileFull]}>
          {cameraPermission?.granted && camOn ? (
            <CameraView style={StyleSheet.absoluteFill} facing={facing} mirror={facing === 'front'} />
          ) : (
            <View style={s.avatarBox}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>{(userName || 'V')[0].toUpperCase()}</Text>
              </View>
            </View>
          )}
          <View style={s.tileOverlay}>
            <Text style={s.tileName}>Vous{isTrainer ? ' (Formateur)' : ''}</Text>
            <View style={s.muteRow}>
              {!micOn && <View style={s.muteBadge}><Text style={s.muteTxt}>🔇</Text></View>}
              {!camOn && <View style={s.muteBadge}><Text style={s.muteTxt}>📷✕</Text></View>}
            </View>
          </View>
        </View>

        {/* Tuiles des autres participants */}
        {peerList.map(([pid, info], idx) => (
          <View key={pid} style={[
            s.tile,
            peerList.length === 1 && s.tileFull,
            { borderColor: info.isTrainer ? COLORS.gold : PEER_COLORS[idx % PEER_COLORS.length] },
          ]}>
            <View style={[s.avatarBox, { backgroundColor: (info.isTrainer ? COLORS.gold : PEER_COLORS[idx % PEER_COLORS.length]) + '18' }]}>
              <View style={[s.avatarCircle, { borderColor: info.isTrainer ? COLORS.gold : PEER_COLORS[idx % PEER_COLORS.length] }]}>
                <Text style={[s.avatarText, { color: info.isTrainer ? COLORS.gold : PEER_COLORS[idx % PEER_COLORS.length] }]}>
                  {(info.name || '?')[0].toUpperCase()}
                </Text>
              </View>
              {!info.micMuted && (
                <View style={s.speakingDot} />
              )}
            </View>
            <View style={s.tileOverlay}>
              <Text style={s.tileName}>{info.name}{info.isTrainer ? ' ★' : ''}</Text>
              <View style={s.muteRow}>
                {info.micMuted && <View style={s.muteBadge}><Text style={s.muteTxt}>🔇</Text></View>}
                {info.camMuted && <View style={s.muteBadge}><Text style={s.muteTxt}>📷✕</Text></View>}
              </View>
            </View>
          </View>
        ))}

        {peerList.length === 0 && (
          <View style={s.waitingOverlay}>
            <View style={s.waitingPill}>
              <View style={s.waitingDotSmall} />
              <Text style={s.waitingPillTxt}>
                {isTrainer ? 'En attente des apprenants…' : 'En attente des autres participants…'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Header flottant ── */}
      <View style={s.floatingHeader}>
        <View style={s.livePill}><View style={s.liveDot} /><Text style={s.liveLabel}>EN DIRECT</Text></View>
        <Text style={s.sessionName} numberOfLines={1}>{session?.title ?? 'Live'}</Text>
        <View style={s.attendeePill}>
          <Ionicons name="people" size={13} color={COLORS.gold} />
          <Text style={s.attendeeNum}>{peerList.length + 1}</Text>
        </View>
      </View>

      {/* ── Boutons flottants droite ── */}
      <View style={s.floatingRight}>
        {camOn && (
          <TouchableOpacity style={s.fab} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
            <Ionicons name="camera-reverse" size={20} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.fab, !micOn && s.fabMuted]} onPress={toggleMic}>
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab, !camOn && s.fabMuted]} onPress={toggleCam}>
          <Ionicons name={camOn ? 'videocam' : 'videocam-off'} size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab, showChat && s.fabActive]} onPress={toggleChat}>
          <Ionicons name="chatbubbles" size={22} color="white" />
          {unreadCount > 0 && (
            <View style={s.fabBadge}><Text style={s.fabBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={s.fab} onPress={() => setShowNotes(true)}>
          <Ionicons name="document-text" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab, s.fabLeave]} onPress={handleLeave}>
          <Ionicons name="call" size={22} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* ── Panneau chat ── */}
      <Animated.View style={[s.chatPanel, { transform: [{ translateY: chatTranslateY }] }]}>
        <View style={s.chatHandle}><View style={s.handleBar} /></View>
        <View style={s.chatHeader}>
          <Text style={s.chatTitle}>Chat · {session?.title}</Text>
          <TouchableOpacity onPress={toggleChat}><Ionicons name="chevron-down" size={20} color={COLORS.muted} /></TouchableOpacity>
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
                      {item.timestamp ? item.timestamp.substring(11, 16) : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={s.chatEmpty}>Aucun message pour l'instant.</Text>}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.chatInputRow}>
            <TextInput
              style={s.chatInput}
              placeholder="Écrire…"
              placeholderTextColor="#6B7280"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendMessage} style={s.chatSendBtn}>
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* ── Modal notes ── */}
      <Modal visible={showNotes} animationType="slide" transparent onRequestClose={() => setShowNotes(false)}>
        <View style={s.notesOverlay}>
          <View style={s.notesSheet}>
            <View style={s.notesHdr}>
              <Text style={s.notesTitle}>📝 Mes notes</Text>
              <TouchableOpacity onPress={() => setShowNotes(false)}>
                <Ionicons name="close" size={22} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, marginBottom: 12 }}>
              {notes.length === 0
                ? <Text style={s.notesEmpty}>Aucune note. Écris pendant la session !</Text>
                : notes.map((n, i) => (
                    <View key={i} style={s.noteItem}>
                      <Text style={s.noteContent}>{n.content}</Text>
                      <Text style={s.noteTime}>{new Date(n.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  ))}
            </ScrollView>
            <View style={s.noteInputRow}>
              <TextInput
                style={s.noteInput}
                placeholder="Ajouter une note…"
                placeholderTextColor="#6B7280"
                value={noteText}
                onChangeText={setNoteText}
                multiline
              />
              <TouchableOpacity onPress={saveNote} style={s.noteSaveBtn}>
                <Text style={s.noteSaveTxt}>Sauv.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },

  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#0A0C14' },
  tile: { width: '50%', height: SCREEN_H / 2, borderWidth: 2, borderColor: '#1D4ED8', overflow: 'hidden', backgroundColor: '#1A1D2E', position: 'relative' },
  tileSelf: { borderColor: '#1D4ED8' },
  tileFull: { width: '100%', height: '100%' },

  avatarBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#AE9182', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2D3E' },
  avatarText:   { color: '#AE9182', fontSize: 32, fontWeight: 'bold' },
  speakingDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginTop: 4 },

  tileOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileName:    { color: 'white', fontSize: 11, fontWeight: '600', flex: 1 },
  muteRow:     { flexDirection: 'row', gap: 4 },
  muteBadge:   { backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  muteTxt:     { color: 'white', fontSize: 9 },

  waitingOverlay: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  waitingPill:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(30,32,48,0.9)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  waitingDotSmall:{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  waitingPillTxt: { color: '#D1D5DB', fontSize: 13 },

  floatingHeader: { position: 'absolute', top: 50, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(15,17,23,0.82)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  livePill:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#7F1D1D', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  liveLabel:      { color: '#EF4444', fontSize: 10, fontFamily: FONTS.uiBold, letterSpacing: 1 },
  sessionName:    { flex: 1, color: 'white', fontSize: 13, fontFamily: FONTS.uiBold },
  attendeePill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  attendeeNum:    { color: COLORS.gold, fontSize: 13, fontFamily: FONTS.uiBold },

  floatingRight: { position: 'absolute', right: 14, bottom: 80, gap: 10, alignItems: 'center' },
  fab:           { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(30,32,48,0.92)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fabActive:     { backgroundColor: 'rgba(29,78,216,0.9)' },
  fabMuted:      { backgroundColor: 'rgba(239,68,68,0.85)' },
  fabLeave:      { backgroundColor: 'rgba(239,68,68,0.9)' },
  fabBadge:      { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  fabBadgeTxt:   { color: 'white', fontSize: 9, fontFamily: FONTS.uiBold },

  chatPanel:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_H * 0.45, backgroundColor: '#12151F', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  chatHandle:   { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handleBar:    { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  chatHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  chatTitle:    { color: 'white', fontFamily: FONTS.uiBold, fontSize: 14 },

  msgRow:       { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', gap: 6 },
  msgRowMe:     { flexDirection: 'row-reverse' },
  msgAvatar:    { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  msgAvatarTxt: { color: COLORS.gold, fontSize: 11, fontFamily: FONTS.uiBold },
  msgSender:    { color: COLORS.gold, fontSize: 11, fontFamily: FONTS.uiBold, marginBottom: 2, marginLeft: 2 },
  msgBubble:    { backgroundColor: '#1E2030', borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 8 },
  msgBubbleMe:  { backgroundColor: '#1D4ED8', borderBottomLeftRadius: 14, borderBottomRightRadius: 4 },
  msgText:      { color: '#F9FAFB', fontSize: 14, fontFamily: FONTS.regular },
  msgTime:      { color: '#6B7280', fontSize: 10, marginTop: 3, textAlign: 'right' },
  chatEmpty:    { color: '#4B5563', textAlign: 'center', marginTop: 20, fontFamily: FONTS.regular, fontStyle: 'italic' },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#1E2030' },
  chatInput:    { flex: 1, backgroundColor: '#1E2030', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: 'white', fontFamily: FONTS.regular, fontSize: 14 },
  chatSendBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },

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

  notesOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  notesSheet:   { backgroundColor: '#1E2030', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '72%' },
  notesHdr:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  notesTitle:   { color: 'white', fontFamily: FONTS.uiBold, fontSize: 18 },
  notesEmpty:   { color: '#6B7280', textAlign: 'center', marginTop: 20, fontFamily: FONTS.regular, fontStyle: 'italic' },
  noteItem:     { backgroundColor: '#2A2D3E', borderRadius: 10, padding: 12, marginBottom: 8 },
  noteContent:  { color: '#F9FAFB', fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20 },
  noteTime:     { color: '#6B7280', fontSize: 10, marginTop: 4, textAlign: 'right' },
  noteInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  noteInput:    { flex: 1, backgroundColor: '#2A2D3E', borderRadius: 10, color: 'white', paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.regular, maxHeight: 100 },
  noteSaveBtn:  { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  noteSaveTxt:  { color: '#000', fontFamily: FONTS.uiBold, fontSize: 13 },
});
