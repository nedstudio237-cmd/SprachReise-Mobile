import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Alert, Modal, Pressable, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Audio, Video, ResizeMode } from 'expo-av';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import socketService from '../../services/socketService';
import api from '../../services/api';

const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🙏','😶'];
const EMOJI_ROWS = [
  ['😀','😂','🥰','😍','🤩','😎','🥳','😭','😅','🙏'],
  ['👍','👋','❤️','🔥','✅','🎉','💯','🤔','😮','👀'],
  ['🇩🇪','📚','✏️','🎓','💪','🌟','👏','🤝','💬','📝'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
function fmtFull(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }) + ' à ' + new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso), now = new Date();
    if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  } catch { return ''; }
}
function fileUrl(path) {
  return path ? `${API_BASE_URL}/files/${path}` : null;
}

// ── Lecteur audio ─────────────────────────────────────────────────────────────
function AudioPlayer({ url, isMe }) {
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => () => { sound?.unloadAsync(); }, [sound]);

  const toggle = async () => {
    try {
      if (!sound) {
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: url }, { shouldPlay: true },
          st => {
            if (st.isLoaded) {
              setPos(st.positionMillis ?? 0);
              setDur(st.durationMillis ?? 0);
              if (st.didJustFinish) setPlaying(false);
            }
          }
        );
        setSound(s); setPlaying(true);
      } else {
        const st = await sound.getStatusAsync();
        if (st.isPlaying) { await sound.pauseAsync(); setPlaying(false); }
        else              { await sound.playAsync();  setPlaying(true); }
      }
    } catch (e) { Alert.alert('Erreur audio', e.message); }
  };

  const pct = dur > 0 ? pos / dur : 0;
  const mm  = ms => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <View style={s.audioWrap}>
      <TouchableOpacity onPress={toggle} style={s.audioBtn}>
        <Ionicons name={playing ? 'pause' : 'play'} size={20} color={isMe ? 'white' : COLORS.accent} />
      </TouchableOpacity>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={[s.audioBar, isMe && s.audioBarMe]}>
          <View style={[s.audioFill, { width: `${pct * 100}%` }, isMe && s.audioFillMe]} />
        </View>
        <Text style={[s.audioDur, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
          {dur > 0 ? `${mm(pos)} / ${mm(dur)}` : '🎙 Vocal'}
        </Text>
      </View>
    </View>
  );
}

// ── Lecteur vidéo inline ──────────────────────────────────────────────────────
function VideoPlayer({ url, isMe }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={s.videoThumb}>
        <Ionicons name="play-circle" size={40} color="white" />
        <Text style={s.videoLabel}>Appuyer pour lire</Text>
      </TouchableOpacity>
      <Modal visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={s.videoModal}>
          <TouchableOpacity style={s.videoClose} onPress={() => setVisible(false)}>
            <Ionicons name="close-circle" size={34} color="white" />
          </TouchableOpacity>
          <Video
            source={{ uri: url }}
            style={s.videoFull}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
          />
        </View>
      </Modal>
    </>
  );
}

// ── Visionneuse image ─────────────────────────────────────────────────────────
function ImageBubble({ url, caption, isMe }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.85}>
        <Image source={{ uri: url }} style={s.msgImg} resizeMode="cover" />
        {caption ? <Text style={[s.bubText, isMe && s.bubTextMe]}>{caption}</Text> : null}
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={s.imgViewerBg} onPress={() => setVisible(false)}>
          <Image source={{ uri: url }} style={s.imgViewerFull} resizeMode="contain" />
          <TouchableOpacity style={s.videoClose} onPress={() => setVisible(false)}>
            <Ionicons name="close-circle" size={34} color="white" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </>
  );
}

