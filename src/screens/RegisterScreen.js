import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Имейлът е задължителен')
      .email('Невалиден имейл адрес'),
    password: z.string().min(6, 'Паролата трябва да е поне 6 символа'),
    confirm: z.string().min(1, 'Потвърждението е задължително'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Паролите не съвпадат',
    path: ['confirm'],
  });

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  });

  // Watch password to show live match hint
  const passwordValue = watch('password');
  const confirmValue = watch('confirm');

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Умно Пазаруване</Text>
        <Text style={styles.title}>Регистрирай се 🛒</Text>

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Имейл адрес</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="вашият@имейл.com"
                placeholderTextColor="#A0A0B0"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>
          )}
        />

        {/* Password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Парола</Text>
              <View style={[styles.passwordRow, errors.password && styles.passwordRowError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Минимум 6 символа"
                  placeholderTextColor="#A0A0B0"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#A0A0B0"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
              {!errors.password && value.length > 0 && value.length < 6 && (
                <Text style={styles.hintWarn}>Паролата трябва да е поне 6 символа</Text>
              )}
            </View>
          )}
        />

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Потвърди паролата</Text>
              <View style={[styles.passwordRow, errors.confirm && styles.passwordRowError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Повторете паролата"
                  placeholderTextColor="#A0A0B0"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirm}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#A0A0B0"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirm && (
                <Text style={styles.errorText}>{errors.confirm.message}</Text>
              )}
              {!errors.confirm && value.length > 0 && value === passwordValue && (
                <Text style={styles.hintOk}>Паролите съвпадат ✓</Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Регистрирай се</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Вече имате акаунт?{' '}
            <Text style={styles.linkBold}>Влез</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },

  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C63FF',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 36,
    textAlign: 'center',
  },

  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 7 },

  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: '#e74c3c' },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0F0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  passwordRowError: { borderColor: '#e74c3c' },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },
  eyeBtn: { paddingHorizontal: 14 },

  errorText: { fontSize: 12, color: '#e74c3c', marginTop: 5, marginLeft: 4 },
  hintWarn: { fontSize: 12, color: '#f39c12', marginTop: 5, marginLeft: 4 },
  hintOk: { fontSize: 12, color: '#2ecc71', marginTop: 5, marginLeft: 4 },

  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.6, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  link: { color: '#999', textAlign: 'center', fontSize: 14 },
  linkBold: { color: '#6C63FF', fontWeight: '700' },
});
