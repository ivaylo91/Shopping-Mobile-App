import { useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Text from '../components/Text';
import AnimatedPressable from '../components/AnimatedPressable';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { getCategoryEmoji } from './HomeScreen';

export default function TripSummaryScreen({ route, navigation }) {
  const {
    budget = 0,
    spent = 0,
    listName = 'Пазаруване',
    store = 'Всички',
    checkedItems = [],
    skippedItems = [],
  } = route.params ?? {};

  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();
  const saved = budget - spent;
  const overBudget = spent > budget;
  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  useEffect(() => {
    Haptics.notificationAsync(
      overBudget
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    );
  }, []);

  const dateStr = new Date().toLocaleDateString('bg-BG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const heroColor = overBudget ? colors.red : colors.primary;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <FadeInView delay={0}>
          <View style={[s.hero, { backgroundColor: heroColor }]}>
            <View style={s.heroTop}>
              <Ionicons
                name={overBudget ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={24}
                color="rgba(255,255,255,0.82)"
              />
              <Text style={s.heroStatus}>
                {overBudget ? 'НАД БЮДЖЕТА' : 'ПАЗАРУВАНЕТО ЗАВЪРШИ'}
              </Text>
            </View>
            <Text style={s.heroLabel}>{overBudget ? 'Надвишение' : 'Спестени'}</Text>
            <Text style={s.heroAmount}>{Math.abs(saved).toFixed(2)} лв</Text>
            <View style={s.progTrack}>
              <View style={[
                s.progFill,
                { width: `${Math.min((spent / Math.max(budget, 0.01)) * 100, 100)}%` },
              ]} />
            </View>
            <View style={s.heroFooter}>
              <Text style={s.heroFooterText}>Изхарчено {spent.toFixed(2)} лв</Text>
              <Text style={s.heroFooterText}>Бюджет {budget.toFixed(2)} лв</Text>
            </View>
          </View>
        </FadeInView>

        {/* Stats */}
        <FadeInView delay={70}>
          <View style={s.statsRow}>
            <View style={[s.statCell, { backgroundColor: colors.card }]}>
              <Text style={[s.statVal, { color: colors.text }]}>{checkedItems.length}</Text>
              <Text style={[s.statLbl, { color: colors.textTertiary }]}>Купени</Text>
            </View>
            <View style={[s.statCell, { backgroundColor: colors.card }]}>
              <Text style={[s.statVal, { color: colors.text }]}>{skippedItems.length}</Text>
              <Text style={[s.statLbl, { color: colors.textTertiary }]}>Пропуснати</Text>
            </View>
            <View style={[s.statCell, { backgroundColor: colors.card }]}>
              <Text style={[s.statVal, { color: colors.text }]}>
                {checkedItems.length + skippedItems.length}
              </Text>
              <Text style={[s.statLbl, { color: colors.textTertiary }]}>Общо</Text>
            </View>
          </View>
        </FadeInView>

        {/* Trip info */}
        <FadeInView delay={110}>
          <View style={[s.infoCard, { backgroundColor: colors.card }]}>
            <View style={s.infoRow}>
              <Ionicons name="storefront-outline" size={15} color={colors.textTertiary} />
              <Text style={[s.infoName, { color: colors.text }]} numberOfLines={1}>
                {store !== 'Всички' ? store : 'Без конкретен магазин'}
              </Text>
              <Text style={[s.infoDate, { color: colors.textQuaternary }]}>{dateStr}</Text>
            </View>
            <View style={[s.infoDivider, { backgroundColor: colors.borderLight }]} />
            <View style={s.infoRow}>
              <Ionicons name="list-outline" size={15} color={colors.textTertiary} />
              <Text style={[s.infoName, { color: colors.text }]} numberOfLines={1}>{listName}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Skipped items */}
        {skippedItems.length > 0 && (
          <FadeInView delay={150}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>ПРОПУСНАТИ ПРОДУКТИ</Text>
            <View style={[s.card, { backgroundColor: colors.card }]}>
              {skippedItems.map((item, i) => (
                <View
                  key={item.id}
                  style={[s.skippedRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                >
                  <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
                  <Text style={[s.skippedName, { color: colors.textTertiary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[s.skippedPrice, { color: colors.border }]}>
                    {item.subtotal.toFixed(2)} лв
                  </Text>
                </View>
              ))}
            </View>
            {skippedItems.length > 0 && (
              <TouchableOpacity
                style={s.addNextRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('MainTabs', {
                    screen: 'Home',
                    params: { preloadedItems: skippedItems, preloadedStore: store !== 'Всички' ? store : undefined },
                  });
                }}
                activeOpacity={0.75}
                accessibilityLabel="Добави пропуснатите в нов списък"
              >
                <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
                <Text style={[s.addNextText, { color: colors.primary }]}>
                  Добави пропуснатите в нов списък
                </Text>
              </TouchableOpacity>
            )}
          </FadeInView>
        )}

        {/* Actions */}
        <FadeInView delay={190} style={s.actions}>
          <AnimatedPressable
            style={[s.btnPrimary, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('MainTabs');
            }}
            accessibilityLabel="Нова сесия на пазаруване"
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.btnPrimaryText}>Нова сесия</Text>
          </AnimatedPressable>
          <TouchableOpacity
            style={[s.btnSecondary, { borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('MainTabs', { screen: 'SavedLists' });
            }}
            activeOpacity={0.75}
            accessibilityLabel="Виж историята на пазаруването"
          >
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[s.btnSecondaryText, { color: colors.textSecondary }]}>
              История на пазаруването
            </Text>
          </TouchableOpacity>
        </FadeInView>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark, isTablet) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: {
      padding: 20, paddingBottom: 44,
      maxWidth: isTablet ? 720 : undefined,
      alignSelf: isTablet ? 'center' : undefined,
      width: '100%',
    },
    hero: {
      borderRadius: 20, padding: 24, marginBottom: 14,
      shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    heroStatus: {
      fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.80)',
      letterSpacing: 0.6, textTransform: 'uppercase',
    },
    heroLabel: {
      fontSize: 12, color: 'rgba(255,255,255,0.62)',
      fontWeight: '600', marginBottom: 4, letterSpacing: 0.3,
    },
    heroAmount: {
      fontSize: 54, fontWeight: '800', color: '#fff',
      letterSpacing: -1.5, lineHeight: 62, marginBottom: 20,
    },
    progTrack: {
      height: 5, backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 3, overflow: 'hidden', marginBottom: 12,
    },
    progFill: { height: 5, backgroundColor: '#fff', borderRadius: 3 },
    heroFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    heroFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: '600' },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statCell: {
      flex: 1, borderRadius: 14, padding: 14, alignItems: 'center',
      shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.04, shadowRadius: 6, elevation: 1,
    },
    statVal: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 },
    statLbl: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 3 },

    infoCard: {
      borderRadius: 14, padding: 14, marginBottom: 14,
      shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.04, shadowRadius: 6, elevation: 1,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    infoName: { flex: 1, fontSize: 14, fontWeight: '600' },
    infoDate: { fontSize: 12, fontWeight: '500' },
    infoDivider: { height: 1, marginVertical: 8 },

    sectionLabel: {
      fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
      textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
    },
    card: {
      borderRadius: 14, paddingHorizontal: 4, marginBottom: 8,
      shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.04, shadowRadius: 6, elevation: 1,
    },
    skippedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
    skippedName: { flex: 1, fontSize: 14, fontWeight: '600', textDecorationLine: 'line-through' },
    skippedPrice: { fontSize: 13, fontWeight: '600' },

    addNextRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, marginBottom: 8 },
    addNextText: { fontSize: 13, fontWeight: '600' },

    actions: { gap: 10, marginTop: 8 },
    btnPrimary: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 16, paddingVertical: 17,
      shadowOpacity: 0.26, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    btnSecondary: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 16, paddingVertical: 15, borderWidth: 1,
    },
    btnSecondaryText: { fontWeight: '600', fontSize: 15 },
  });
}
