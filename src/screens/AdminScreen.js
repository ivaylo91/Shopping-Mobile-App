import { useState, useCallback, memo, useMemo } from 'react';
import {
  View,
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
import { FlashList } from '@shopify/flash-list';
import Text from '../components/Text';
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
import { useTheme } from '../context/ThemeContext';
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

const ProductRow = memo(function ProductRow({ item, onEdit, onDelete, s, colors }) {
  return (
    <View style={s.row}>
      <Text style={s.rowIcon}>{getCategoryIcon(item.category)}</Text>
      <View style={s.rowInfo}>
        <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.rowMeta}>
          {item.price?.toFixed(2)} € · {item.store} · {item.unit}
        </Text>
      </View>
      <TouchableOpacity
        style={s.editBtn}
        onPress={() => onEdit(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={`Редактирай ${item.name}`}
        accessibilityRole="button"
      >
        <Ionicons name="pencil-outline" size={17} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={s.deleteBtn}
        onPress={() => onDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={`Изтрий ${item.name}`}
        accessibilityRole="button"
      >
        <Ionicons name="trash-outline" size={17} color={colors.red} />
      </TouchableOpacity>
    </View>
  );
});

// ─── Picker row ───────────────────────────────────────────────────────────────

function PickerRow({ label, options, value, onChange, s }) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.optionsScroll}>
        <View style={s.optionsRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.optChip, value === opt && s.optChipActive]}
              onPress={() => onChange(opt)}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === opt }}
              accessibilityLabel={opt}
            >
              <Text style={[s.optChipText, value === opt && s.optChipTextActive]}>
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

