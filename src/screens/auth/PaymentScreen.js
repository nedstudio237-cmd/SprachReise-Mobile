import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL, COLORS, FONTS } from '../../constants/config';

const PLANS = {
  BASIC:    { name: 'Apprenti',  price: 3000,  eur: '4.6',  color: '#10B981', icon: '🥉', features: ['Cursus QCM + mini-jeux','Profils formateurs','Lecture PDF en ligne','Tuteur IA Max'] },
  STANDARD: { name: 'Voyageur', price: 7500,  eur: '11.5', color: COLORS.gold, icon: '⭐', features: ['Tout Apprenti','Vidéos des cours','Téléchargement PDF','Évaluations formateur'], recommended: true },
  PREMIUM:  { name: 'Érudit',   price: 15000, eur: '22.9', color: '#8B5CF6', icon: '🏆', features: ['Tout Voyageur','Sessions live','Certificats signés','Contact direct formateurs'] },
};

const METHODS = [
  { id: 'stripe',        label: 'Carte bancaire',    sub: 'Visa / Mastercard', icon: '💳' },
  { id: 'orange',        label: 'Orange Money',      sub: 'Réseau Orange CM',  icon: '🟠' },
  { id: 'mtn',           label: 'MTN Money',         sub: 'Réseau MTN CM',     icon: '🟡' },
  { id: 'paypal',        label: 'PayPal',            sub: 'Compte PayPal',     icon: '🔵' },
];

