import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SUBSCRIPTION_PLANS } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

const plans = [
  {
    key: 'BASIC',
    ...SUBSCRIPTION_PLANS.BASIC,
    features: ['Accès aux cours A1–A2', '5 sessions live / mois', 'QCM illimités', 'Support email'],
    recommended: false,
  },
  {
    key: 'STANDARD',
    ...SUBSCRIPTION_PLANS.STANDARD,
    features: ['Accès aux cours A1–B2', '15 sessions live / mois', 'QCM illimités', 'Certificats de niveau', 'Support prioritaire'],
    recommended: true,
  },
  {
    key: 'PREMIUM',
    ...SUBSCRIPTION_PLANS.PREMIUM,
    features: ['Accès à tous les cours', 'Sessions live illimitées', 'QCM & examens blancs', 'Certificats officiels', 'Coaching individuel', 'Support 24h/7j'],
    recommended: false,
  },
];

export default function PricingScreen({ navigation, route }) {
  const [selected, setSelected] = useState('STANDARD');
  const authData = route?.params?.authData;

  const handleContinue = () => {
    navigation.navigate('LanguageSelect', { authData, plan: selected });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>VOTRE FORMULE</Text>
          <Text style={styles.title}>Choisissez votre{'\n'}abonnement</Text>
          <Text style={styles.subtitle}>
            Commencez votre voyage linguistique. Annulable à tout moment.
          </Text>
        </View>

        {plans.map((plan) => {
          const isSelected = selected === plan.key;
          return (
            <TouchableOpacity
              key={plan.key}
              style={[styles.card, isSelected && styles.cardSelected, plan.recommended && styles.cardRecommended]}
              onPress={() => setSelected(plan.key)}
              activeOpacity={0.85}
            >
              {plan.recommended && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>RECOMMANDÉ</Text>
                </View>
              )}

              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                    {plan.label}
                  </Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={[styles.price, isSelected && styles.priceSelected]}>
                    {plan.price.toLocaleString()}
                  </Text>
                  <Text style={[styles.currency, isSelected && styles.currencySelected]}>
                    FCFA/mois
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {plan.features.map((feat, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, isSelected && styles.featureCheckSelected]}>✓</Text>
                  <Text style={[styles.featureText, isSelected && styles.featureTextSelected]}>
                    {feat}
                  </Text>
                </View>
              ))}

              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>● Sélectionné</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>COMMENCER MAINTENANT</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleContinue} style={styles.skipLink}>
          <Text style={styles.skipText}>Passer pour l'instant</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deep },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { paddingTop: 32, marginBottom: 28 },
  eyebrow: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.gold,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.display,
    color: COLORS.parchment,
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
  },

  card: {
    backgroundColor: 'rgba(245,239,227,0.05)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126,102,58,0.25)',
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: 'rgba(161,94,45,0.18)',
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  cardRecommended: {
    borderColor: COLORS.gold,
  },

  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.deep,
    fontSize: 9,
    letterSpacing: 1.5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontFamily: FONTS.displayBold,
    color: COLORS.cream,
    fontSize: 20,
    marginBottom: 2,
  },
  planNameSelected: { color: COLORS.parchment },
  planLabel: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 11,
    letterSpacing: 1,
  },
  planLabelSelected: { color: COLORS.gold },
  priceBlock: { alignItems: 'flex-end' },
  price: {
    fontFamily: FONTS.displayBold,
    color: COLORS.cream,
    fontSize: 26,
  },
  priceSelected: { color: COLORS.parchment },
  currency: {
    fontFamily: FONTS.ui,
    color: COLORS.muted,
    fontSize: 11,
  },
  currencySelected: { color: COLORS.gold },

  divider: {
    height: 1,
    backgroundColor: 'rgba(126,102,58,0.2)',
    marginBottom: 12,
  },

  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  featureCheck: {
    fontFamily: FONTS.uiBold,
    color: COLORS.muted,
    fontSize: 13,
    marginRight: 10,
    marginTop: 1,
  },
  featureCheckSelected: { color: COLORS.gold },
  featureText: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  featureTextSelected: { color: COLORS.cream },

  selectedIndicator: { marginTop: 12 },
  selectedIndicatorText: {
    fontFamily: FONTS.uiMedium,
    color: COLORS.gold,
    fontSize: 12,
  },

  continueBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    padding: 17,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  continueBtnText: {
    fontFamily: FONTS.uiBold,
    color: COLORS.parchment,
    fontSize: 14,
    letterSpacing: 1.5,
  },

  skipLink: { alignItems: 'center', paddingVertical: 8 },
  skipText: {
    fontFamily: FONTS.regular,
    color: COLORS.muted,
    fontSize: 14,
  },
});
