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

          {/* Brand block — 44×44 accent square + title + version */}
          <FadeInView delay={0} style={s.brand}>
            <View style={[s.brandIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="bag-handle" size={22} color="#fff" />
            </View>
            <View>
              <Text style={s.brandTitle}>Пазарувай умно</Text>
              <Text style={s.brandVersion}>v 2.4 · BG</Text>
            </View>
          </FadeInView>

          {/* Headline */}
          <FadeInView delay={40} style={s.headlineWrap}>
            <Text style={s.headline}>{'Здравейте\nотново.'}</Text>
            <Text style={s.subline}>Влезте, за да продължите...</Text>
          </FadeInView>

          {/* Email card — floating label style */}
          <FadeInView delay={80} style={s.inputCard}>
            <Text style={s.inputLabel}>EMAIL</Text>
            <TextInput
              style={s.inputValue}
              placeholder="вашият@имейл.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Имейл адрес"
            />
          </FadeInView>

          {/* Password card */}
          <FadeInView delay={100} style={[s.inputCard, { marginTop: 10 }]}>
            <View style={s.passwordHeader}>
              <Text style={s.inputLabel}>ПАРОЛА</Text>
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showPassword ? 'Скрий паролата' : 'Покажи паролата'}
              >
                <Text style={[s.showPw, { color: colors.primary }]}>
                  {showPassword ? 'скрий' : 'покажи'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              ref={passwordRef}
              style={s.inputValue}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Парола"
            />
          </FadeInView>

          {/* Remember me + forgot password */}
          <FadeInView delay={120} style={s.rememberRow}>
            <View style={s.rememberLeft}>
              <View style={[s.checkbox, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
              <Text style={s.rememberText}>Запомни ме</Text>
            </View>
            <Text style={[s.forgotText, { color: colors.primary }]}>Забравена парола?</Text>
          </FadeInView>

          {/* CTA button */}
          <FadeInView delay={140}>
            <AnimatedPressable
              style={[s.cta, { backgroundColor: colors.primary }, loading && s.ctaDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityLabel="Влез"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.ctaText}>Влез</Text>
              }
            </AnimatedPressable>
          </FadeInView>

          {/* Divider */}
          <FadeInView delay={160} style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={s.dividerLabel}>или</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          </FadeInView>

          {/* Social buttons */}
          <FadeInView delay={180} style={s.socialRow}>
            {[
              { label: 'Google', mark: 'G' },
              { label: 'Apple', mark: '' },
              { label: 'Телефон', mark: '☏' },
            ].map(b => (
              <TouchableOpacity
                key={b.label}
                style={[s.socialBtn, { backgroundColor: colors.card }]}
                activeOpacity={0.75}
                accessibilityLabel={`Влез с ${b.label}`}
              >
                <Text style={[s.socialMark, { color: colors.text }]}>{b.mark}</Text>
                <Text style={[s.socialLabel, { color: colors.textTertiary }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </FadeInView>

          {/* Register link */}
          <FadeInView delay={200} style={s.registerRow}>
            <Text style={s.registerText}>Нямате акаунт?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Регистрирай се"
              accessibilityRole="button"
            >
              <Text style={[s.registerLink, { color: colors.primary }]}>Регистрация</Text>
            </TouchableOpacity>
          </FadeInView>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark) {
  const shadowCard = {
    shadowColor: isDark ? '#000' : '#2b1d12',
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 44 },

    brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
    brandIcon: {
      width: 44, height: 44, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    brandTitle: { fontSize: 16, fontWeight: '700', color: c.text, letterSpacing: -0.2 },
    brandVersion: { fontSize: 11, color: c.textTertiary, marginTop: -1 },

    headlineWrap: { marginBottom: 28 },
    headline: {
      fontSize: 30, fontWeight: '700', letterSpacing: -0.6, lineHeight: 36, color: c.text,
    },
    subline: { marginTop: 10, fontSize: 14, lineHeight: 20, color: c.textSecondary },

    inputCard: {
      backgroundColor: c.card, borderRadius: 18,
      paddingHorizontal: 16, paddingVertical: 14,
      ...shadowCard,
    },
    inputLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
      textTransform: 'uppercase', color: c.textTertiary, marginBottom: 6,
    },
    inputValue: {
      fontSize: 16, fontWeight: '500', color: c.text, paddingVertical: 0,
    },
    passwordHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
    },
    showPw: { fontSize: 13, fontWeight: '600' },

    rememberRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 14, marginBottom: 22,
    },
    rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkbox: {
      width: 18, height: 18, borderRadius: 5,
      justifyContent: 'center', alignItems: 'center',
    },
    rememberText: { fontSize: 13, fontWeight: '500', color: c.textSecondary },
    forgotText: { fontSize: 13, fontWeight: '600' },

    cta: {
      height: 54, borderRadius: 999,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      shadowColor: c.primary, shadowOpacity: 0.32, shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 }, elevation: 7,
    },
    ctaDisabled: { opacity: 0.6, shadowOpacity: 0 },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 22 },
    dividerLine: { flex: 1, height: 1 },
    dividerLabel: {
      fontSize: 11, fontWeight: '600', color: c.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },

    socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    socialBtn: {
      flex: 1, height: 52, borderRadius: 18,
      justifyContent: 'center', alignItems: 'center', gap: 2,
      ...shadowCard,
    },
    socialMark: { fontSize: 16, fontWeight: '700' },
    socialLabel: { fontSize: 10, fontWeight: '600' },

    registerRow: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    },
    registerText: { fontSize: 13, fontWeight: '500', color: c.textTertiary },
    registerLink: { fontSize: 13, fontWeight: '700' },
  });
}
