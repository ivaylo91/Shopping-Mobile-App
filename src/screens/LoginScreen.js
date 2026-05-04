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
import { getShadows } from '../theme';

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
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Logo */}
          <FadeInView delay={0} style={s.logoWrap}>
            <View style={[s.logoCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="cart" size={36} color="#fff" />
            </View>
            <Text style={[s.appName, { color: colors.text }]}>ShopBudget</Text>
            <Text style={[s.tagline, { color: colors.textTertiary }]}>
              Планирай умно. Харчи по-малко.
            </Text>
          </FadeInView>

          {/* Card */}
          <FadeInView delay={80}>
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <Text style={[s.cardTitle, { color: colors.text }]}>Влезте в профила</Text>

              {/* Email */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.textTertiary }]}>ИМЕЙЛ</Text>
                <View style={[s.inputRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textQuaternary} />
                  <TextInput
                    style={[s.input, { color: colors.text }]}
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
              </View>

              {/* Password */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.textTertiary }]}>ПАРОЛА</Text>
                <View style={[s.inputRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textQuaternary} />
                  <TextInput
                    ref={passwordRef}
                    style={[s.input, { color: colors.text }]}
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
              </View>

              {/* CTA */}
              <AnimatedPressable
                style={[s.btn, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && s.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                accessibilityLabel="Влез"
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>Влез</Text>}
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Register link */}
          <FadeInView delay={160} style={s.footer}>
            <Text style={[s.footerText, { color: colors.textTertiary }]}>Нямате профил?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Регистрирай се"
              accessibilityRole="button"
            >
              <Text style={[s.footerLink, { color: colors.primary }]}>Регистрирай се</Text>
            </TouchableOpacity>
          </FadeInView>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark) {
  const sh = getShadows(isDark);
  return StyleSheet.create({
    safe: { flex: 1 },
    content: { flexGrow: 1, padding: 24, justifyContent: 'center', paddingBottom: 40 },

    logoWrap: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
      width: 80, height: 80, borderRadius: 24,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 16,
      shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 }, elevation: 8,
    },
    appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
    tagline: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

    card: { borderRadius: 20, padding: 24, gap: 18, ...sh.md },
    cardTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },

    fieldWrap: { gap: 8 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
      borderWidth: 1,
    },
    input: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },

    btn: {
      borderRadius: 16, paddingVertical: 17,
      alignItems: 'center', justifyContent: 'center',
      shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6,
      marginTop: 4,
    },
    btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
    footerText: { fontSize: 14, fontWeight: '500' },
    footerLink: { fontSize: 14, fontWeight: '700' },
  });
}
