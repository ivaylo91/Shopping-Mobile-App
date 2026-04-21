import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const registerSchema = z
  .object({
    email: z.string().min(1, 'Имейлът е задължителен').email('Невалиден имейл адрес'),
    password: z.string().min(6, 'Паролата трябва да е поне 6 символа'),
    confirm: z.string().min(1, 'Потвърждението е задължително'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Паролите не съвпадат',
    path: ['confirm'],
  });

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  });

  const passwordValue = watch('password');

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      await register(email.trim(), password);
    } catch (err) {
      Alert.alert('Неуспешна регистрация', err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(colors, isDark);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>Умно Пазаруване</Text>
        <Text style={s.title}>Регистрирай се 🛒</Text>

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
                  placeholder="Минимум 6 символа"
                  placeholderTextColor={colors.textQuaternary}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}
              {!errors.password && value.length > 0 && value.length < 6 && (
                <Text style={[s.hintWarn, { color: colors.orange }]}>Паролата трябва да е поне 6 символа</Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, value } }) => (
            <View style={s.fieldWrap}>
              <Text style={s.label}>Потвърди паролата</Text>
              <View style={[s.passwordRow, errors.confirm && s.passwordRowError]}>
                <TextInput
                  style={s.passwordInput}
                  placeholder="Повторете паролата"
                  placeholderTextColor={colors.textQuaternary}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirm}
                  autoComplete="new-password"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              {errors.confirm && <Text style={s.errorText}>{errors.confirm.message}</Text>}
              {!errors.confirm && value.length > 0 && value === passwordValue && (
                <Text style={[s.hintOk, { color: colors.green }]}>Паролите съвпадат ✓</Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity style={[s.button, loading && s.buttonDisabled]} onPress={handleSubmit(onSubmit)} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Регистрирай се</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={s.link}>
            Вече имате акаунт? <Text style={s.linkBold}>Влез</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.card },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
    subtitle: { fontSize: 13, fontWeight: '700', color: c.primary, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
    title: { fontSize: 30, fontWeight: '800', color: c.text, marginBottom: 36, textAlign: 'center' },
    fieldWrap: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '700', color: c.textSecondary, marginBottom: 7 },
    input: { borderWidth: 1.5, borderColor: c.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: c.text, backgroundColor: c.cardAlt },
    inputError: { borderColor: c.red },
    passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: c.border, borderRadius: 12, backgroundColor: c.cardAlt },
    passwordRowError: { borderColor: c.red },
    passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: c.text },
    eyeBtn: { paddingHorizontal: 14 },
    errorText: { fontSize: 12, color: c.red, marginTop: 5, marginLeft: 4 },
    hintWarn: { fontSize: 12, marginTop: 5, marginLeft: 4 },
    hintOk: { fontSize: 12, marginTop: 5, marginLeft: 4 },
    button: { backgroundColor: c.primary, borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 6, marginBottom: 20, shadowColor: c.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
    buttonDisabled: { opacity: 0.6, shadowOpacity: 0 },
    buttonText: { color: '#fff', fontWeight: '800', fontSize: 17 },
    link: { color: c.textTertiary, textAlign: 'center', fontSize: 14 },
    linkBold: { color: c.primary, fontWeight: '700' },
  });
}
