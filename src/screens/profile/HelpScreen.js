import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/config';

const FAQS = [
  {
    cat: 'Abonnement & paiement',
    icon: '💳',
    items: [
      { q: "Comment fonctionne l'essai gratuit ?", a: "Votre essai gratuit de 7 jours démarre automatiquement à l'inscription. Vous avez accès à toutes les fonctionnalités Premium. Aucune carte bancaire n'est requise." },
      { q: "Quels moyens de paiement sont acceptés ?", a: "Carte Visa/Mastercard (Stripe), Orange Money, MTN Money (via CamPay) et PayPal. Les paiements sont sécurisés et chiffrés." },
      { q: "Comment annuler mon abonnement ?", a: "Rendez-vous dans Profil → Abonnement → Annuler. Votre accès reste actif jusqu'à la fin de la période payée." },
      { q: "Mes données sont-elles conservées si j'expire ?", a: "Oui ! Votre progression, certificats et notes sont conservés indéfiniment. Vous pouvez reprendre exactement là où vous vous étiez arrêté." },
    ],
  },
  {
    cat: 'Cours & apprentissage',
    icon: '📚',
    items: [
      { q: "Comment sont organisés les cours ?", a: "Les cours suivent le Cadre Européen Commun de Référence pour les Langues (CECRL) : A1 (Découverte) → A2 → B1 → B2 → C1 → C2 (Maîtrise). Chaque niveau a ses propres vidéos, PDF, QCM et mini-jeux." },
      { q: "Puis-je télécharger les cours hors ligne ?", a: "Le téléchargement des PDF est disponible à partir du plan Voyageur. Les vidéos nécessitent une connexion internet." },
      { q: "Comment fonctionne le tuteur IA Max ?", a: "Max est un assistant IA disponible 24h/24 qui répond à vos questions en allemand et en français. Il s'adapte à votre niveau et conserve l'historique de vos conversations." },
    ],
  },
  {
    cat: 'Formateurs & sessions live',
    icon: '👨‍🏫',
    items: [
      { q: "Comment suis-je assigné à un formateur ?", a: "L'assignation est automatique à l'inscription selon votre niveau et la disponibilité des formateurs. L'admin peut réassigner si nécessaire." },
      { q: "Comment rejoindre une session live ?", a: "Allez dans l'onglet Live → cliquez sur la session → Rejoindre. Les sessions live sont réservées aux plans Érudit (Premium)." },
      { q: "Puis-je contacter mon formateur ?", a: "Oui, via la messagerie intégrée (onglet Messages) accessible à partir du plan Voyageur. Les formateurs répondent généralement sous 24h." },
    ],
  },
  {
    cat: 'Certificats',
    icon: '🎓',
    items: [
      { q: "Comment obtenir un certificat ?", a: "Complétez au moins 70% du cursus d'un niveau (cours + QCM + sessions). L'administrateur émet alors votre certificat PDF signé numériquement." },
      { q: "Le certificat est-il reconnu officiellement ?", a: "C'est un certificat de la plateforme SprachReise, signé numériquement. Il atteste de votre progression CECRL mais n'est pas équivalent au Goethe-Zertifikat officiel." },
    ],
  },
  {
    cat: 'Problèmes techniques',
    icon: '🔧',
    items: [
      { q: "L'application ne se connecte pas au serveur.", a: "Vérifiez votre connexion internet. Si le problème persiste, fermez complètement l'application et rouvrez-la. En cas de problème répété, contactez le support." },
      { q: "La vidéo ne se charge pas.", a: "Assurez-vous d'avoir une connexion stable (Wi-Fi recommandé). Les vidéos utilisent un streaming adaptatif qui s'ajuste à votre débit." },
      { q: "J'ai oublié mon mot de passe.", a: "Sur l'écran de connexion, cliquez sur « Mot de passe oublié » et entrez votre email. Vous recevrez un lien de réinitialisation sous 5 minutes." },
    ],
  },
];

export default function HelpScreen({ navigation }) {
  const [openIdx, setOpenIdx] = useState(null); // "catIdx-itemIdx"

  const toggle = (key) => setOpenIdx(prev => prev === key ? null : key);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.deep} />
        </TouchableOpacity>
        <Text style={s.title}>Centre d'aide</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Bandeau contact */}
        <View style={s.contactBanner}>
          <View>
            <Text style={s.contactTitle}>Vous ne trouvez pas votre réponse ?</Text>
            <Text style={s.contactSub}>Notre équipe répond sous 24h</Text>
          </View>
          <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL('mailto:support@sprachreise.app')}>
            <Ionicons name="mail" size={16} color="white" />
            <Text style={s.contactBtnTxt}>Écrire</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ par catégorie */}
        {FAQS.map((cat, ci) => (
          <View key={ci} style={s.category}>
            <View style={s.catHeader}>
              <Text style={s.catIcon}>{cat.icon}</Text>
              <Text style={s.catTitle}>{cat.cat}</Text>
            </View>

            {cat.items.map((item, ii) => {
              const key = `${ci}-${ii}`;
              const open = openIdx === key;
              return (
                <TouchableOpacity key={key} style={s.faqCard} onPress={() => toggle(key)} activeOpacity={0.8}>
                  <View style={s.faqQ}>
                    <Text style={s.faqQTxt}>{item.q}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} />
                  </View>
                  {open && (
                    <View style={s.faqA}>
                      <Text style={s.faqATxt}>{item.a}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Liens utiles */}
        <View style={s.linksSection}>
          <Text style={s.linksSectionTitle}>LIENS UTILES</Text>
          {[
            { icon: 'document-text', label: 'Conditions générales d\'utilisation', url: 'https://sprachreise.app/cgu' },
            { icon: 'shield-checkmark', label: 'Politique de confidentialité', url: 'https://sprachreise.app/privacy' },
            { icon: 'globe', label: 'Site web SprachReise', url: 'https://sprachreise.app' },
          ].map((l, i) => (
            <TouchableOpacity key={i} style={s.linkRow} onPress={() => Linking.openURL(l.url)}>
              <Ionicons name={l.icon} size={18} color={COLORS.primary} />
              <Text style={s.linkTxt}>{l.label}</Text>
              <Ionicons name="open-outline" size={14} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:     { fontFamily: FONTS.display, fontSize: 20, color: COLORS.deep, fontStyle: 'italic' },

  contactBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.deep, borderRadius: 14, padding: 16, marginBottom: 24 },
  contactTitle:  { fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.parchment, marginBottom: 3 },
  contactSub:    { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, fontStyle: 'italic' },
  contactBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  contactBtnTxt: { fontFamily: FONTS.uiBold, fontSize: 13, color: 'white' },

  category:  { marginBottom: 20 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catIcon:   { fontSize: 18 },
  catTitle:  { fontFamily: FONTS.uiBold, fontSize: 14, color: COLORS.deep, letterSpacing: 0.3 },

  faqCard: { backgroundColor: COLORS.parchment, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.paperDeep, overflow: 'hidden' },
  faqQ:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  faqQTxt: { fontFamily: FONTS.uiBold, fontSize: 13, color: COLORS.deep, flex: 1, lineHeight: 18 },
  faqA:    { backgroundColor: COLORS.paperDeep, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 },
  faqATxt: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.deep, lineHeight: 20 },

  linksSection:     { backgroundColor: COLORS.parchment, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.paperDeep, marginTop: 8 },
  linksSectionTitle:{ fontFamily: FONTS.uiBold, fontSize: 11, color: COLORS.muted, letterSpacing: 2, marginBottom: 12 },
  linkRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  linkTxt:          { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.deep, flex: 1 },
});
