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

export default function RegisterScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { register } = useAuth();
  const { show: showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const handleRegister = async () => {
    if (!name.trim()) { showToast('Въведете вашето име', 'warning'); return; }
    if (!email.trim()) { showToast('Въведете имейл', 'warning'); return; }
    if (!email.includes('@')) { showToast('Невалиден имейл адрес', 'warning'); return; }
    if (password.length < 6) { showToast('Паролата трябва да е поне 6 символа', 'warning'); return; }
    if (password !== confirm) { showToast('Паролите не съвпадат', 'error'); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await register(name, email, password);
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

          {/* Header */}
          <FadeInView delay={0} style={s.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Назад"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </FadeInView>

          {/* Title */}
          <FadeInView delay={40} style={s.titleWrap}>
            <Text style={[s.title, { color: colors.text }]}>Създай профил</Text>
            <Text style={[s.subtitle, { color: colors.textTertiary }]}>
              Безплатно. Само за теб.
            </Text>
          </FadeInView>

          {/* Card */}
          <FadeInView delay={100}>
            <View style={[s.card, { backgroundColor: colors.card }]}>

              {/* Name */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.textTertiary }]}>ИМЕ</Text>
                <View style={[s.inputRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={18} color={colors.textQuaternary} />
                  <TextInput
                    style={[s.input, { color: colors.text }]}
                    placeholder="Вашето ime"
                    placeholderTextColor={colors.textQuaternary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                    accessibilityLabel="Вашето ime"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.textTertiary }]}>ИМЕЙЛ</Text>
                <View style={[s.inputRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textQuaternary} />
                  <TextInput
                    ref={emailRef}
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
                    placeholder="мин. 6 символа"
                    placeholderTextColor={colors.textQuaternary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
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

              {/* Confirm password */}
              <View style={s.fieldWrap}>
                <Text style={[s.label, { color: colors.textTertiary }]}>ПОТВЪРДИ ПАРОЛАТА</Text>
                <View style={[
                  s.inputRow,
                  { backgroundColor: colors.cardAlt, borderColor: confirm && confirm !== password ? colors.red : colors.border },
                ]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.textQuaternary} />
                  <TextInput
                    ref={confirmRef}
                    style={[s.input, { color: colors.text }]}
                    placeholder="повтори паролата"
                    placeholderTextColor={colors.textQuaternary}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                    accessibilityLabel="Потвърди паролата"
                  />
                  {confirm.length > 0 && (
                    <Ionicons
                      name={confirm === password ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={confirm === password ? colors.green : colors.red}
                    />
                  )}
                </View>
              </View>

              {/* CTA */}
              <AnimatedPressable
                style={[s.btn, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && s.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
                accessibilityLabel="Регистрирай се"
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>Регистрирай се</Text>}
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Login link */}
          <FadeInView delay={180} style={s.footer}>
            <Text style={[s.footerText, { color: colors.textTertiary }]}>Вече имате профил?</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Влез"
              accessibilityRole="button"
            >
              <Text style={[s.footerLink, { color: colors.primary }]}>Влез</Text>
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
    content: { flexGrow: 1, padding: 24, paddingBottom: 40 },

    header: { marginBottom: 8 },
    titleWrap: { marginBottom: 24, marginTop: 8 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
    subtitle: { fontSize: 14, fontWeight: '500' },

    card: { borderRadius: 20, padding: 24, gap: 16, ...sh.md },

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
