import { useState, useMemo } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Text from '../components/Text';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';

const loginSchema = z.object({
  email: z.string().min(1, 'Имейлът е задължителен').email('Невалиден имейл адрес'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа'),
});

export default function LoginScreen({ navigation }) {
  const { login, loginAsGuest } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { isTablet } = useLayout();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Неуспешен вход', err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={s.themeToggle} onPress={toggleTheme} accessibilityLabel={isDark ? 'Превключи светла тема' : 'Превключи тъмна тема'} accessibilityRole="button">
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.formWrap}>
      <Text style={s.subtitle}>Умно Пазаруване</Text>
      <Text style={s.title}>Добре дошли 👋</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View style={s.fieldWrap}>
            <Text style={s.label}>Имейл адрес</Text>
            <TextInput
              style={[s.input, errors.email && s.inputError]}
              placeholder="вашият@имейл.com"
              placeholderTextColor={colors.textQuaternary}
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Имейл адрес"
            />
            {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View style={s.fieldWrap}>
            <Text style={s.label}>Парола</Text>
            <View style={[s.passwordRow, errors.password && s.passwordRowError]}>
              <TextInput
                style={s.passwordInput}
                placeholder="Въведете паролата си"
                placeholderTextColor={colors.textQuaternary}
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                autoComplete="password"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Парола"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel={showPassword ? 'Скрий паролата' : 'Покажи паролата'} accessibilityRole="button">
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
          </View>
        )}
      />

      <TouchableOpacity style={[s.button, loading && s.buttonDisabled]} onPress={handleSubmit(onSubmit)} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Влез</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={s.link}>
          Нямате акаунт? <Text style={s.linkBold}>Регистрирай се</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.guestBtn} onPress={loginAsGuest}>
        <Text style={s.guestText}>Тествай без вход →</Text>
      </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c, isDark, isTablet) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.card },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 28, alignItems: isTablet ? 'center' : undefined },
    formWrap: isTablet ? { width: '100%', maxWidth: 440 } : {},
    themeToggle: { position: 'absolute', top: 60, right: 24, padding: 8, zIndex: 1 },
    subtitle: { fontSize: 13, fontWeight: '700', color: c.primary, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
    title: { fontSize: 26, fontWeight: '700', color: c.text, marginBottom: 36, textAlign: 'center' },
    fieldWrap: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '700', color: c.textSecondary, marginBottom: 7 },
    input: { borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: c.text, backgroundColor: c.cardAlt },
    inputError: { borderColor: c.red },
    passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: c.border, borderRadius: 12, backgroundColor: c.cardAlt },
    passwordRowError: { borderColor: c.red },
    passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: c.text },
    eyeBtn: { paddingHorizontal: 14 },
    errorText: { fontSize: 12, color: c.red, marginTop: 5, marginLeft: 4 },
    button: { backgroundColor: c.primary, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 6, marginBottom: 20, shadowColor: c.primary, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
    buttonDisabled: { opacity: 0.6, shadowOpacity: 0 },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
    link: { color: c.textTertiary, textAlign: 'center', fontSize: 14 },
    linkBold: { color: c.primary, fontWeight: '700' },
    guestBtn: { marginTop: 24, alignItems: 'center' },
    guestText: { color: c.textQuaternary, fontSize: 13, fontWeight: '600' },
  });
}
