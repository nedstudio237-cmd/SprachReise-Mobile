import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const LEVEL_IDS = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:6 };
const LEVEL_LABELS = { A1:'Débutant', A2:'Élémentaire', B1:'Intermédiaire', B2:'Avancé', C1:'Autonome', C2:'Maîtrise' };
const LANG_FLAGS = { de:'🇩🇪', en:'🇬🇧', es:'🇪🇸', zh:'🇨🇳' };
const GREETING = { de:'Guten Tag', en:'Hello', es:'¡Hola', zh:'你好' };

function formatDuration(sec) {
  if (!sec) return '—';
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m/60)}h${m%60>0?m%60+'min':''}` : `${m} min`;
}

export default function HomeScreen({ navigation }) {
  const { user, level, language, courseProgress, accessToken } = useAuthStore();
  const firstName = user?.firstName ?? 'Apprenant';
  const userLevel = level ?? 'A1';
  const userLang = language ?? 'de';

  const [courses, setCourses] = useState([]);
  const [nextSession, setNextSession] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Recherche formateurs
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allTrainers, setAllTrainers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (!cancelled) setUnreadCount(data.unreadCount ?? 0);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [accessToken]));

  // Charge tous les formateurs une seule fois à l'ouverture du modal
  const openSearch = async () => {
    setShowSearch(true);
    setSearchQuery('');
    if (allTrainers.length > 0) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/trainers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setAllTrainers(Array.isArray(data) ? data : []);
    } catch {
      setAllTrainers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredTrainers = searchQuery.trim().length === 0
    ? allTrainers
    : allTrainers.filter(t =>
        `${t.firstName} ${t.lastName} ${t.teachingLevel}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

  useEffect(() => {
    const levelId = LEVEL_IDS[userLevel] ?? 1;
    Promise.all([
      api.get('/courses', { params: { levelId } }),
      api.get('/sessions'),
    ]).then(([cRes, sRes]) => {
      setCourses(cRes.data.slice(0, 3));
      const upcoming = sRes.data.find((s) => s.status === 'SCHEDULED' || s.status === 'LIVE');
      setNextSession(upcoming ?? null);
    }).catch(() => {}).finally(() => setLoadingCourses(false));
  }, [userLevel]);

  // Calcul progression globale
  const completedCount = Object.values(courseProgress).filter((p) => p.completed).length;
  const totalCourses = courses.length || 1;
  const progressPct = Math.min(100, Math.round((completedCount / Math.max(totalCourses, 1)) * 100));

  function formatSessionDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
        + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{GREETING[userLang] ?? 'Bonjour'},</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Loupe recherche formateurs */}
            <TouchableOpacity style={styles.bellBtn} onPress={openSearch}>
              <Ionicons name="search-outline" size={20} color={COLORS.deep} />
            </TouchableOpacity>
            {/* Cloche notifications */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation?.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.deep} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.langBadge}>
              <Text style={styles.langFlag}>{LANG_FLAGS[userLang] ?? '🌍'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.progressCard}
          onPress={() => navigation?.navigate('Progress')}
          activeOpacity={0.88}
        >
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardLabel}>NIVEAU ACTUEL</Text>
              <Text style={styles.progressCardLevel}>{userLevel} — {LEVEL_LABELS[userLevel]}</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressCircleText}>{progressPct}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressSub}>{completedCount} / {totalCourses} cours complétés</Text>
            <Text style={styles.progressLink}>Voir le détail →</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <QuickAction emoji="📖" label="Cours" onPress={() => navigation?.navigate('Cours')} />
          <QuickAction emoji="📡" label="Live" onPress={() => navigation?.navigate('Live')} />
          <QuickAction emoji="✏️" label="QCM" onPress={() => navigation?.navigate('Cursus')} />
          <QuickAction emoji="📜" label="Certifs" />
        </View>

        <Text style={styles.sectionTitle}>CONTINUER L'APPRENTISSAGE</Text>

        {loadingCourses ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
        ) : courses.length === 0 ? (
          <Text style={styles.emptyText}>Aucun cours disponible pour le niveau {userLevel}.</Text>
        ) : (
          courses.map((course, i) => {
            const progress = courseProgress[course.id];
            const done = progress?.completed;
            const dur = formatDuration(course.videoDurationSec);
            return (
              <TouchableOpacity
                key={course.id}
                style={styles.lessonCard}
                onPress={() => navigation?.navigate('CourseDetail', { courseId: course.id })}
              >
                <View style={[styles.lessonNum, done && styles.lessonNumDone]}>
                  <Text style={styles.lessonNumText}>{done ? '✓' : i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonTitle}>{course.title}</Text>
                  <Text style={styles.lessonSub}>
                    {course.levelCode} · {dur}{done ? ' · Terminé ✓' : ''}
                  </Text>
                </View>
                <Text style={styles.lessonArrow}>›</Text>
              </TouchableOpacity>
            );
          })
        )}

        {nextSession && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              {nextSession.status === 'LIVE' ? 'SESSION EN DIRECT' : 'PROCHAIN LIVE'}
            </Text>
            <TouchableOpacity
              style={[styles.liveCard, nextSession.status === 'LIVE' && styles.liveCardActive]}
              onPress={() => navigation?.navigate('LiveDetail', { sessionId: nextSession.id })}
              activeOpacity={0.85}
            >
              <View style={styles.liveCardHeader}>
                <View style={[styles.livePill, nextSession.status === 'LIVE' && styles.livePillActive]}>
                  <View style={[styles.liveDot, nextSession.status === 'LIVE' && styles.liveDotActive]} />
                  <Text style={[styles.livePillText, nextSession.status === 'LIVE' && { color: '#EF4444' }]}>
                    {nextSession.status === 'LIVE' ? 'EN DIRECT' : 'PROGRAMMÉ'}
                  </Text>
                </View>
                <Text style={styles.liveTime}>{formatSessionDate(nextSession.scheduledStart)}</Text>
              </View>
              <Text style={styles.liveTitle}>{nextSession.title}</Text>
              <Text style={styles.liveSub}>
                {nextSession.trainerName ? `avec ${nextSession.trainerName}` : ''}
                {nextSession.durationMinutes ? ` · ${nextSession.durationMinutes} min` : ''}
              </Text>
              <View style={styles.liveFooter}>
                <Text style={[styles.liveBtnText, nextSession.status === 'LIVE' && { color: '#EF4444' }]}>
                  {nextSession.status === 'LIVE' ? '▶ REJOINDRE MAINTENANT' : 'VOIR LES DÉTAILS →'}
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      {/* Modal recherche formateurs */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.searchContainer}>
          {/* Header */}
          <View style={styles.searchHeader}>
            <TouchableOpacity
              onPress={() => { setShowSearch(false); setSearchQuery(''); }}
              style={styles.searchCancelBtn}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.deep} />
            </TouchableOpacity>
            <Text style={styles.searchHeaderTitle}>Formateurs</Text>
          </View>

          {/* Input */}
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={18} color={COLORS.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom ou niveau…"
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            )}
          </View>

          {searchLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accent} />
          ) : (
            <FlatList
              data={filteredTrainers}
              keyExtractor={t => String(t.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.searchEmpty}>
                  <Ionicons name="people-outline" size={40} color={COLORS.muted} />
                  <Text style={styles.searchEmptyText}>
                    {searchQuery.length > 0 ? 'Aucun formateur trouvé' : 'Aucun formateur disponible'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const initials = (item.firstName?.[0] ?? '') + (item.lastName?.[0] ?? '');
                const spotsLeft = item.maxStudents - item.currentStudents;
                return (
                  <TouchableOpacity
                    style={styles.trainerCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      navigation?.navigate('TrainerPublicProfile', { trainerId: item.id });
                    }}
                  >
                    <View style={styles.trainerAvatar}>
                      <Text style={styles.trainerAvatarText}>{initials.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trainerCardName}>{item.firstName} {item.lastName}</Text>
                      <Text style={styles.trainerCardMeta}>
                        Niveau {item.teachingLevel}
                        {item.ratingAvg > 0 ? `  ·  ★ ${Number(item.ratingAvg).toFixed(1)}` : ''}
                      </Text>
                      {item.bio ? (
                        <Text style={styles.trainerCardBio} numberOfLines={1}>{item.bio}</Text>
                      ) : null}
                    </View>
                    <View style={styles.trainerSpots}>
                      <Text style={[styles.trainerSpotsText, spotsLeft <= 0 && { color: '#EF4444' }]}>
                        {spotsLeft > 0 ? `${spotsLeft} place${spotsLeft > 1 ? 's' : ''}` : 'Complet'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function QuickAction({ emoji, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.muted, fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, marginBottom: 22 },
  greeting: { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, fontStyle: 'italic' },
  name: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 24, marginTop: 2 },
  bellBtn:      { position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,239,227,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)' },
  bellBadge:    { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText:{ fontFamily: FONTS.uiBold, color: 'white', fontSize: 9 },

  // Modal recherche
  searchContainer:   { flex: 1, backgroundColor: COLORS.paper },
  searchHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.12)' },
  searchCancelBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchHeaderTitle: { fontFamily: FONTS.display, color: COLORS.deep, fontSize: 20, flex: 1 },
  searchInputWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, backgroundColor: 'rgba(126,102,58,0.07)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: 'rgba(126,102,58,0.15)' },
  searchInput:       { flex: 1, fontFamily: FONTS.regular, color: COLORS.deep, fontSize: 15 },
  searchEmpty:       { alignItems: 'center', paddingTop: 60, gap: 12 },
  searchEmptyText:   { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, fontStyle: 'italic' },

  trainerCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(126,102,58,0.12)' },
  trainerAvatar:     { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  trainerAvatarText: { fontFamily: FONTS.display, color: COLORS.parchment, fontSize: 18, fontStyle: 'italic' },
  trainerCardName:   { fontFamily: FONTS.uiBold, color: COLORS.deep, fontSize: 15, marginBottom: 3 },
  trainerCardMeta:   { fontFamily: FONTS.uiMedium, color: COLORS.accent, fontSize: 12, marginBottom: 3 },
  trainerCardBio:    { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12, fontStyle: 'italic' },
  trainerSpots:      { alignItems: 'flex-end', gap: 4 },
  trainerSpotsText:  { fontFamily: FONTS.uiMedium, color: '#10B981', fontSize: 11 },

  langBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.25)',
  },
  langFlag: { fontSize: 22 },

  progressCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 20, marginBottom: 24 },
  progressCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressCardLabel: { fontFamily: FONTS.uiBold, color: 'rgba(249,244,232,0.6)', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 },
  progressCardLevel: { fontFamily: FONTS.displayBold, color: COLORS.parchment, fontSize: 20 },
  progressCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  progressCircleText: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 13 },
  progressBar: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, height: 5, marginBottom: 8 },
  progressFill: { backgroundColor: COLORS.gold, borderRadius: 4, height: 5 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressSub: { fontFamily: FONTS.ui, color: 'rgba(249,244,232,0.55)', fontSize: 12 },
  progressLink: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 0.5 },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(245,239,227,0.07)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  quickLabel: { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 11 },

  sectionTitle: { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 11, letterSpacing: 1.5, marginBottom: 12, marginTop: 4 },

  lessonCard: {
    backgroundColor: 'rgba(245,239,227,0.06)', borderRadius: 8,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(126,102,58,0.2)',
  },
  lessonNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  lessonNumDone: { backgroundColor: COLORS.success ?? '#10B981' },
  lessonNumText: { fontFamily: FONTS.uiBold, color: COLORS.parchment, fontSize: 14 },
  lessonTitle: { fontFamily: FONTS.medium, color: COLORS.parchment, fontSize: 14, marginBottom: 2 },
  lessonSub: { fontFamily: FONTS.ui, color: COLORS.muted, fontSize: 11 },
  lessonArrow: { color: COLORS.gold, fontSize: 24 },

  liveCard:       { backgroundColor: 'rgba(161,94,45,0.1)', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: 'rgba(161,94,45,0.35)', marginBottom: 8 },
  liveCardActive: { borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.06)' },
  liveCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  livePill:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(184,137,58,0.2)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  livePillActive: { backgroundColor: 'rgba(239,68,68,0.2)' },
  liveDot:        { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.gold, marginRight: 5 },
  liveDotActive:  { backgroundColor: '#EF4444' },
  livePillText:   { fontFamily: FONTS.uiBold, color: COLORS.gold, fontSize: 10, letterSpacing: 0.5 },
  liveTime:       { fontFamily: FONTS.uiMedium, color: COLORS.cream, fontSize: 12 },
  liveTitle:      { fontFamily: FONTS.bold, color: COLORS.parchment, fontSize: 16, marginBottom: 4 },
  liveSub:        { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 13, marginBottom: 10 },
  liveFooter:     { borderTopWidth: 1, borderTopColor: 'rgba(126,102,58,0.15)', paddingTop: 10, marginTop: 4 },
  liveBtnText:    { fontFamily: FONTS.uiBold, color: COLORS.accent, fontSize: 12, letterSpacing: 0.8 },
});
