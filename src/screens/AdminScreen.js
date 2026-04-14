import { useState, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../context/ToastContext';
import { getCategoryIcon, CATEGORY_ICONS } from '../utils/ui';
import { KAUFLAND_PRODUCTS } from '../utils/kauflandProducts';

const CATEGORIES = Object.keys(CATEGORY_ICONS);
const STORES = ['Lidl', 'Kaufland', 'Billa'];
const UNITS = ['бр.', 'кг', 'л', 'г', 'мл', 'пакет'];

const EMPTY_FORM = {
  name: '',
  price: '',
  unit: 'бр.',
  store: 'Lidl',
  category: 'meat',
  protein: '',
  calories: '',
  isHealthy: false,
};

// ─── Product row ──────────────────────────────────────────────────────────────

const ProductRow = memo(function ProductRow({ item, onEdit, onDelete }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{getCategoryIcon(item.category)}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowMeta}>
          {item.price?.toFixed(2)} € · {item.store} · {item.unit}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => onEdit(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="pencil-outline" size={17} color="#6C63FF" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={17} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );
});

// ─── Picker row ───────────────────────────────────────────────────────────────

function PickerRow({ label, options, value, onChange }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        <View style={styles.optionsRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optChip, value === opt && styles.optChipActive]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.optChipText, value === opt && styles.optChipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Product form modal ───────────────────────────────────────────────────────

function ProductModal({ visible, initial, onClose, onSave, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  // Sync when `initial` changes (edit vs. add)
  const resetForm = useCallback((data) => setForm(data || EMPTY_FORM), []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('Грешка', 'Въведете наименование'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { Alert.alert('Грешка', 'Въведете валидна цена'); return; }
    onSave({
      ...form,
      name: form.name.trim(),
      price,
      protein: parseInt(form.protein) || 0,
      calories: parseInt(form.calories) || 0,
    });
  };

  // Reset form when modal opens
  const handleShow = () => resetForm(initial);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleShow}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#555" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {initial ? 'Редактирай продукт' : 'Нов продукт'}
            </Text>
            <TouchableOpacity
              style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.modalSaveBtnText}>Запази</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Наименование *</Text>
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={(v) => set('name', v)}
                placeholder="Пример: Пилешко филе 500г"
                placeholderTextColor="#bbb"
              />
            </View>

            {/* Price + Unit */}
            <View style={styles.row2col}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Цена (€) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.price}
                  onChangeText={(v) => set('price', v)}
                  placeholder="0.00"
                  placeholderTextColor="#bbb"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Единица</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.unit}
                  onChangeText={(v) => set('unit', v)}
                  placeholder="бр."
                  placeholderTextColor="#bbb"
                />
              </View>
            </View>

            {/* Unit chips */}
            <View style={styles.optionsRow}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.optChip, form.unit === u && styles.optChipActive]}
                  onPress={() => set('unit', u)}
                >
                  <Text style={[styles.optChipText, form.unit === u && styles.optChipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Store */}
            <PickerRow
              label="Магазин"
              options={STORES}
              value={form.store}
              onChange={(v) => set('store', v)}
            />

            {/* Category */}
            <PickerRow
              label="Категория"
              options={CATEGORIES}
              value={form.category}
              onChange={(v) => set('category', v)}
            />

            {/* Protein + Calories */}
            <View style={styles.row2col}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Протеин (г/100г)</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(form.protein)}
                  onChangeText={(v) => set('protein', v)}
                  placeholder="0"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Калории (kcal)</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(form.calories)}
                  onChangeText={(v) => set('calories', v)}
                  placeholder="0"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* isHealthy toggle */}
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Здравословен</Text>
              <Switch
                value={form.isHealthy}
                onValueChange={(v) => set('isHealthy', v)}
                trackColor={{ false: '#ddd', true: '#6C63FF' }}
                thumbColor="#fff"
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const { products, loading } = useProducts();
  const { show: showToast } = useToast();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add mode
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleImportKaufland = () => {
    Alert.alert(
      'Импорт от Kaufland',
      `Ще бъдат добавени ${KAUFLAND_PRODUCTS.length} продукта от брошурата (13–19.04.2026). Продължаване?`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Импортирай',
          onPress: async () => {
            setImporting(true);
            try {
              const col = collection(db, 'products');
              const now = serverTimestamp();
              // Firestore allows up to 500 writes per batch; our list is well under that
              // Firestore allows max 500 writes per batch
              const CHUNK = 499;
              for (let i = 0; i < KAUFLAND_PRODUCTS.length; i += CHUNK) {
                const batch = writeBatch(db);
                for (const p of KAUFLAND_PRODUCTS.slice(i, i + CHUNK)) {
                  batch.set(doc(col), { ...p, store: 'Kaufland', createdAt: now });
                }
                await batch.commit();
              }
              await batch.commit();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast(`${KAUFLAND_PRODUCTS.length} продукта добавени`, 'success');
            } catch (err) {
              showToast(err?.message || 'Неуспешен импорт', 'error');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.store?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditTarget(null);
    setModalVisible(true);
  };

  const openEdit = useCallback((item) => {
    Haptics.selectionAsync();
    setEditTarget({
      ...item,
      price: String(item.price ?? ''),
      protein: String(item.protein ?? ''),
      calories: String(item.calories ?? ''),
    });
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback((item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Изтрий продукт',
      `Сигурни ли сте, че искате да изтриете "${item.name}"?`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', item.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Продуктът е изтрит', 'info');
            } catch (err) {
              showToast(err?.message || 'Неуспешно изтриване', 'error');
            }
          },
        },
      ]
    );
  }, [showToast]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editTarget?.id) {
        // Update existing
        const { id, ...data } = formData;
        await updateDoc(doc(db, 'products', editTarget.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showToast('Продуктът е обновен', 'success');
      } else {
        // Create new
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        showToast('Продуктът е добавен', 'success');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
    } catch (err) {
      showToast(err?.message || 'Неуспешен запис', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = useCallback(({ item }) => (
    <ProductRow
      item={item}
      onEdit={openEdit}
      onDelete={handleDelete}
    />
  ), [openEdit, handleDelete]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Администрация</Text>
          <Text style={styles.headerSub}>
            {loading ? 'Зарежда се…' : `${products.length} продукта`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#E8A020' }]}
            onPress={handleImportKaufland}
            activeOpacity={0.85}
            disabled={importing}
          >
            {importing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="cloud-download-outline" size={20} color="#fff" />}
            <Text style={styles.addBtnText}>Kaufland</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Добави</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Търси по име, категория, магазин…"
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      {!loading && (
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {filtered.length === products.length
              ? `Всички ${products.length} продукта`
              : `${filtered.length} от ${products.length}`}
          </Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={20}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="search-outline" size={48} color="#E0E0EA" />
              <Text style={styles.emptyText}>Няма намерени продукти</Text>
            </View>
          }
        />
      )}

      {/* Modal */}
      <ProductModal
        visible={modalVisible}
        initial={editTarget}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        saving={saving}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyText: { fontSize: 15, color: '#bbb', fontWeight: '600' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  headerSub: { fontSize: 13, color: '#999', marginTop: 2 },
  addBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E' },

  statsRow: { paddingHorizontal: 20, paddingVertical: 8 },
  statsText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  rowIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  rowMeta: { fontSize: 11, color: '#aaa', fontWeight: '500' },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F0EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEE8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F7F8FC' },
  modalHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  modalSaveBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 72,
    alignItems: 'center',
  },
  modalSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modalBody: { padding: 20 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1.5,
    borderColor: '#eee',
  },

  row2col: { flexDirection: 'row', gap: 12, marginBottom: 0 },

  optionsScroll: { marginTop: 2 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#eee',
  },
  optChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  optChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  optChipTextActive: { color: '#fff' },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#eee',
  },
});
