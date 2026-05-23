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
import { CATEGORIES, getCategoryColors } from '../constants/categories';
import { uid } from '../utils/uid';
import { PRODUCT_CATALOG } from '../utils/productCatalog';

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

  // Popular products: top catalog items for the active category
  const popularProducts = useMemo(() => {
    const base = category === 'other'
      ? PRODUCT_CATALOG
      : PRODUCT_CATALOG.filter((p) => p.category === category);
    return base.slice(0, 8);
  }, [category]);

  const handleAdd = () => {
    const trimmed = name.trim();
    const priceRaw = price.toString().replace(',', '.');
    const p = parseFloat(priceRaw);
    if (!trimmed) { showToast('Въведете наименование', 'warning'); return; }
    if (isNaN(p) || p <= 0) { showToast('Въведете валидна цена', 'warning'); return; }

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

  const applyFromCatalog = (product) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(product.name);
    setPrice(String(product.price));
    if (product.category) setCategory(product.category);
  };

  const adjQty = (delta) => {
    Haptics.selectionAsync();
    setQuantity((q) => Math.max(1, q + delta));
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Header row */}
        <FadeInView delay={0} style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Назад"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.title}>Добави продукт</Text>
          <View style={{ width: 40 }} />
        </FadeInView>

        {/* CozyAdd pill search bar */}
        <FadeInView delay={40} style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            style={s.searchInput}
            placeholder="Търсете продукт или баркод…"
            placeholderTextColor={colors.textQuaternary}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
            keyboardAppearance={isDark ? 'dark' : 'light'}
            accessibilityLabel="Наименование на продукта"
          />
          {name.length > 0 && (
            <TouchableOpacity onPress={() => setName('')} accessibilityLabel="Изчисти">
              <Ionicons name="close-circle" size={16} color={colors.textQuaternary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('BarcodeScanner')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Сканирай баркод"
          >
            <Ionicons name="barcode-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </FadeInView>

        {/* Price + Quantity row */}
        <FadeInView delay={70} style={s.priceQtyRow}>
          <View style={s.priceCard}>
            <Text style={s.fieldLabel}>ЦЕНА (ЛВ.)</Text>
            <View style={s.priceInputRow}>
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

          <View style={s.qtyCard}>
            <Text style={s.fieldLabel}>КОЛИЧЕСТВО</Text>
            <View style={s.qtyRow}>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => adjQty(-1)}
                accessibilityLabel="Намали количеството"
              >
                <Ionicons name="remove" size={16} color={colors.primary} />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{quantity}</Text>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => adjQty(1)}
                accessibilityLabel="Увеличи количеството"
              >
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        {/* CozyAdd category grid */}
        <FadeInView delay={100}>
          <Text style={s.sectionLabel}>КАТЕГОРИИ</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map((cat) => {
              const catColors = getCategoryColors(cat.id, isDark);
              const active = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    s.catCell,
                    active
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.card },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setCategory(cat.id); }}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={cat.label}
                >
                  {/* Icon circle */}
                  <View style={[
                    s.catIconCircle,
                    { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.cardAlt },
                  ]}>
                    <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                  </View>
                  <Text style={[s.catLabel, { color: active ? '#fff' : colors.textTertiary }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeInView>

        {/* Popular products strip — CozyAdd "Популярни" */}
        {popularProducts.length > 0 && (
          <FadeInView delay={130}>
            <View style={s.popularHeader}>
              <Text style={s.sectionLabel}>
                {category === 'other' ? 'ПОПУЛЯРНИ' : `ПОПУЛЯРНИ · ${CATEGORIES.find(c => c.id === category)?.label?.toUpperCase()}`}
              </Text>
              <Text style={s.popularSeeAll}>Виж всички</Text>
            </View>
            <View style={s.popularList}>
              {popularProducts.map((p) => (
                <TouchableOpacity
                  key={`${p.name}-${p.store}`}
                  style={s.popularRow}
                  onPress={() => applyFromCatalog(p)}
                  activeOpacity={0.75}
                  accessibilityLabel={`Добави ${p.name} ${p.price.toFixed(2)} €`}
                >
                  <View style={[s.popularIcon, { backgroundColor: getCategoryColors(p.category, isDark).bg }]}>
                    <Text style={{ fontSize: 18 }}>{CATEGORIES.find(c => c.id === p.category)?.emoji ?? '📦'}</Text>
                  </View>
                  <View style={s.popularInfo}>
                    <Text style={s.popularName} numberOfLines={1}>{p.name}</Text>
                    <Text style={s.popularStore} numberOfLines={1}>{p.store}</Text>
                  </View>
                  <Text style={s.popularPrice}>от {p.price.toFixed(2)} €</Text>
                  <View style={s.popularAddBtn}>
                    <Ionicons name="add" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>
        )}

        {/* Total preview */}
        {price && parseFloat(price) > 0 && (
          <FadeInView delay={0}>
            <View style={s.totalPreview}>
              <Text style={s.totalLabel}>Общо</Text>
              <Text style={s.totalValue}>
                {(parseFloat(price.replace(',', '.')) * quantity).toFixed(2)} €
              </Text>
            </View>
          </FadeInView>
        )}

        {/* CTA — pill button */}
        <FadeInView delay={160} style={s.ctaWrap}>
          <AnimatedPressable
            style={s.cta}
            onPress={handleAdd}
            accessibilityLabel="Добави продукта в списъка"
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={s.ctaText}>Добави в списъка</Text>
          </AnimatedPressable>
        </FadeInView>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark, isTablet) {
  const sh = getShadows(isDark);
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: {
      padding: 20, paddingBottom: 44,
      maxWidth: isTablet ? 720 : undefined,
      alignSelf: isTablet ? 'center' : undefined,
      width: '100%',
    },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 18, marginTop: 4,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.card, justifyContent: 'center', alignItems: 'center',
      ...sh.sm,
    },
    title: { fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.2 },

    // CozyAdd pill search bar
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: c.card, borderRadius: 999,
      paddingHorizontal: 18, paddingVertical: 14,
      marginBottom: 14, ...sh.sm,
    },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '500', color: c.text, paddingVertical: 0 },

    priceQtyRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
    priceCard: { flex: 1.5, backgroundColor: c.card, borderRadius: 16, padding: 14, ...sh.sm },
    qtyCard: { flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 14, ...sh.sm },
    fieldLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 0.7,
      textTransform: 'uppercase', color: c.textTertiary, marginBottom: 8,
    },
    priceInputRow: { flexDirection: 'row', alignItems: 'center' },
    priceInput: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, flex: 1, paddingVertical: 0 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.cardAlt, justifyContent: 'center', alignItems: 'center' },
    qtyNum: { flex: 1, fontSize: 22, fontWeight: '700', color: c.text, textAlign: 'center' },

    sectionLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 0.8,
      textTransform: 'uppercase', color: c.textTertiary, marginBottom: 10,
    },

    // CozyAdd 3-column category grid with icon circles
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    catCell: {
      width: '30%', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 10,
      alignItems: 'center', gap: 8, ...sh.sm,
    },
    catIconCircle: {
      width: 40, height: 40, borderRadius: 20,
      justifyContent: 'center', alignItems: 'center',
    },
    catLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

    popularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    popularSeeAll: { fontSize: 12, fontWeight: '600', color: c.primary },

    popularList: { backgroundColor: c.card, borderRadius: 16, overflow: 'hidden', marginBottom: 20, ...sh.sm },
    popularRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 12, borderBottomWidth: 1, borderBottomColor: c.borderLight,
    },
    popularIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    popularInfo: { flex: 1 },
    popularName: { fontSize: 14, fontWeight: '600', color: c.text },
    popularStore: { fontSize: 11, color: c.textTertiary, marginTop: 2 },
    popularPrice: { fontSize: 13, fontWeight: '700', color: c.primary },
    popularAddBtn: {
      width: 32, height: 32, borderRadius: 10,
      backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center',
    },

    totalPreview: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: c.primaryLight, borderRadius: 14, padding: 14, marginBottom: 14,
    },
    totalLabel: { fontSize: 14, fontWeight: '700', color: c.primary },
    totalValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, color: c.primary },

    ctaWrap: {},
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.primary, height: 52, borderRadius: 999,
      shadowColor: c.primary, shadowOpacity: 0.26, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}
