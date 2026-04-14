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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Имейлът е задължителен')
    .email('Невалиден имейл адрес'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа'),
});

export default function LoginScreen({ navigation }) {
  const { login, loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.subtitle}>Умно Пазаруване</Text>
      <Text style={styles.title}>Добре дошли 👋</Text>

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
                placeholder="Въведете паролата си"
                placeholderTextColor="#A0A0B0"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                autoComplete="password"
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
          <Text style={styles.buttonText}>Влез</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>
          Нямате акаунт?{' '}
          <Text style={styles.linkBold}>Регистрирай се</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.guestBtn} onPress={loginAsGuest}>
        <Text style={styles.guestText}>Тествай без вход →</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#fff' },
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

  guestBtn: { marginTop: 24, alignItems: 'center' },
  guestText: { color: '#bbb', fontSize: 13, fontWeight: '600' },
});