// ── Fichier document ──────────────────────────────────────────────────────────
function FileBubble({ url, name, isMe }) {
  const { accessToken } = useAuthStore();
  const [downloading, setDownloading] = useState(false);

  const open = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      // Nom de fichier unique dans le cache
      const safeName = (name ?? 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
      const localUri = FileSystem.cacheDirectory + safeName;

      // Télécharger avec le token JWT
      const { uri, status } = await FileSystem.downloadAsync(url, localUri, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (status !== 200) throw new Error(`HTTP ${status}`);

      // Ouvrir via le partage système (iOS Files, Android etc.)
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/octet-stream' });
    } catch (e) {
      Alert.alert('Erreur', `Impossible d'ouvrir le fichier\n${e.message}`);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <TouchableOpacity onPress={open} style={s.fileWrap} disabled={downloading}>
      <Ionicons name="document-attach" size={22} color={isMe ? 'rgba(255,255,255,0.85)' : COLORS.accent} />
      <View style={{ flex: 1 }}>
        <Text style={[s.fileName, isMe && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
          {name ?? 'Document'}
        </Text>
        <Text style={[s.fileOpen, isMe && { color: 'rgba(255,255,255,0.5)' }]}>
          {downloading ? 'Téléchargement…' : 'Appuyer pour ouvrir'}
        </Text>
      </View>
      <Ionicons name="download-outline" size={18} color={isMe ? 'rgba(255,255,255,0.6)' : COLORS.muted} />
    </TouchableOpacity>
  );
}

// ── Séparateur de date ────────────────────────────────────────────────────────
const DateSep = ({ label }) => (
  <View style={s.dateSep}>
    <View style={s.dateLine} />
    <Text style={s.dateLabel}>{label}</Text>
    <View style={s.dateLine} />
  </View>
);

// ── Bulle message ─────────────────────────────────────────────────────────────
function Bubble({ item, isMe, onLongPress }) {
  if (item.deleted) {
    return (
      <View style={[s.bWrap, isMe ? s.bWrapMe : s.bWrapThem]}>
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem, { opacity: 0.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="ban" size={14} color={COLORS.muted} />
            <Text style={[s.bubText, { color: COLORS.muted, fontStyle: 'italic' }]}>Message supprimé</Text>
          </View>
        </View>
      </View>
    );
  }

  const url = fileUrl(item.attachmentUrl);

  return (
    <Pressable
      onLongPress={() => onLongPress(item)}
      delayLongPress={300}
      style={[s.bWrap, isMe ? s.bWrapMe : s.bWrapThem]}
    >
      {item.pinned && <Ionicons name="pin" size={11} color={COLORS.gold} style={s.pinIcon} />}
      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>

        {/* Citation */}
        {item.replyToId && (
          <View style={[s.quoteWrap, isMe ? s.quoteWrapMe : s.quoteWrapThem]}>
            <View style={[s.quoteLine, isMe ? s.quoteLineMe : s.quoteLineThem]} />
            <Text style={s.quoteText} numberOfLines={2}>{item.replyToContent ?? '…'}</Text>
          </View>
        )}

        {/* Contenu selon type */}
        {item.messageType === 'IMAGE' && url
          ? <ImageBubble url={url} caption={item.content} isMe={isMe} />
          : item.messageType === 'VIDEO' && url
          ? <VideoPlayer url={url} isMe={isMe} />
          : item.messageType === 'AUDIO' && url
          ? <AudioPlayer url={url} isMe={isMe} />
          : item.messageType === 'FILE' && url
          ? <FileBubble url={url} name={item.attachmentName} isMe={isMe} />
          : <Text style={[s.bubText, isMe && s.bubTextMe]}>{item.content}</Text>
        }

        {/* Meta */}
        <View style={s.meta}>
          {item.edited && (
            <Text style={[s.editedLbl, isMe && { color: 'rgba(255,255,255,0.45)' }]}>modifié</Text>
          )}
          <Text style={[s.timeText, isMe && s.timeTextMe]}>{fmt(item.sentAt)}</Text>
          {isMe && (
            <Ionicons
              name={item.readAt ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={item.readAt ? '#60A5FA' : 'rgba(255,255,255,0.4)'}
              style={{ marginLeft: 2 }}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ── ActionItem helper ─────────────────────────────────────────────────────────
const ActionItem = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={s.actionItem} onPress={onPress}>
    <Ionicons name={icon} size={20} color={danger ? '#EF4444' : COLORS.deep} />
    <Text style={[s.actionLabel, danger && { color: '#EF4444' }]}>{label}</Text>
  </TouchableOpacity>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function ConversationScreen({ route, navigation }) {
  const { otherUserId, otherName } = route?.params ?? {};
  const { user, accessToken } = useAuthStore();
  const { getMessages, setMessages, upsertMessage, patchMessage, clearUnread } = useMessageStore();

  const [messages, setMsgs]         = useState(() => getMessages(otherUserId) ?? []);
  const [loading, setLoading]       = useState(!getMessages(otherUserId));
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const [replyTo, setReplyTo]       = useState(null);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [actionMsg, setActionMsg]   = useState(null);
  const [showInfo, setShowInfo]     = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText]     = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [trainers, setTrainers]         = useState([]);
  const [isRecording, setIsRecording]   = useState(false);
  const [recDuration, setRecDuration]   = useState(0);
  const recording  = useRef(null);
  const recTimer   = useRef(null);
  const listRef    = useRef(null);
  const myId = user?.id;

  // ── Helpers état local ↔ store ──────────────────────────────────────────────
  const syncToStore = useCallback((msgs) => {
    setMsgs(msgs);
    setMessages(otherUserId, msgs);
  }, [otherUserId, setMessages]);

  const addMsg = useCallback((msg) => {
    setMsgs(prev => {
      if (prev.find(m => m.id === msg.id)) return prev;
      const next = [...prev, msg];
      setMessages(otherUserId, next);
      return next;
    });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [otherUserId, setMessages]);

  // ── Chargement initial ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const { data } = await api.get(`/messages/conversation/${otherUserId}`);
      const msgs = Array.isArray(data) ? data : [];
      syncToStore(msgs);
      clearUnread(otherUserId);
    } catch {}
    finally { setLoading(false); }
  }, [otherUserId, syncToStore, clearUnread]);

  useEffect(() => { load(); }, [load]);

  // ── WebSocket temps réel ─────────────────────────────────────────────────────
  const lastMsgCountRef = useRef(0);

  useEffect(() => {
    if (!myId || !accessToken || !otherUserId) return;

    socketService.connect(accessToken, () => {
      socketService.subscribe(`/topic/messages/${myId}`, frame => {
        try {
          const msg = JSON.parse(frame.body);
          const concerns =
            (msg.senderId === otherUserId && msg.recipientId === myId) ||
            (msg.senderId === myId && msg.recipientId === otherUserId);
          if (concerns) addMsg(msg);
        } catch {}
      });
    });

    // ── Polling de secours (2 s) au cas où WS ne délivre pas ──────────────
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await api.get(`/messages/conversation/${otherUserId}`);
        const msgs = Array.isArray(data) ? data : [];
        if (msgs.length !== lastMsgCountRef.current) {
          lastMsgCountRef.current = msgs.length;
          syncToStore(msgs);
        }
      } catch {}
    }, 2500);

    return () => {
      socketService.unsubscribe(`/topic/messages/${myId}`);
      clearInterval(pollInterval);
    };
  }, [myId, accessToken, otherUserId, addMsg, syncToStore]);

  // Scroll to bottom quand les messages changent
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 80);
    }
  }, [messages.length]);

  // ── Envoi texte ─────────────────────────────────────────────────────────────
  const sendText = async () => {
    const content = text.trim();
    if (!content) return;
    setSending(true); setText('');
    const body = { recipientId: otherUserId, content, messageType: 'TEXT' };
    if (replyTo) { body.replyToId = replyTo.id; body.replyToContent = replyTo.content ?? '[média]'; }
    setReplyTo(null);
    try {
      const { data } = await api.post('/messages', body);
      addMsg(data);
    } catch { Alert.alert('Erreur', 'Message non envoyé'); }
    finally { setSending(false); }
  };

  // ── Upload + envoi fichier ──────────────────────────────────────────────────
  const uploadAndSend = async (uri, name, mime, msgType) => {
    setSending(true);
    try {
      const form = new FormData();
      form.append('file', { uri, name: name ?? 'file', type: mime ?? 'application/octet-stream' });
      form.append('type', msgType);
      const res = await fetch(`${API_BASE_URL}/messages/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? `HTTP ${res.status}`); }
      const { url, name: sName, type } = await res.json();
      const msgBody = {
        recipientId: otherUserId, content: '', messageType: type,
        attachmentUrl: url, attachmentType: type, attachmentName: sName ?? name,
      };
      if (replyTo) { msgBody.replyToId = replyTo.id; msgBody.replyToContent = replyTo.content ?? '[média]'; }
      setReplyTo(null);
      const { data } = await api.post('/messages', msgBody);
      addMsg(data);
    } catch (e) { Alert.alert('Erreur upload', e.message); }
    finally { setSending(false); }
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      await uploadAndSend(a.uri, `media.${a.uri.split('.').pop()}`, a.type === 'video' ? 'video/mp4' : 'image/jpeg', a.type === 'video' ? 'VIDEO' : 'IMAGE');
    }
  };
  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      await uploadAndSend(a.uri, a.name, a.mimeType ?? 'application/octet-stream', 'FILE');
    }
  };

  // ── Enregistrement vocal ────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recording.current = rec; setIsRecording(true); setRecDuration(0);
      recTimer.current = setInterval(() => setRecDuration(d => d + 1), 1000);
    } catch (e) { Alert.alert('Micro', e.message); }
  };
  const stopRecording = async () => {
    clearInterval(recTimer.current); setIsRecording(false);
    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null; setRecDuration(0);
      if (uri) await uploadAndSend(uri, `vocal_${Date.now()}.m4a`, 'audio/m4a', 'AUDIO');
    } catch {}
  };
  const cancelRecording = async () => {
    clearInterval(recTimer.current); setIsRecording(false);
    try { await recording.current?.stopAndUnloadAsync(); } catch {}
    recording.current = null; setRecDuration(0);
  };

  // ── Actions sur message ─────────────────────────────────────────────────────
  const deleteMsg = async (msg) => {
    setActionMsg(null);
    try {
      await api.delete(`/messages/${msg.id}`);
      patchMessage(otherUserId, msg.id, { deleted: true, content: null });
      setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, deleted: true, content: null } : m));
    } catch { Alert.alert('Erreur', 'Suppression échouée'); }
  };

  const pinMsg = async (msg) => {
    setActionMsg(null);
    try {
      const { data } = await api.post(`/messages/${msg.id}/pin`);
      patchMessage(otherUserId, msg.id, { pinned: data.pinned });
      setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: data.pinned } : m));
    } catch {}
  };

  const startEdit = (msg) => { setActionMsg(null); setEditingMsg(msg); setEditText(msg.content ?? ''); };
  const saveEdit  = async () => {
    if (!editText.trim()) return;
    try {
      const { data } = await api.put(`/messages/${editingMsg.id}`, { content: editText.trim() });
      patchMessage(otherUserId, editingMsg.id, { content: data.content, edited: true });
      setMsgs(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: data.content, edited: true } : m));
    } catch {}
    finally { setEditingMsg(null); setEditText(''); }
  };

  const showMsgInfo = async (msg) => {
    setActionMsg(null);
    try { const { data } = await api.get(`/messages/${msg.id}/info`); setShowInfo(data); }
    catch { setShowInfo({ sentAt: msg.sentAt, readAt: msg.readAt }); }
  };

  const openTransfer = async (msg) => {
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/trainers`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      setTrainers(Array.isArray(data) ? data.filter(t => t.id !== otherUserId) : []);
    } catch { setTrainers([]); }
    setShowTransfer(msg);
  };

  const transferTo = async (trainerId, trainerName) => {
    const content = showTransfer?.content ?? `[${showTransfer?.messageType?.toLowerCase() ?? 'fichier'}]`;
    setShowTransfer(null);
    try {
      await api.post('/messages', { recipientId: trainerId, content: `📨 Transféré : ${content}`, messageType: 'TEXT' });
      Alert.alert('Transféré ✓', `Message envoyé à ${trainerName}`);
    } catch { Alert.alert('Erreur', 'Transfert échoué'); }
  };

  const reactToMsg = (emoji) => {
    const body = { recipientId: otherUserId, content: emoji, messageType: 'TEXT',
      replyToId: actionMsg?.id, replyToContent: actionMsg?.content ?? '[média]' };
    setActionMsg(null);
    api.post('/messages', body)
      .then(({ data }) => addMsg(data))
      .catch(() => {});
  };

  // ── Données avec séparateurs de date ──────────────────────────────────────
  const listData = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = fmtDate(msg.sentAt);
    if (d && d !== lastDate) { listData.push({ _type: 'DATE', label: d, _key: `d_${d}` }); lastDate = d; }
    listData.push({ ...msg, _type: 'MSG' });
  }

  const initials = (otherName ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={26} color={COLORS.parchment} />
        </TouchableOpacity>
        <View style={s.hAvatar}><Text style={s.hAvatarTxt}>{initials}</Text></View>
        <Text style={s.hName} numberOfLines={1}>{otherName ?? 'Conversation'}</Text>
      </View>

      {/* ── Messages ── */}
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.accent} />
      ) : (
        <FlatList
          ref={listRef}
          data={listData}
          keyExtractor={(item, i) => item._key ?? String(item.id ?? i)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item._type === 'DATE') return <DateSep label={item.label} />;
            return <Bubble item={item} isMe={item.senderId === myId} onLongPress={setActionMsg} />;
          }}
        />
      )}

      {/* ── Barre de réponse ── */}
      {replyTo && (
        <View style={s.replyBar}>
          <View style={s.replyAccent} />
          <View style={{ flex: 1 }}>
            <Text style={s.replyLabel}>Répondre à</Text>
            <Text style={s.replyPreview} numberOfLines={1}>
              {replyTo.messageType !== 'TEXT' ? `[${(replyTo.messageType ?? 'fichier').toLowerCase()}]` : replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Mode édition ── */}
      {editingMsg && (
        <View style={s.editBar}>
          <Ionicons name="pencil" size={16} color={COLORS.accent} />
          <TextInput style={s.editInput} value={editText} onChangeText={setEditText} autoFocus multiline />
          <TouchableOpacity onPress={saveEdit} style={s.editSave}>
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingMsg(null)}>
            <Ionicons name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Panneau emoji ── */}
      {showEmoji && (
        <View style={s.emojiPanel}>
          {EMOJI_ROWS.map((row, ri) => (
            <View key={ri} style={s.emojiRow}>
              {row.map(e => (
                <TouchableOpacity key={e} style={s.emojiBtn} onPress={() => setText(t => t + e)}>
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* ── Barre de saisie ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isRecording ? (
          <View style={s.recBar}>
            <TouchableOpacity onPress={cancelRecording} style={{ padding: 8 }}>
              <Ionicons name="trash" size={22} color="#EF4444" />
            </TouchableOpacity>
            <View style={s.recInfo}>
              <View style={s.recDot} />
              <Text style={s.recTime}>
                {String(Math.floor(recDuration / 60)).padStart(2, '0')}:{String(recDuration % 60).padStart(2, '0')}
              </Text>
              <Text style={s.recHint}>Enregistrement…</Text>
            </View>
            <TouchableOpacity onPress={stopRecording} style={s.recSend}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.inputBar}>
            <TouchableOpacity style={s.iBtn} onPress={() => setShowEmoji(e => !e)}>
              <Ionicons name={showEmoji ? 'keypad' : 'happy-outline'} size={24} color={COLORS.muted} />
            </TouchableOpacity>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={v => { setText(v); if (showEmoji) setShowEmoji(false); }}
              placeholder="Écrire un message…"
              placeholderTextColor={COLORS.muted}
              multiline maxLength={2000}
            />
            {text.length === 0 ? (
              <>
                <TouchableOpacity style={s.iBtn} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color={COLORS.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={s.iBtn} onPress={pickFile}>
                  <Ionicons name="attach-outline" size={24} color={COLORS.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={s.sendBtn} onPress={startRecording}>
                  <Ionicons name="mic" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[s.sendBtn, sending && { opacity: 0.5 }]} onPress={sendText} disabled={sending}>
                {sending
                  ? <ActivityIndicator size="small" color="white" />
                  : <Ionicons name="send" size={18} color="white" />}
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ══ Modal menu actions WhatsApp ══ */}
      <Modal visible={!!actionMsg} transparent animationType="fade" onRequestClose={() => setActionMsg(null)}>
        <Pressable style={s.overlay} onPress={() => setActionMsg(null)}>
          <View style={s.sheet}>
            <View style={s.reactRow}>
              {QUICK_REACTIONS.map(e => (
                <TouchableOpacity key={e} style={s.reactBtn} onPress={() => reactToMsg(e)}>
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.divider} />
            <ActionItem icon="return-up-back-outline" label="Répondre"
              onPress={() => { setReplyTo(actionMsg); setActionMsg(null); }} />
            <ActionItem icon="arrow-redo-outline" label="Transférer"
              onPress={() => openTransfer(actionMsg)} />
            {actionMsg?.content
              ? <ActionItem icon="copy-outline" label="Copier"
                  onPress={() => { setText(actionMsg.content); setActionMsg(null); }} />
              : null}
            {actionMsg?.senderId === myId && actionMsg?.messageType === 'TEXT' && !actionMsg?.deleted
              ? <ActionItem icon="pencil-outline" label="Modifier"
                  onPress={() => startEdit(actionMsg)} />
              : null}
            <ActionItem icon="information-circle-outline" label="Infos"
              onPress={() => showMsgInfo(actionMsg)} />
            <ActionItem icon="pin-outline"
              label={actionMsg?.pinned ? 'Désépingler' : 'Épingler'}
              onPress={() => pinMsg(actionMsg)} />
            {actionMsg?.senderId === myId && !actionMsg?.deleted
              ? <ActionItem icon="trash-outline" label="Supprimer" danger
                  onPress={() => Alert.alert('Supprimer', 'Supprimer ce message ?', [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: () => deleteMsg(actionMsg) },
                  ])} />
              : null}
          </View>
        </Pressable>
      </Modal>

      {/* ══ Modal info message ══ */}
      <Modal visible={!!showInfo} transparent animationType="slide" onRequestClose={() => setShowInfo(null)}>
        <Pressable style={s.overlay} onPress={() => setShowInfo(null)}>
          <View style={s.infoSheet}>
            <Text style={s.infoTitle}>Infos du message</Text>
            <View style={s.infoRow}>
              <Ionicons name="checkmark-outline" size={18} color={COLORS.muted} />
              <View>
                <Text style={s.infoLbl}>Envoyé</Text>
                <Text style={s.infoVal}>{fmtFull(showInfo?.sentAt)}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <Ionicons name="checkmark-done" size={18} color={showInfo?.readAt ? '#60A5FA' : COLORS.muted} />
              <View>
                <Text style={s.infoLbl}>Lu</Text>
                <Text style={s.infoVal}>{showInfo?.readAt ? fmtFull(showInfo.readAt) : 'Pas encore lu'}</Text>
              </View>
            </View>
            {showInfo?.edited && (
              <View style={s.infoRow}>
                <Ionicons name="pencil" size={16} color={COLORS.muted} />
                <Text style={s.infoLbl}>Message modifié</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ══ Modal transfert ══ */}
      <Modal visible={!!showTransfer} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setShowTransfer(null)}>
        <SafeAreaView style={s.transferCt}>
          <View style={s.transferHdr}>
            <TouchableOpacity onPress={() => setShowTransfer(null)}>
              <Ionicons name="close" size={24} color={COLORS.deep} />
            </TouchableOpacity>
            <Text style={s.transferTitle}>Transférer à</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={s.transferPreview}>
            <Text style={s.transferPreviewLbl}>Message à transférer :</Text>
            <Text style={s.transferPreviewTxt} numberOfLines={2}>
              {showTransfer?.content ?? `[${showTransfer?.messageType?.toLowerCase() ?? 'fichier'}]`}
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
            {trainers.length === 0
              ? <Text style={s.transferEmpty}>Aucun autre formateur disponible</Text>
              : trainers.map(t => {
                  const tName = `${t.firstName} ${t.lastName}`;
                  const tInit = ((t.firstName?.[0] ?? '') + (t.lastName?.[0] ?? '')).toUpperCase();
                  return (
                    <TouchableOpacity key={t.id} style={s.trainerRow} onPress={() => transferTo(t.id, tName)}>
                      <View style={s.tAvatar}><Text style={s.tAvatarTxt}>{tInit}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.tName}>{tName}</Text>
                        <Text style={s.tLevel}>Niveau {t.teachingLevel}</Text>
                      </View>
                      <Text style={s.tSend}>Transférer</Text>
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#120A05' },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, paddingVertical: 8, backgroundColor: COLORS.deep, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.2)' },
  hAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  hAvatarTxt: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 13, fontStyle: 'italic' },
  hName:      { flex: 1, fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 16 },

  list: { paddingHorizontal: 8, paddingVertical: 8 },

  dateSep:   { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 8, paddingHorizontal: 10 },
  dateLine:  { flex: 1, height: 1, backgroundColor: 'rgba(126,102,58,0.18)' },
  dateLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 11 },

  bWrap:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 3, paddingHorizontal: 6 },
  bWrapMe:   { justifyContent: 'flex-end' },
  bWrapThem: { justifyContent: 'flex-start' },
  pinIcon:   { marginBottom: 4, marginHorizontal: 3 },

  bubble:     { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 11, paddingTop: 7, paddingBottom: 5 },
  bubbleMe:   { backgroundColor: '#7E4A2A', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#2A1C12', borderBottomLeftRadius: 4 },

  quoteWrap:     { borderRadius: 6, padding: 7, marginBottom: 6, flexDirection: 'row', gap: 6 },
  quoteWrapMe:   { backgroundColor: 'rgba(0,0,0,0.2)' },
  quoteWrapThem: { backgroundColor: 'rgba(126,102,58,0.18)' },
  quoteLine:     { width: 3, borderRadius: 2 },
  quoteLineMe:   { backgroundColor: 'rgba(255,255,255,0.5)' },
  quoteLineThem: { backgroundColor: COLORS.accent },
  quoteText:     { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 12, lineHeight: 17, flex: 1 },

  bubText:    { fontFamily: FONTS.regular, color: COLORS.cream, fontSize: 15, lineHeight: 21 },
  bubTextMe:  { color: COLORS.parchment },
  meta:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, gap: 2 },
  editedLbl:  { fontFamily: FONTS.ui, color: 'rgba(174,145,130,0.65)', fontSize: 10, fontStyle: 'italic' },
  timeText:   { fontFamily: FONTS.ui, color: 'rgba(174,145,130,0.65)', fontSize: 10 },
  timeTextMe: { color: 'rgba(249,244,232,0.5)' },

  msgImg:       { width: 220, height: 165, borderRadius: 10, marginBottom: 4 },
  imgViewerBg:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imgViewerFull:{ width: '100%', height: '80%' },

  videoThumb: { width: 200, height: 120, backgroundColor: '#111', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6 },
  videoLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: FONTS.regular },
  videoModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  videoFull:  { width: '100%', height: '80%' },
  videoClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },

  fileWrap: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 2 },
  fileName: { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 13, flex: 1 },
  fileOpen: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10, marginTop: 1 },

  audioWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2, minWidth: 175 },
  audioBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  audioBar:  { height: 3, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 2 },
  audioBarMe:{ backgroundColor: 'rgba(255,255,255,0.22)' },
  audioFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 2 },
  audioFillMe:{ backgroundColor: 'white' },
  audioDur:  { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 10 },

  replyBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1E120A', paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)' },
  replyAccent:  { width: 3, height: 36, backgroundColor: COLORS.accent, borderRadius: 2 },
  replyLabel:   { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 11, marginBottom: 2 },
  replyPreview: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13 },

  editBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1E120A', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)' },
  editInput: { flex: 1, backgroundColor: '#2C1F17', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, color: COLORS.parchment, fontSize: 15, fontFamily: FONTS.regular, maxHeight: 90 },
  editSave:  { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },

  emojiPanel: { backgroundColor: '#1E120A', borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)', paddingVertical: 10, paddingHorizontal: 4 },
  emojiRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  emojiBtn:   { padding: 4 },

  inputBar:  { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: COLORS.deep, borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)', gap: 6 },
  iBtn:      { padding: 6, marginBottom: 2 },
  input:     { flex: 1, backgroundColor: '#2C1F17', borderRadius: 22, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: COLORS.parchment, fontSize: 15, fontFamily: FONTS.regular, maxHeight: 120 },
  sendBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },

  recBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.deep, borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.2)', gap: 12 },
  recInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  recTime: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 16 },
  recHint: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, fontStyle: 'italic' },
  recSend: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: COLORS.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, paddingBottom: 32 },
  reactRow:{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 10 },
  reactBtn:{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(126,102,58,0.08)', alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(126,102,58,0.12)', marginHorizontal: 16, marginBottom: 6 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.07)' },
  actionLabel:{ fontFamily: FONTS.uiMedium, color: COLORS.deep, fontSize: 15 },

  infoSheet: { backgroundColor: COLORS.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 40 },
  infoTitle: { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 20, fontStyle: 'italic', marginBottom: 20 },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 18 },
  infoLbl:   { fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 11, letterSpacing: 0.3, marginBottom: 3 },
  infoVal:   { fontFamily: FONTS.regular, color: COLORS.deep, fontSize: 14 },

  transferCt:     { flex: 1, backgroundColor: COLORS.paper },
  transferHdr:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.15)' },
  transferTitle:  { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 20 },
  transferPreview:{ margin: 16, padding: 14, backgroundColor: 'rgba(126,102,58,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)' },
  transferPreviewLbl:{ fontFamily: FONTS.uiBold, color: COLORS.muted, fontSize: 11, letterSpacing: 0.3, marginBottom: 5 },
  transferPreviewTxt:{ fontFamily: FONTS.regular, color: COLORS.deep, fontSize: 14 },
  transferEmpty:  { textAlign: 'center', marginTop: 40, fontFamily: FONTS.regular, color: COLORS.muted, fontStyle: 'italic' },
  trainerRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.1)' },
  tAvatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  tAvatarTxt:     { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 16, fontStyle: 'italic' },
  tName:          { fontFamily: FONTS.uiBold, color: COLORS.deep, fontSize: 15, marginBottom: 2 },
  tLevel:         { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  tSend:          { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 14 },
});