export default function PaymentScreen({ route, navigation }) {
  const { plan: initialPlan = 'STANDARD', fromProfile = false } = route.params || {};
  const { accessToken, user } = useAuthStore();

  const [selectedPlan, setPlan]     = useState(initialPlan);
  const [method, setMethod]         = useState('stripe');
  const [cardNum, setCardNum]       = useState('');
  const [cardExp, setCardExp]       = useState('');
  const [cardCvc, setCardCvc]       = useState('');
  const [cardName, setCardName]     = useState('');
  const [phone, setPhone]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [step, setStep]             = useState(1); // 1=plan 2=méthode 3=formulaire

  const planInfo = PLANS[selectedPlan];

  const post = async (path, body) => {
    const r = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      let initRes;

      if (method === 'stripe') {
        if (!cardNum.trim() || !cardExp.trim() || !cardCvc.trim() || !cardName.trim())
          return Alert.alert('Champs requis', 'Remplissez tous les champs carte.');
        initRes = await post('/subscription/pay/stripe', { plan: selectedPlan });
      } else if (method === 'orange') {
        if (!phone.trim()) return Alert.alert('Téléphone requis', 'Entrez votre numéro Orange Money.');
        initRes = await post('/subscription/pay/campay', { plan: selectedPlan, phone, operator: 'ORANGE' });
      } else if (method === 'mtn') {
        if (!phone.trim()) return Alert.alert('Téléphone requis', 'Entrez votre numéro MTN Money.');
        initRes = await post('/subscription/pay/campay', { plan: selectedPlan, phone, operator: 'MTN' });
      } else if (method === 'paypal') {
        initRes = await post('/subscription/pay/paypal', { plan: selectedPlan });
      }

      if (initRes?.error) { Alert.alert('Erreur', initRes.error); return; }

      // Simuler la confirmation (en prod : attendre le webhook ou le retour Stripe/PayPal)
      const ref = initRes.paymentIntentId ?? initRes.reference ?? initRes.orderId;
      const confirmRes = await post('/subscription/pay/confirm', { externalRef: ref });

      if (confirmRes?.error) { Alert.alert('Erreur', confirmRes.error); return; }

      Alert.alert(
        '🎉 Abonnement activé !',
        `Plan ${planInfo.name} activé jusqu'au ${confirmRes.expiresAt}.\nUn email de confirmation vous a été envoyé.`,
        [{ text: 'Continuer', onPress: () => navigation.replace(fromProfile ? 'Tabs' : 'Tabs') }]
      );
    } catch (e) {
      Alert.alert('Erreur réseau', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Formater le numéro de carte
  const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExp  = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0,2) + '/' + d.slice(2) : d; };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step-1) : navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.deep} />
          </TouchableOpacity>
          <View style={s.steps}>
            {[1,2,3].map(i => (
              <View key={i} style={[s.stepDot, step >= i && s.stepDotActive]}>
                <Text style={[s.stepTxt, step >= i && s.stepTxtActive]}>{i}</Text>
              </View>
            ))}
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* ── ÉTAPE 1 : Choisir le plan ── */}
          {step === 1 && (
            <>
              <Text style={s.title}>Choisissez votre plan</Text>
              <Text style={s.sub}>7 jours d'essai gratuit inclus avec tout plan</Text>

              {Object.entries(PLANS).map(([key, p]) => (
                <TouchableOpacity key={key} style={[s.planCard, selectedPlan === key && { borderColor: p.color, borderWidth: 2 }]}
                  onPress={() => setPlan(key)}>
                  {p.recommended && <View style={[s.recBadge, { backgroundColor: p.color }]}><Text style={s.recTxt}>RECOMMANDÉ</Text></View>}
                  <View style={s.planHeader}>
                    <Text style={s.planIcon}>{p.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.planName}>{p.name}</Text>
                      <Text style={s.planPrice}>{p.price.toLocaleString()} FCFA<Text style={s.planPer}> /mois</Text></Text>
                    </View>
                    <View style={[s.radio, selectedPlan === key && { backgroundColor: p.color, borderColor: p.color }]}>
                      {selectedPlan === key && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                  </View>
                  <View style={s.planFeatures}>
                    {p.features.map((f, i) => (
                      <View key={i} style={s.featureRow}>
                        <Ionicons name="checkmark-circle" size={14} color={p.color} />
                        <Text style={s.featureTxt}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}

              <View style={s.trialBanner}>
                <Ionicons name="gift" size={18} color={COLORS.gold} />
                <Text style={s.trialTxt}>Essai gratuit de 7 jours · Aucun débit immédiat</Text>
              </View>

              <TouchableOpacity style={s.nextBtn} onPress={() => setStep(2)}>
                <Text style={s.nextBtnTxt}>CONTINUER</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </>
          )}

          {/* ── ÉTAPE 2 : Méthode de paiement ── */}
          {step === 2 && (
            <>
              <Text style={s.title}>Mode de paiement</Text>
              <Text style={s.sub}>Plan {planInfo.name} · {planInfo.price.toLocaleString()} FCFA/mois</Text>

              {METHODS.map(m => (
                <TouchableOpacity key={m.id} style={[s.methodCard, method === m.id && s.methodCardActive]}
                  onPress={() => setMethod(m.id)}>
                  <Text style={s.methodIcon}>{m.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.methodLabel}>{m.label}</Text>
                    <Text style={s.methodSub}>{m.sub}</Text>
                  </View>
                  <View style={[s.radio, method === m.id && { backgroundColor: COLORS.accent, borderColor: COLORS.accent }]}>
                    {method === m.id && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Logos partenaires */}
              <View style={s.partnersRow}>
                <View style={s.partnerBadge}><Text style={s.partnerTxt}>🔒 Paiement sécurisé</Text></View>
                <View style={s.partnerBadge}><Text style={s.partnerTxt}>🇨🇲 CamPay</Text></View>
                <View style={s.partnerBadge}><Text style={s.partnerTxt}>🌐 PayPal Sandbox</Text></View>
              </View>

              <TouchableOpacity style={s.nextBtn} onPress={() => setStep(3)}>
                <Text style={s.nextBtnTxt}>CONTINUER</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </>
          )}

          {/* ── ÉTAPE 3 : Formulaire de paiement ── */}
          {step === 3 && (
            <>
              {/* Récapitulatif */}
              <View style={s.recap}>
                <Text style={s.recapTitle}>{planInfo.icon} Plan {planInfo.name}</Text>
                <Text style={s.recapPrice}>{planInfo.price.toLocaleString()} FCFA<Text style={s.recapPer}>/mois</Text></Text>
              </View>

              {/* Formulaire Carte */}
              {method === 'stripe' && (
                <View style={s.form}>
                  <Text style={s.formTitle}>💳 Carte bancaire</Text>
                  <Text style={s.formNote}>Mode test — utilisez 4242 4242 4242 4242</Text>

                  <Text style={s.label}>Titulaire</Text>
                  <TextInput style={s.input} placeholder="Nom sur la carte" placeholderTextColor={COLORS.muted}
                    value={cardName} onChangeText={setCardName} autoCapitalize="characters" />

                  <Text style={s.label}>Numéro de carte</Text>
                  <TextInput style={s.input} placeholder="4242 4242 4242 4242" placeholderTextColor={COLORS.muted}
                    value={cardNum} onChangeText={v => setCardNum(formatCard(v))} keyboardType="numeric" maxLength={19} />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Expiration</Text>
                      <TextInput style={s.input} placeholder="MM/AA" placeholderTextColor={COLORS.muted}
                        value={cardExp} onChangeText={v => setCardExp(formatExp(v))} keyboardType="numeric" maxLength={5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>CVC</Text>
                      <TextInput style={s.input} placeholder="123" placeholderTextColor={COLORS.muted}
                        value={cardCvc} onChangeText={setCardCvc} keyboardType="numeric" maxLength={4} secureTextEntry />
                    </View>
                  </View>
                </View>
              )}

              {/* Formulaire Orange / MTN */}
              {(method === 'orange' || method === 'mtn') && (
                <View style={s.form}>
                  <Text style={s.formTitle}>{method === 'orange' ? '🟠 Orange Money' : '🟡 MTN Money'}</Text>
                  <Text style={s.formNote}>Via CamPay · Mode démo · Aucun débit réel</Text>

                  <View style={[s.infoBanner, { borderColor: method === 'orange' ? '#F97316' : '#EAB308' }]}>
                    <Ionicons name="information-circle" size={16} color={method === 'orange' ? '#F97316' : '#EAB308'} />
                    <Text style={s.infoTxt}>
                      Vous recevrez une notification USSD sur votre téléphone pour confirmer le paiement.
                    </Text>
                  </View>

                  <Text style={s.label}>Numéro {method === 'orange' ? 'Orange' : 'MTN'} (format +237…)</Text>
                  <TextInput style={s.input} placeholder="+237 6XX XXX XXX" placeholderTextColor={COLORS.muted}
                    value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              )}

              {/* PayPal */}
              {method === 'paypal' && (
                <View style={s.form}>
                  <Text style={s.formTitle}>🔵 PayPal Sandbox</Text>
                  <Text style={s.formNote}>Compte développeur sandbox · Aucun débit réel</Text>

                  <View style={[s.infoBanner, { borderColor: '#0070BA' }]}>
                    <Ionicons name="information-circle" size={16} color="#0070BA" />
                    <Text style={s.infoTxt}>
                      Vous serez redirigé vers PayPal Sandbox pour approuver le paiement de {planInfo.eur} EUR.
                    </Text>
                  </View>

                  <View style={s.paypalTestBox}>
                    <Text style={s.paypalTestTitle}>Compte test PayPal :</Text>
                    <Text style={s.paypalTestLine}>Email : sb-buyer@personal.example.com</Text>
                    <Text style={s.paypalTestLine}>MDP : Test@12345</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={[s.payBtn, loading && s.payBtnDisabled]} onPress={handlePay} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="white" />
                  : <>
                      <Ionicons name="lock-closed" size={16} color="white" />
                      <Text style={s.payBtnTxt}>
                        PAYER {planInfo.price.toLocaleString()} FCFA
                      </Text>
                    </>}
              </TouchableOpacity>

              <Text style={s.secureNote}>🔒 Paiement 100% sécurisé · Annulable à tout moment</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.paperDeep },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  steps:     { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stepDot:   { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.paperDeep, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: COLORS.deep },
  stepTxt:   { fontFamily: FONTS.uiBold, fontSize: 12, color: COLORS.muted },
  stepTxtActive: { color: 'white' },

  title: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.deep, fontStyle: 'italic', marginBottom: 4 },
  sub:   { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, fontStyle: 'italic', marginBottom: 20 },

  // Plans
  planCard:     { backgroundColor: COLORS.parchment, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: COLORS.paperDeep, position: 'relative' },
  recBadge:     { position: 'absolute', top: -10, left: 16, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  recTxt:       { fontFamily: FONTS.uiBold, fontSize: 9, color: 'white', letterSpacing: 1 },
  planHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  planIcon:     { fontSize: 28 },
  planName:     { fontFamily: FONTS.uiBold, fontSize: 16, color: COLORS.deep },
  planPrice:    { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.accent, marginTop: 2 },
  planPer:      { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },
  planFeatures: { gap: 6 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureTxt:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.deep },
  radio:        { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },

  trialBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.gold + '18', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: COLORS.gold + '44' },
  trialTxt:    { fontFamily: FONTS.uiBold, fontSize: 12, color: COLORS.deep, flex: 1 },

  // Méthodes
  methodCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.parchment, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.paperDeep },
  methodCardActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '08' },
  methodIcon:       { fontSize: 26 },
  methodLabel:      { fontFamily: FONTS.uiBold, fontSize: 14, color: COLORS.deep },
  methodSub:        { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 2 },
  partnersRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 12 },
  partnerBadge:     { backgroundColor: COLORS.paperDeep, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  partnerTxt:       { fontFamily: FONTS.ui, fontSize: 11, color: COLORS.muted },

  // Formulaire
  recap:      { backgroundColor: COLORS.deep, borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recapTitle: { fontFamily: FONTS.uiBold, fontSize: 16, color: COLORS.parchment },
  recapPrice: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.gold },
  recapPer:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },

  form:        { backgroundColor: COLORS.parchment, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.paperDeep },
  formTitle:   { fontFamily: FONTS.uiBold, fontSize: 16, color: COLORS.deep, marginBottom: 4 },
  formNote:    { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginBottom: 14 },
  label:       { fontFamily: FONTS.uiBold, fontSize: 11, color: COLORS.primary, letterSpacing: 1, marginBottom: 6, marginTop: 10 },
  input:       { backgroundColor: COLORS.paperDeep, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.regular, fontSize: 15, color: COLORS.deep, borderWidth: 1, borderColor: COLORS.paperDeep },

  infoBanner:  { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, backgroundColor: 'transparent', marginBottom: 12, marginTop: 4 },
  infoTxt:     { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.deep, flex: 1, lineHeight: 18 },

  paypalTestBox:   { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#BFDBFE', marginTop: 4 },
  paypalTestTitle: { fontFamily: FONTS.uiBold, fontSize: 12, color: '#1D4ED8', marginBottom: 4 },
  paypalTestLine:  { fontFamily: FONTS.ui, fontSize: 12, color: '#374151', marginBottom: 2 },

  nextBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.deep, borderRadius: 12, paddingVertical: 16, marginTop: 8 },
  nextBtnTxt: { fontFamily: FONTS.uiBold, fontSize: 15, color: COLORS.parchment, letterSpacing: 0.5 },

  payBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 16, marginTop: 8 },
  payBtnDisabled:{ opacity: 0.6 },
  payBtnTxt:     { fontFamily: FONTS.uiBold, fontSize: 15, color: 'white', letterSpacing: 0.5 },
  secureNote:    { textAlign: 'center', fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 12, fontStyle: 'italic' },
});
