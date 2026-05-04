import { useState, useMemo, useEffect } from 'react';
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
import { getShadows } from '../theme';

const PRESETS = [50, 80, 100, 150, 200, 300];
const STEP = 10;

export default function BudgetSetupScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();

  const [listName, setListName] = useState('');
  const [budget, setBudget] = useState(100);
  const [store, setStore] = useState('Всички');

  useEffect(() => {
    if (route.params?.selectedStore) {
      setStore(route.params.selectedStore);
      navigation.setParams({ selectedStore: undefined });
    }
  }, [route.params?.selectedStore]);

  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);
  const dateStr = new Date().toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' });

  const adjust = (delta) => {
    Haptics.selectionAsync();
    setBudget((prev) => Math.max(STEP, prev + delta));
  };

  const handlePreset = (val) => {
    Haptics.selectionAsync();
    setBudget(val);
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('MainTabs', {
      screen: 'Home',
      params: {
        prefillBudget: budget.toString(),
        prefillStore: store,
        prefillListName: listName.trim() || undefined,
      },
    });
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
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Назад"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text }]}>Нова сесия</Text>
          <View style={{ width: 22 }} />
        </FadeInView>

        {/* Budget stepper */}
        <FadeInView delay={60}>
          <Text style={[s.sectionHint, { color: colors.textTertiary }]}>БЮДЖЕТ ЗА ПАЗАРУВАНЕ</Text>
          <View style={[s.stepperCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[s.stepBtn, { backgroundColor: colors.cardAlt }]}
              onPress={() => adjust(-STEP)}
              accessibilityLabel="Намали бюджета"
              accessibilityRole="button"
            >
              <Ionicons name="remove" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[s.budgetNum, { color: colors.text }]}>{budget} €</Text>
            <TouchableOpacity
              style={[s.stepBtn, { backgroundColor: colors.cardAlt }]}
              onPress={() => adjust(STEP)}
              accessibilityLabel="Увеличи бюджета"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.presets}
          >
            {PRESETS.map((val) => {
              const active = budget === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    s.presetPill,
                    { backgroundColor: active ? colors.primary : colors.cardAlt },
                  ]}
                  onPress={() => handlePreset(val)}
                  activeOpacity={0.75}
                  accessibilityLabel={`Бюджет ${val} евро`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.presetText, { color: active ? '#fff' : colors.textTertiary }]}>
                    {val} €
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeInView>

        {/* Trip details */}
        <FadeInView delay={120}>
          <Text style={[s.sectionHint, { color: colors.textTertiary }]}>ДЕТАЙЛИ</Text>

          {/* Name field */}
          <View style={[s.field, { backgroundColor: colors.card }]}>
            <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>Наименование</Text>
            <TextInput
              style={[s.fieldInput, { color: colors.text }]}
              placeholder="напр. Седмично пазаруване"
              placeholderTextColor={colors.textQuaternary}
              value={listName}
              onChangeText={setListName}
              returnKeyType="done"
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Наименование на пазаруването"
            />
          </View>

          {/* Store field */}
          <TouchableOpacity
            style={[s.field, s.fieldRow, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('StorePicker', { from: 'BudgetSetup' })}
            activeOpacity={0.75}
            accessibilityLabel={`Магазин: ${store}`}
            accessibilityRole="button"
          >
            <View style={s.storeLeft}>
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>Магазин</Text>
              <Text style={[s.storeValue, { color: colors.text }]} numberOfLines={1}>{store}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textQuaternary} />
          </TouchableOpacity>

          {/* Date field */}
          <View style={[s.field, s.fieldRow, { backgroundColor: colors.card }]}>
            <View style={s.storeLeft}>
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>Дата</Text>
              <Text style={[s.storeValue, { color: colors.text }]}>{dateStr}</Text>
            </View>
            <Ionicons name="calendar-outline" size={16} color={colors.textQuaternary} />
          </View>
        </FadeInView>

        {/* CTA */}
        <FadeInView delay={180} style={s.ctaWrap}>
          <AnimatedPressable
            style={[s.cta, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={handleStart}
            accessibilityLabel="Започни пазаруването"
          >
            <Text style={s.ctaText}>Започни пазаруването</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
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
      marginBottom: 24, marginTop: 4,
    },
    title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
    sectionHint: {
      fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
      textTransform: 'uppercase', marginBottom: 10,
    },

    stepperCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 18, padding: 16, marginBottom: 12, ...sh.sm,
    },
    stepBtn: {
      width: 48, height: 48, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
    },
    budgetNum: {
      fontSize: 48, fontWeight: '800', letterSpacing: -1.5, lineHeight: 56,
    },

    presets: { gap: 8, paddingRight: 4, marginBottom: 24 },
    presetPill: {
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    },
    presetText: { fontSize: 14, fontWeight: '700' },

    field: {
      borderRadius: 14, padding: 14, marginBottom: 10, ...sh.sm,
    },
    fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fieldLabel: {
      fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
      textTransform: 'uppercase', marginBottom: 4,
    },
    fieldInput: { fontSize: 16, fontWeight: '500', paddingVertical: 2 },
    storeLeft: { flex: 1 },
    storeValue: { fontSize: 16, fontWeight: '500' },

    ctaWrap: { marginTop: 16 },
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 16, paddingVertical: 18,
      shadowOpacity: 0.26, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  });
}
