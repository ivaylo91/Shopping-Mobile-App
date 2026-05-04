import { useState, useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import AnimatedPressable from '../components/AnimatedPressable';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { useToast } from '../context/ToastContext';
import { getShadows } from '../theme';
import { CATEGORIES, getCategoryColors } from './HomeScreen';
import { uid } from '../utils/uid';

export default function AddItemScreen({ route, navigation }) {
  const { from = 'Home' } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();
  const { show: showToast } = useToast();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('other');

  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  const handleAdd = () => {
    const trimmed = name.trim();
    const p = parseFloat(price);
    if (!trimmed) { showToast('Въведете наименование', 'warning'); return; }
    if (!p || p <= 0) { showToast('Въведете валидна цена', 'warning'); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const item = {
      id: uid(),
      name: trimmed,
      price: p,
      quantity,
      subtotal: p * quantity,
      category,
      note: '',
    };

    navigation.navigate('MainTabs', {
      screen: 'Home',
      params: { addedItem: item },
    });
  };

  const adjQty = (delta) => {
    Haptics.selectionAsync();
    setQuantity((q) => Math.max(1, q + delta));
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <FadeInView delay={0} style={s.header}>
          <TouchableOpacity
            style={[s.closeBtn, { backgroundColor: colors.cardAlt }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Затвори"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text }]}>Добавяне на продукт</Text>
          <View style={{ width: 36 }} />
        </FadeInView>

        {/* Name */}
        <FadeInView delay={60}>
          <View style={[s.nameField, { backgroundColor: colors.card }]}>
            <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>НАИМЕНОВАНИЕ</Text>
            <TextInput
              style={[s.nameInput, { color: colors.text }]}
              placeholder="напр. Прясно мляко"
              placeholderTextColor={colors.textQuaternary}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Наименование на продукта"
            />
          </View>
        </FadeInView>

        {/* Price + Quantity */}
        <FadeInView delay={100}>
          <View style={s.priceQtyRow}>
            <View style={[s.priceCard, { backgroundColor: colors.card }]}>
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>ЦЕНА</Text>
              <View style={s.priceInputRow}>
                <Text style={[s.priceSym, { color: colors.textTertiary }]}>€</Text>
                <TextInput
                  style={[s.priceInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textQuaternary}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  accessibilityLabel="Цена на продукта"
                />
              </View>
            </View>

            <View style={[s.qtyCard, { backgroundColor: colors.card }]}>
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>КОЛИЧЕСТВО</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity
                  style={[s.qtyBtn, { backgroundColor: colors.cardAlt }]}
                  onPress={() => adjQty(-1)}
                  accessibilityLabel="Намали количеството"
                  accessibilityRole="button"
                >
                  <Ionicons name="remove" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[s.qtyNum, { color: colors.text }]}>{quantity}</Text>
                <TouchableOpacity
                  style={[s.qtyBtn, { backgroundColor: colors.cardAlt }]}
                  onPress={() => adjQty(1)}
                  accessibilityLabel="Увеличи количеството"
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Category */}
        <FadeInView delay={140}>
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>КАТЕГОРИЯ</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map((cat) => {
              const catColors = getCategoryColors(cat.id, isDark);
              const active = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    s.catChip,
                    { backgroundColor: active ? catColors.bg : colors.card },
                    active && { borderColor: catColors.text, borderWidth: 1 },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setCategory(cat.id); }}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={cat.label}
                >
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                  <Text style={[s.catLabel, { color: active ? catColors.text : colors.textTertiary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeInView>

        {/* Total preview */}
        {price && parseFloat(price) > 0 && (
          <FadeInView delay={0}>
            <View style={[s.totalPreview, { backgroundColor: colors.primaryLight }]}>
              <Text style={[s.totalLabel, { color: colors.primary }]}>Общо</Text>
              <Text style={[s.totalValue, { color: colors.primary }]}>
                {(parseFloat(price) * quantity).toFixed(2)} €
              </Text>
            </View>
          </FadeInView>
        )}

        {/* CTA */}
        <FadeInView delay={180} style={s.ctaWrap}>
          <AnimatedPressable
            style={[s.cta, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={handleAdd}
            accessibilityLabel="Добави продукта в списъка"
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={s.ctaText}>Добави в списъка</Text>
          </AnimatedPressable>
          <TouchableOpacity
            style={s.scanRow}
            onPress={() => navigation.navigate('BarcodeScanner')}
            activeOpacity={0.75}
            accessibilityLabel="Сканирай баркод"
            accessibilityRole="button"
          >
            <Ionicons name="barcode-outline" size={16} color={colors.primary} />
            <Text style={[s.scanText, { color: colors.primary }]}>Сканирай баркод</Text>
          </TouchableOpacity>
        </FadeInView>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark, isTablet) {
  const sh = getShadows(isDark);
  return StyleSheet.create({
    safe: { flex: 1 },
    content: {
      padding: 20, paddingBottom: 44,
      maxWidth: isTablet ? 720 : undefined,
      alignSelf: isTablet ? 'center' : undefined,
      width: '100%',
    },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 22, marginTop: 4,
    },
    closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 6 },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },

    nameField: { borderRadius: 14, padding: 14, marginBottom: 12, ...sh.sm },
    nameInput: { fontSize: 20, fontWeight: '600', paddingVertical: 2 },

    priceQtyRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    priceCard: { flex: 1.4, borderRadius: 14, padding: 14, ...sh.sm },
    priceInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    priceSym: { fontSize: 18, fontWeight: '400', paddingBottom: 2 },
    priceInput: { flex: 1, fontSize: 28, fontWeight: '700', letterSpacing: -0.5, paddingVertical: 0 },

    qtyCard: { flex: 1, borderRadius: 14, padding: 14, ...sh.sm },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    qtyBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    qtyNum: { flex: 1, fontSize: 22, fontWeight: '700', textAlign: 'center' },

    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    catChip: {
      width: '30%', borderRadius: 12, padding: 10,
      alignItems: 'center', gap: 5, ...sh.sm,
    },
    catLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

    totalPreview: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderRadius: 12, padding: 14, marginBottom: 14,
    },
    totalLabel: { fontSize: 14, fontWeight: '700' },
    totalValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },

    ctaWrap: { gap: 12 },
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 16, paddingVertical: 17,
      shadowOpacity: 0.26, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    scanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
    scanText: { fontSize: 14, fontWeight: '600' },
  });
}
