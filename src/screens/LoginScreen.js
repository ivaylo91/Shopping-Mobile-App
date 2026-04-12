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
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, loginAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Грешка', 'Моля попълнете всички полета');
      return;
    }
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
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Имейл адрес</Text>
        <TextInput
          style={styles.input}
          placeholder="вашият@имейл.com"
          placeholderTextColor="#A0A0B0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Password */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Парола</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Въведете паролата си"
            placeholderTextColor="#A0A0B0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Влез</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Нямате акаунт? <Text style={styles.linkBold}>Регистрирай се</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.guestBtn} onPress={loginAsGuest}>
        <Text style={styles.guestText}>Тествай без вход →</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#fff' },
  subtitle: { fontSize: 13, fontWeight: '700', color: '#6C63FF', textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', marginBottom: 36, textAlign: 'center' },

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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0F0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },
  eyeBtn: { paddingHorizontal: 14 },
  eyeIcon: { fontSize: 18 },

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
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  link: { color: '#999', textAlign: 'center', fontSize: 14 },
  linkBold: { color: '#6C63FF', fontWeight: '700' },
  guestBtn: { marginTop: 24, alignItems: 'center' },
  guestText: { color: '#bbb', fontSize: 13, fontWeight: '600' },
});
