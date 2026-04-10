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
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      Alert.alert('Грешка', 'Моля попълнете всички полета');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Грешка', 'Паролите не съвпадат');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Грешка', 'Паролата трябва да е поне 6 символа');
      return;
    }
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Умно Пазаруване</Text>
        <Text style={styles.title}>Регистрирай се 🛒</Text>

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
              placeholder="Минимум 6 символа"
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
          {password.length > 0 && password.length < 6 && (
            <Text style={styles.hint}>⚠️ Паролата трябва да е поне 6 символа</Text>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Потвърди паролата</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Повторете паролата"
              placeholderTextColor="#A0A0B0"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm((v) => !v)}
            >
              <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {confirm.length > 0 && confirm !== password && (
            <Text style={styles.hintError}>⚠️ Паролите не съвпадат</Text>
          )}
          {confirm.length > 0 && confirm === password && (
            <Text style={styles.hintOk}>✅ Паролите съвпадат</Text>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Регистрирай се</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Вече имате акаунт? <Text style={styles.linkBold}>Влез</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
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

  hint: { fontSize: 12, color: '#f39c12', marginTop: 5, marginLeft: 4 },
  hintError: { fontSize: 12, color: '#e74c3c', marginTop: 5, marginLeft: 4 },
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
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  link: { color: '#999', textAlign: 'center', fontSize: 14 },
  linkBold: { color: '#6C63FF', fontWeight: '700' },
});
