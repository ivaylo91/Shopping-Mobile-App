import { useState, useMemo, useRef } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import AnimatedPressable from '../components/AnimatedPressable';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { login } = useAuth();
  const { show: showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef(null);
  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const handleLogin = async () => {
    if (!email.trim()) { showToast('Въведете имейл', 'warning'); return; }
    if (!password) { showToast('Въведете парола', 'warning'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Step indicator */}
          <FadeInView delay={0}>
            <Text style={s.stepLabel}>ПАЗАРУВАЙ УМНО</Text>
          </FadeInView>

          {/* CozyOnboarding-style headline */}
          <FadeInView delay={40} style={s.headlineWrap}>
            <Text style={s.headline}>{'Пазарувайте\nумно.'}</Text>
            <Text style={s.subline}>
              Сравнявайте цени между вериги, следете бюджета си и спестявайте всяка седмица.
            </Text>
          </FadeInView>

          {/* Decorative budget card */}
          <FadeInView delay={80} style={s.budgetPreviewCard}>
            <Text style={s.budgetPreviewLabel}>СЕДМИЧЕН БЮДЖЕТ</Text>
            <View style={s.budgetPreviewMain}>
              <Text style={s.budgetPreviewAmount}>120</Text>
              <Text style={s.budgetPreviewCurrency}> лв.</Text>
            </View>
            <View style={s.budgetPreviewTrack}>
              <View style={[s.budgetPreviewFill, { backgroundColor: colors.primary }]} />
            </View>
            <View style={s.budgetPreviewFooter}>
              <Text style={s.budgetPreviewFooterText}>40 лв.</Text>
              <Text style={s.budgetPreviewFooterText}>200 лв.</Text>
            </View>
          </FadeInView>

          {/* Email field */}
          <FadeInView delay={120} style={s.fieldsWrap}>
            <View style={s.pillField}>
              <Ionicons name="mail-outline" size={18} color={colors.textQuaternary} />
              <TextInput
                style={s.pillInput}
                placeholder="вашият@имейл.com"
                placeholderTextColor={colors.textQuaternary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Имейл адрес"
              />
            </View>

            {/* Password field */}
            <View style={s.pillField}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textQuaternary} />
              <TextInput
                ref={passwordRef}
                style={s.pillInput}
                placeholder="••••••••"
                placeholderTextColor={colors.textQuaternary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Парола"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showPassword ? 'Скрий паролата' : 'Покажи паролата'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textQuaternary}
                />
              </TouchableOpacity>
            </View>
          </FadeInView>

          {/* CTA — pill button */}
          <FadeInView delay={160} style={s.ctaWrap}>
            <AnimatedPressable
              style={[s.cta, { backgroundColor: colors.primary }, loading && s.ctaDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityLabel="Влез"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Text style={s.ctaText}>Продължи</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
            </AnimatedPressable>

            {/* Register link */}
            <View style={s.registerRow}>
              <Text style={s.registerText}>Нямате профил?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Регистрирай се"
                accessibilityRole="button"
              >
                <Text style={[s.registerLink, { color: colors.primary }]}>Регистрирай се</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 44 },

    stepLabel: {
      fontSize: 11, fontWeight: '700', letterSpacing: 0.9,
      color: c.textTertiary, textTransform: 'uppercase', marginBottom: 20,
    },

    headlineWrap: { marginBottom: 28 },
    headline: {
      fontSize: 38, fontWeight: '700', letterSpacing: -0.8, lineHeight: 44,
      color: c.text,
    },
    subline: {
      marginTop: 14, fontSize: 15, lineHeight: 22,
      color: c.textSecondary, maxWidth: 300,
    },

    // Decorative budget preview card — CozyOnboarding slider card
    budgetPreviewCard: {
      backgroundColor: c.card, borderRadius: 22, padding: 20,
      marginBottom: 28,
      shadowColor: isDark ? '#000' : '#2B1D12',
      shadowOpacity: isDark ? 0.3 : 0.07,
      shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    budgetPreviewLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 0.7,
      color: c.textTertiary, textTransform: 'uppercase', marginBottom: 6,
    },
    budgetPreviewMain: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
    budgetPreviewAmount: {
      fontSize: 36, fontWeight: '700', letterSpacing: -0.5, color: c.text,
    },
    budgetPreviewCurrency: { fontSize: 18, fontWeight: '500', color: c.textTertiary },
    budgetPreviewTrack: {
      height: 6, borderRadius: 999, backgroundColor: c.cardAlt,
      marginBottom: 10, overflow: 'hidden',
      position: 'relative',
    },
    budgetPreviewFill: { height: 6, width: '50%', borderRadius: 999 },
    budgetPreviewFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    budgetPreviewFooterText: { fontSize: 12, color: c.textQuaternary, fontWeight: '500' },

    fieldsWrap: { gap: 10, marginBottom: 20 },
    pillField: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.card, borderRadius: 999,
      paddingHorizontal: 20, paddingVertical: 16,
      shadowColor: isDark ? '#000' : '#2B1D12',
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8, elevation: 2,
    },
    pillInput: { flex: 1, fontSize: 15, fontWeight: '500', color: c.text, paddingVertical: 0 },

    ctaWrap: { gap: 14 },
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      height: 52, borderRadius: 999,
      shadowColor: c.primary, shadowOpacity: 0.28, shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 }, elevation: 6,
    },
    ctaDisabled: { opacity: 0.6, shadowOpacity: 0 },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    registerRow: {
      flexDirection: 'row', justifyContent: 'center',
      alignItems: 'center', gap: 6,
    },
    registerText: { fontSize: 14, fontWeight: '500', color: c.textTertiary },
    registerLink: { fontSize: 14, fontWeight: '700' },
  });
}
