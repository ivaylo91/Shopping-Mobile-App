import { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { generateList } from '../utils/generateList';

const GOALS = [
  { id: 'cheapest', label: 'Най-евтино', icon: '💰', desc: 'Максимална стойност' },
  { id: 'healthy', label: 'Здравословно', icon: '🥗', desc: 'Балансирано хранене' },
  { id: 'high_protein', label: 'Протеин', icon: '💪', desc: 'Богато на протеин' },
];

const STORES = [
  { id: 'any', label: 'Всички' },
  { id: 'Lidl', label: 'Lidl' },
  { id: 'Kaufland', label: 'Kaufland' },
  { id: 'Billa', label: 'Billa' },
];

export default function HomeScreen({ navigation }) {
  const { logout, user } = useAuth();
  const { products, loading: productsLoading } = useProducts();

  const [budget, setBudget] = useState('');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedStore, setSelectedStore] = useState('any');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      Alert.alert('Невалиден бюджет', 'Моля въведете валидна сума.');
      return;
    }
    if (!selectedGoal) {
      Alert.alert('Изберете цел', 'Моля изберете цел за пазаруване.');
      return;
    }

    setGenerating(true);
    try {
      const list = generateList({
        products,
        budget: parseFloat(budget),
        goal: selectedGoal,
        store: selectedStore,
      });

      if (list.length === 0) {
        Alert.alert(
          'Няма резултати',
          'Не са намерени продукти. Опитайте с друг магазин или по-висок бюджет.'
        );
        return;
      }

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Здравей, {user?.email?.split('@')[0]} 👋</Text>
          <Text style={styles.title}>Умно{'\n'}Пазаруване</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
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
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalCard, selectedGoal === goal.id && styles.goalCardActive]}
              onPress={() => setSelectedGoal(goal.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <Text
                style={[
                  styles.goalLabel,
                  selectedGoal === goal.id && styles.goalLabelActive,
                ]}
              >
                {goal.label}
              </Text>
              <Text
                style={[
                  styles.goalDesc,
                  selectedGoal === goal.id && styles.goalDescActive,
                ]}
              >
                {goal.desc}
              </Text>
            </TouchableOpacity>
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
              style={[
                styles.storeChip,
                selectedStore === store.id && styles.storeChipActive,
              ]}
              onPress={() => setSelectedStore(store.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.storeLabel,
                  selectedStore === store.id && styles.storeLabelActive,
                ]}
              >
                {store.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[
          styles.generateBtn,
          (generating || productsLoading) && styles.generateBtnDisabled,
        ]}
        onPress={handleGenerate}
        disabled={generating || productsLoading}
        activeOpacity={0.85}
      >
        {generating || productsLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.generateBtnText}>Генерирай списък</Text>
            <Text style={styles.generateBtnArrow}>→</Text>
          </>
        )}
      </TouchableOpacity>

      {/* My Orders shortcut */}
      <TouchableOpacity
        style={styles.ordersLink}
        onPress={() => navigation.navigate('SavedLists')}
      >
        <Text style={styles.ordersLinkText}>📋 Запазени списъци</Text>
      </TouchableOpacity>
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
  goalCardActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#F0EEFF',
  },
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
  storeChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
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
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  generateBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  generateBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  generateBtnArrow: { color: '#fff', fontSize: 20, marginLeft: 10 },

  ordersLink: { alignItems: 'center', paddingVertical: 8 },
  ordersLinkText: { color: '#9b96d4', fontSize: 14, fontWeight: '600' },
});
