import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, API_BASE_URL } from '../../constants/config';

const TABS = ['Cours', 'QCMs', 'Évaluations'];

export default function TrainerPublicProfileScreen({ navigation, route }) {
  const { trainerId } = route.params;
  const { accessToken } = useAuthStore();

  const [profile, setProfile]   = useState(null);
  const [courses, setCourses]   = useState([]);
  const [qcms,    setQcms]      = useState([]);
  const [exams,   setExams]     = useState([]);
  const [tab,     setTab]       = useState(0);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!trainerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [profileRes, coursesRes, qcmsRes, examsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trainers/${trainerId}`, { headers }),
        fetch(`${API_BASE_URL}/trainers/${trainerId}/courses`, { headers }),
        fetch(`${API_BASE_URL}/trainers/${trainerId}/qcms`, { headers }),
        fetch(`${API_BASE_URL}/trainers/${trainerId}/exams`, { headers }),
      ]);
      if (!profileRes.ok) {
        setLoading(false);
        navigation.goBack();
        return;
      }
      const [p, c, q, e] = await Promise.all([
        profileRes.json(), coursesRes.json(), qcmsRes.json(), examsRes.json(),
      ]);
      setProfile(p);
      setCourses(Array.isArray(c) ? c : []);
      setQcms(Array.isArray(q) ? q : []);
      setExams(Array.isArray(e) ? e : []);
    } catch {
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [trainerId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleContact = () => {
    navigation.navigate('Conversation', { otherUserId: trainerId, otherName: profile ? `${profile.firstName} ${profile.lastName}` : '' });
  };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator style={{ marginTop: 60 }} color={COLORS.accent} />
    </SafeAreaView>
  );

  if (!profile) return (
    <SafeAreaView style={s.container}>
      <Text style={s.errorText}>Formateur introuvable</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView stickyHeaderIndices={[1]}>
        {/* Header profil */}
        <View style={s.profileHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>‹</Text>
          </TouchableOpacity>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')}
            </Text>
          </View>
          <Text style={s.name}>{profile.firstName} {profile.lastName}</Text>
          <View style={s.levelBadge}>
            <Text style={s.levelBadgeText}>Niveau {profile.teachingLevel} · Formateur</Text>
          </View>
          {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

          <View style={s.statsRow}>
            <Stat value={courses.length} label="Cours" />
            <Stat value={qcms.length} label="QCMs" />
            <Stat value={profile.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'} label="Note" />
            <Stat value={`${profile.currentStudents}/${profile.maxStudents}`} label="Élèves" />
          </View>

          <TouchableOpacity style={s.contactBtn} onPress={handleContact}>
            <Text style={s.contactBtnText}>✉ Contacter le formateur</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={t} style={[s.tab, tab === i && s.tabActive]} onPress={() => setTab(i)}>
              <Text style={[s.tabText, tab === i && s.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenu */}
        <View style={s.content}>
          {tab === 0 && (
            courses.length === 0
              ? <Empty text="Aucun cours publié" />
              : courses.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={s.item}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: c.id })}
                >
                  <View style={s.itemLeft}>
                    <View style={s.itemIcon}><Text style={{ fontSize: 18 }}>📚</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemTitle}>{c.title}</Text>
                      <Text style={s.itemMeta}>{c.levelCode}{c.theme ? ` · ${c.theme}` : ''}</Text>
                    </View>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              ))
          )}

          {tab === 1 && (
            qcms.length === 0
              ? <Empty text="Aucun QCM publié" />
              : qcms.map(q => (
                <TouchableOpacity
                  key={q.id}
                  style={s.item}
                  onPress={() => navigation.navigate('Qcm', { qcmId: q.id })}
                >
                  <View style={s.itemLeft}>
                    <View style={s.itemIcon}><Text style={{ fontSize: 18 }}>📝</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemTitle}>{q.title}</Text>
                      <Text style={s.itemMeta}>{q.levelCode} · {q.questionCount} questions{q.theme ? ` · ${q.theme}` : ''}</Text>
                    </View>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              ))
          )}

          {tab === 2 && (
            exams.length === 0
              ? <Empty text="Aucune évaluation publiée" />
              : exams.map(e => (
                <View key={e.id} style={s.item}>
                  <View style={s.itemLeft}>
                    <View style={s.itemIcon}><Text style={{ fontSize: 18 }}>🎓</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemTitle}>{e.title}</Text>
                      {e.scheduledAt && (
                        <Text style={s.itemMeta}>{new Date(e.scheduledAt).toLocaleDateString('fr-FR')}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Empty({ text }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.paper },
  errorText:      { textAlign: 'center', marginTop: 60, fontFamily: FONTS.regular, color: COLORS.muted },

  profileHeader:  { backgroundColor: COLORS.deep, paddingHorizontal: 24, paddingBottom: 28, paddingTop: 16, alignItems: 'center' },
  backBtn:        { alignSelf: 'flex-start', marginBottom: 16 },
  backText:       { fontFamily: FONTS.display, color: 'rgba(255,255,255,0.8)', fontSize: 28 },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText:     { fontFamily: FONTS.display, color: 'white', fontSize: 28, fontStyle: 'italic' },
  name:           { fontFamily: FONTS.display, color: COLORS.parchment || '#F9F4E8', fontSize: 24, marginBottom: 8, fontStyle: 'italic' },
  levelBadge:     { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  levelBadgeText: { fontFamily: FONTS.uiBold, color: COLORS.cream || '#D9CAAA', fontSize: 11, letterSpacing: 1 },
  bio:            { fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 16, fontStyle: 'italic' },
  statsRow:       { flexDirection: 'row', gap: 20, marginBottom: 20 },
  stat:           { alignItems: 'center' },
  statValue:      { fontFamily: FONTS.display, color: COLORS.cream || '#D9CAAA', fontSize: 22, fontStyle: 'italic' },
  statLabel:      { fontFamily: FONTS.uiMedium, color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1, marginTop: 2 },
  contactBtn:     { backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 6 },
  contactBtnText: { fontFamily: FONTS.uiBold, color: 'white', fontSize: 13, letterSpacing: 0.5 },

  tabs:           { flexDirection: 'row', backgroundColor: COLORS.paper, borderBottomWidth: 1, borderBottomColor: 'rgba(126,102,58,0.15)' },
  tab:            { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText:        { fontFamily: FONTS.uiMedium, color: COLORS.muted, fontSize: 13 },
  tabTextActive:  { color: COLORS.accent, fontFamily: FONTS.uiBold },

  content:        { padding: 16 },
  item:           { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(126,102,58,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemIcon:       { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' },
  itemTitle:      { fontFamily: FONTS.uiBold, color: COLORS.deep, fontSize: 14, marginBottom: 3 },
  itemMeta:       { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 12 },
  chevron:        { fontFamily: FONTS.display, color: COLORS.muted, fontSize: 22 },

  empty:          { paddingVertical: 40, alignItems: 'center' },
  emptyText:      { fontFamily: FONTS.regular, color: COLORS.muted, fontSize: 14, fontStyle: 'italic' },
});