function ProductModal({ visible, initial, onClose, onSave, saving, colors, isDark }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const ms = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

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
        <View style={ms.modalContainer}>
          <View style={ms.modalHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={ms.modalCloseBtn}
              accessibilityLabel="Затвори"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={ms.modalTitle}>
              {initial ? 'Редактирай продукт' : 'Нов продукт'}
            </Text>
            <TouchableOpacity
              style={[ms.modalSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              accessibilityLabel="Запази продукт"
              accessibilityRole="button"
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={ms.modalSaveBtnText}>Запази</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView
            style={ms.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={ms.fieldGroup}>
              <Text style={ms.fieldLabel}>Наименование *</Text>
              <TextInput
                style={ms.textInput}
                value={form.name}
                onChangeText={(v) => set('name', v)}
                placeholder="Пример: Пилешко филе 500г"
                placeholderTextColor={colors.textQuaternary}
                accessibilityLabel="Наименование на продукта"
              />
            </View>

            <View style={ms.row2col}>
              <View style={[ms.fieldGroup, { flex: 1 }]}>
                <Text style={ms.fieldLabel}>Цена (€) *</Text>
                <TextInput
                  style={ms.textInput}
                  value={form.price}
                  onChangeText={(v) => set('price', v)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textQuaternary}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Цена"
                />
              </View>
              <View style={[ms.fieldGroup, { flex: 1 }]}>
                <Text style={ms.fieldLabel}>Единица</Text>
                <TextInput
                  style={ms.textInput}
                  value={form.unit}
                  onChangeText={(v) => set('unit', v)}
                  placeholder="бр."
                  placeholderTextColor={colors.textQuaternary}
                  accessibilityLabel="Мерна единица"
                />
              </View>
            </View>

            <View style={ms.optionsRow}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[ms.optChip, form.unit === u && ms.optChipActive]}
                  onPress={() => set('unit', u)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: form.unit === u }}
                  accessibilityLabel={u}
                >
                  <Text style={[ms.optChipText, form.unit === u && ms.optChipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <PickerRow label="Магазин" options={STORES} value={form.store} onChange={(v) => set('store', v)} s={ms} />
            <PickerRow label="Категория" options={CATEGORIES} value={form.category} onChange={(v) => set('category', v)} s={ms} />

            <View style={ms.row2col}>
              <View style={[ms.fieldGroup, { flex: 1 }]}>
                <Text style={ms.fieldLabel}>Протеин (г/100г)</Text>
                <TextInput
                  style={ms.textInput}
                  value={String(form.protein)}
                  onChangeText={(v) => set('protein', v)}
                  placeholder="0"
                  placeholderTextColor={colors.textQuaternary}
                  keyboardType="number-pad"
                  accessibilityLabel="Протеин"
                />
              </View>
              <View style={[ms.fieldGroup, { flex: 1 }]}>
                <Text style={ms.fieldLabel}>Калории (kcal)</Text>
                <TextInput
                  style={ms.textInput}
                  value={String(form.calories)}
                  onChangeText={(v) => set('calories', v)}
                  placeholder="0"
                  placeholderTextColor={colors.textQuaternary}
                  keyboardType="number-pad"
                  accessibilityLabel="Калории"
                />
              </View>
            </View>

            <View style={ms.switchRow}>
              <Text style={ms.fieldLabel}>Здравословен</Text>
              <Switch
                value={form.isHealthy}
                onValueChange={(v) => set('isHealthy', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
                accessibilityLabel="Здравословен продукт"
                accessibilityRole="switch"
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
  const { colors, isDark } = useTheme();

  const s = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
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
              const CHUNK = 499;
              for (let i = 0; i < KAUFLAND_PRODUCTS.length; i += CHUNK) {
                const batch = writeBatch(db);
                for (const p of KAUFLAND_PRODUCTS.slice(i, i + CHUNK)) {
                  batch.set(doc(col), { ...p, store: 'Kaufland', createdAt: now });
                }
                await batch.commit();
              }
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
        const { id, ...data } = formData;
        await updateDoc(doc(db, 'products', editTarget.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showToast('Продуктът е обновен', 'success');
      } else {
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
    <ProductRow item={item} onEdit={openEdit} onDelete={handleDelete} s={s} colors={colors} />
  ), [openEdit, handleDelete, s, colors]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Администрация</Text>
          <Text style={s.headerSub}>
            {loading ? 'Зарежда се…' : `${products.length} продукта`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[s.addBtn, s.importBtn]}
            onPress={handleImportKaufland}
            activeOpacity={0.85}
            disabled={importing}
            accessibilityLabel="Импортирай Kaufland продукти"
            accessibilityRole="button"
          >
            {importing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="cloud-download-outline" size={20} color="#fff" />}
            <Text style={s.addBtnText}>Kaufland</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.addBtn}
            onPress={openAdd}
            activeOpacity={0.85}
            accessibilityLabel="Добави нов продукт"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={s.addBtnText}>Добави</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={17} color={colors.textTertiary} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Търси по име, категория, магазин…"
          placeholderTextColor={colors.textQuaternary}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          accessibilityLabel="Търсене на продукти"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            accessibilityLabel="Изчисти търсенето"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {!loading && (
        <View style={s.statsRow}>
          <Text style={s.statsText}>
            {filtered.length === products.length
              ? `Всички ${products.length} продукта`
              : `${filtered.length} от ${products.length}`}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          estimatedItemSize={60}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.centered}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={s.emptyText}>Няма намерени продукти</Text>
            </View>
          }
        />
      )}

      <ProductModal
        visible={modalVisible}
        initial={editTarget}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        saving={saving}
        colors={colors}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

function makeStyles(c, isDark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
    emptyText: { fontSize: 15, color: c.textTertiary, fontWeight: '600' },

    header: {
      backgroundColor: c.card,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: c.text },
    headerSub: { fontSize: 13, color: c.textTertiary, marginTop: 2 },
    addBtn: {
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      shadowColor: c.primary,
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
    importBtn: { backgroundColor: c.orange },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 4,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 6,
      elevation: 1,
    },
    searchInput: { flex: 1, fontSize: 14, color: c.text },

    statsRow: { paddingHorizontal: 20, paddingVertical: 8 },
    statsText: { fontSize: 12, color: c.textTertiary, fontWeight: '600' },

    list: { paddingHorizontal: 16, paddingBottom: 32 },

    row: {
      backgroundColor: c.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 5,
      elevation: 1,
    },
    rowIcon: { fontSize: 22, width: 30, textAlign: 'center' },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 2 },
    rowMeta: { fontSize: 12, color: c.textTertiary, fontWeight: '500' },
    editBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.redLight,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Modal
    modalContainer: { flex: 1, backgroundColor: c.bg },
    modalHeader: {
      backgroundColor: c.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.cardAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: { fontSize: 16, fontWeight: '800', color: c.text },
    modalSaveBtn: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingHorizontal: 18,
      paddingVertical: 9,
      minWidth: 72,
      alignItems: 'center',
    },
    modalSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    modalBody: { padding: 20 },

    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: c.textTertiary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    textInput: {
      backgroundColor: c.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: c.text,
      borderWidth: 1.5,
      borderColor: c.border,
    },

    row2col: { flexDirection: 'row', gap: 12, marginBottom: 0 },

    optionsScroll: { marginTop: 2 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    optChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    optChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    optChipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    optChipTextActive: { color: '#fff' },

    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: c.border,
    },
  });
}
