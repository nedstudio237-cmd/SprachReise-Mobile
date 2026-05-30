import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/config';

const TABS = ['Description', 'Documents', 'Notes'];

const CHAPTERS = [
  { id: 1, title: 'Alphabet et prononciation', duration: '15 min', done: true },
  { id: 2, title: 'Les salutations formelles', duration: '20 min', done: true },
  { id: 3, title: 'Se présenter', duration: '25 min', done: false },
  { id: 4, title: 'Les chiffres 1–20', duration: '18 min', done: false },
  { id: 5, title: 'Les couleurs', duration: '15 min', done: false },
];

const DOCUMENTS = [
  { id: 1, title: 'Fiche vocabulaire A1', type: 'PDF', size: '245 Ko' },
  { id: 2, title: 'Exercices de prononciation', type: 'PDF', size: '180 Ko' },
  { id: 3, title: 'Tableau des conjugaisons', type: 'PDF', size: '310 Ko' },
];

export default function CourseDetailScreen({ route, navigation }) {
  const [activeTab, setActiveTab] = useState('Description');
  const course = route?.params?.course ?? {
    title: 'Introduction à l\'allemand',
    level: 'A1',
    trainer: 'Dr. Emma Nguema',
    duration: '4h 30min',
    chapters: 12,
    enrolled: 248,
    rating: 4.8,
    description: 'Ce cours vous initie aux bases de la langue allemande : alphabet, prononciation, salutations et présentations. Idéal pour les débutants complets souhaitant commencer leur voyage linguistique vers l\'Allemagne, l\'Autriche ou la Suisse.',
  };

  const completedChapters = CHAPTERS.filter((c) => c.done).length;
  const progress = Math.round((completedChapters / CHAPTERS.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{course.level}</Text>
          </View>
          <Text style={styles.heroTitle}>{course.title}</Text>
          <Text style={styles.heroTrainer}>par {course.trainer}</Text>

          <View style={styles.heroStats}>
            <StatChip icon="⏱" label={course.duration} />
            <StatChip icon="📖" label={`${course.chapters} chapitres`} />
            <StatChip icon="👥" label={`${course.enrolled} apprenants`} />
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{progress}%</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {activeTab === 'Description' && (
          <>
            <Text style={styles.descText}>{course.description}</Text>

            <Text style={styles.sectionLabel}>PROGRAMME DU COURS</Text>
            {CHAPTERS.map((ch) => (
              <View key={ch.id} style={[styles.chapterRow, ch.done && styles.chapterRowDone]}>
                <View style={[styles.chapterDot, ch.done && styles.chapterDotDone]}>
                  {ch.done && <Text style={styles.chapterCheck}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chapterTitle, ch.done && styles.chapterTitleDone]}>
                    {ch.title}
                  </Text>
                  <Text style={styles.chapterDuration}>{ch.duration}</Text>
                </View>
                {!ch.done && <Text style={styles.chapterArrow}>›</Text>}
              </View>
            ))}

            <TouchableOpacity style={styles.continueBtn}>
              <Text style={styles.continueBtnText}>CONTINUER LE COURS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qcmBtn}
              onPress={() => navigation?.navigate('Qcm')}
            >
              <Text style={styles.qcmBtnText}>📝  PASSER LE QCM</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'Documents' && (
          <>
            <Text style={styles.sectionLabel}>RESSOURCES TÉLÉCHARGEABLES</Text>
            {DOCUMENTS.map((doc) => (
              <TouchableOpacity key={doc.id} style={styles.docRow}>
                <View style={styles.docIcon}>
                  <Text style={styles.docIconText}>📄</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docMeta}>{doc.type} · {doc.size}</Text>
                </View>
                <Text style={styles.docDownload}>↓</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'Notes' && (
          <View style={styles.notesEmpty}>
            <Text style={styles.notesEmptyIcon}>📝</Text>
            <Text style={styles.notesEmptyTitle}>Aucune note pour l'instant</Text>
            <Text style={styles.notesEmptyText}>
              Prenez des notes pendant vos cours pour les retrouver ici.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({ icon, label }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },

  hero: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: { paddingTop: 16, paddingBottom: 12, alignSelf: 'flex-start' },
  backText: {
    color: COLORS.parchment,
    fontSize: 28,
    lineHeight: 28,
  },
  heroContent: { marginBottom: 16 },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 8,
  },
  levelText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 4,
  },
  heroTrainer: {
    fontFamily: FONTS.regular,
    color: 'rgba(249,244,232,0.75)',
    fontSize: 14,
    marginBottom: 14,
  },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statIcon: { fontSize: 11 },
  statLabel: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.parchment,
    fontSize: 11,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.parchment,
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 12,
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(126,102,58,0.2)',
    backgroundColor: COLORS.deep,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: COLORS.gold },
  tabText: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.muted,
    fontSize: 13,
  },
  tabTextActive: { color: COLORS.gold },

  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  descText: {
    fontFamily: FONTS.regular,
    color: COLORS.cream,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(126,102,58,0.15)',
  },
  chapterRowDone: { opacity: 0.7 },
  chapterDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(126,102,58,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chapterDotDone: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  chapterCheck: { color: COLORS.deep, fontSize: 13, fontWeight: 'bold' },
  chapterTitle: {
    fontFamily: FONTS.medium,
    color: COLORS.parchment,
    fontSize: 14,
    marginBottom: 2,
  },
  chapterTitleDone: { textDecorationLine: 'line-through', color: COLORS.muted },
  chapterDuration: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 12,
  },
  chapterArrow: { color: COLORS.muted, fontSize: 20 },

  continueBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  continueBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  qcmBtn: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
  },
  qcmBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.gold,
    fontSize: 13,
    letterSpacing: 1,
  },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(126,102,58,0.15)',
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(161,94,45,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIconText: { fontSize: 20 },
  docTitle: {
    fontFamily: FONTS.medium,
    color: COLORS.parchment,
    fontSize: 14,
    marginBottom: 2,
  },
  docMeta: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 12,
  },
  docDownload: {
    color: COLORS.gold,
    fontSize: 22,
    paddingLeft: 12,
  },

  notesEmpty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  notesEmptyIcon: { fontSize: 56, marginBottom: 16 },
  notesEmptyTitle: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 20,
    marginBottom: 10,
  },
  notesEmptyText: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
