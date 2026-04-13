import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../context/ToastContext';
import { generateList } from '../utils/generateList';

const GOALS = [
  { id: 'cheapest',    label: 'Най-евтино',  icon: '💰', desc: 'Максимална стойност' },
  { id: 'healthy',     label: 'Здравословно', icon: '🥗', desc: 'Балансирано хранене' },
  { id: 'high_protein', label: 'Протеин',    icon: '💪', desc: 'Богато на протеин' },
];

const STORES = [
  { id: 'any',      label: 'Всички' },
  { id: 'Lidl',     label: 'Lidl' },
  { id: 'Kaufland', label: 'Kaufland' },
  { id: 'Billa',    label: 'Billa' },
];

function AnimatedPressable({ onPress, style, children, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { logout, user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { show: showToast } = useToast();

  const [budget, setBudget] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedStore, setSelectedStore] = useState('any');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Моля въведете валиден бюджет', 'warning');
      return;
    }
    if (!selectedGoal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Моля изберете цел на пазаруването', 'warning');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    try {
      const list = generateList({
        products,
        budget: parseFloat(budget),
        goal: selectedGoal,
        store: selectedStore,
      });

      if (list.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('Няма продукти. Опитайте с друг магазин или бюджет.', 'warning');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('ShoppingList', {
        list,
        budget: parseFloat(budget),
        goal: selectedGoal,
        store: selectedStore,
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectGoal = (goalId) => {
    Haptics.selectionAsync();
    setSelectedGoal(goalId);
  };

  const selectStore = (storeId) => {
    Haptics.selectionAsync();
    setSelectedStore(storeId);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Здравей, {user?.email?.split('@')[0]} 👋</Text>
          <Text style={styles.title}>Умно{'\n'}Пазаруване</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            logout();
          }}
        >
          <Ionicons name="log-out-outline" size={16} color="#666" />
          <Text style={styles.logoutText}>Изход</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Вашият бюджет</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.currency}>€</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder="0.00"
            placeholderTextColor="#bbb"
            value={budget}
            onChangeText={setBudget}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Goal Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Цел на пазаруването</Text>
        <View style={styles.goalsRow}>
          {GOALS.map((goal) => (
            <AnimatedPressable
              key={goal.id}
              style={[styles.goalCard, selectedGoal === goal.id && styles.goalCardActive]}
              onPress={() => selectGoal(goal.id)}
            >
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <Text style={[styles.goalLabel, selectedGoal === goal.id && styles.goalLabelActive]}>
                {goal.label}
              </Text>
              <Text style={[styles.goalDesc, selectedGoal === goal.id && styles.goalDescActive]}>
                {goal.desc}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      {/* Store Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Избери магазин</Text>
        <View style={styles.storesRow}>
          {STORES.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={[styles.storeChip, selectedStore === store.id && styles.storeChipActive]}
              onPress={() => selectStore(store.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.storeLabel, selectedStore === store.id && styles.storeLabelActive]}>
                {store.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Button */}
      <AnimatedPressable
        style={[
          styles.generateBtn,
          (generating || productsLoading) && styles.generateBtnDisabled,
        ]}
        onPress={handleGenerate}
        disabled={generating || productsLoading}
      >
        {generating || productsLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.generateBtnText}>Генерирай списък</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 10 }} />
          </>
        )}
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { padding: 24, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    marginTop: 12,
  },
  greeting: { fontSize: 14, color: '#999', marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', lineHeight: 36 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 6,
  },
  logoutText: { color: '#666', fontSize: 13, fontWeight: '600' },

  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  currency: { fontSize: 22, fontWeight: '700', color: '#6C63FF', marginRight: 10 },
  budgetInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    paddingVertical: 14,
  },

  goalsRow: { flexDirection: 'row', gap: 10 },
  goalCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  goalCardActive: { borderColor: '#6C63FF', backgroundColor: '#F0EEFF' },
  goalIcon: { fontSize: 26, marginBottom: 6 },
  goalLabel: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 2 },
  goalLabelActive: { color: '#6C63FF' },
  goalDesc: { fontSize: 10, color: '#aaa', textAlign: 'center' },
  goalDescActive: { color: '#9b96d4' },

  storesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  storeChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  storeChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  storeLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  storeLabelActive: { color: '#fff' },

  generateBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  generateBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  generateBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
