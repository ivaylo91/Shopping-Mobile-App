import { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Text from '../components/Text';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../hooks/useLayout';
import { useCustomStores } from '../hooks/useCustomStores';
import { useFavoriteStores } from '../hooks/useFavoriteStores';
import { getShadows } from '../theme';

const STAR_COLOR = '#FFD700';

export default function StorePickerScreen({ route, navigation }) {
  const { from = 'Home' } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const { isTablet } = useLayout();
  const { stores, customs, addStore, removeStore } = useCustomStores();
  const { isFavorite, toggleFavorite, sortStores } = useFavoriteStores();

  const [search, setSearch] = useState('');
  const [newStoreName, setNewStoreName] = useState('');

  const [nearbyStores, setNearbyStores] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [hasPermission, setHasPermission] = useState(true);

  const fetchNearby = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setHasPermission(false);
        setLocationError('Permission denied');
        return;
      }
      setHasPermission(true);
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lon } = loc.coords;

      // Use Overpass API to find supermarkets nearby (radius 2km)
      const query = `[out:json];node["shop"~"supermarket|convenience|grocery"](around:2000,${lat},${lon});out;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();

      const uniqueNames = new Set();
      const shops = data.elements
        .map(e => e.tags.name)
        .filter(name => {
          if (!name || uniqueNames.has(name)) return false;
          uniqueNames.add(name);
          return true;
        })
        .slice(0, 5);

      setNearbyStores(shops);
    } catch (err) {
      console.error(err);
      setLocationError('Error fetching');
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, []);

  const s = useMemo(() => makeStyles(colors, isDark, isTablet), [colors, isDark, isTablet]);

  const sortedStores = useMemo(() => sortStores(stores), [stores, sortStores]);
  const filtered = useMemo(() => {
    if (!search.trim()) return sortedStores;
    const q = search.toLowerCase();
    return sortedStores.filter((st) => st.toLowerCase().includes(q));
  }, [sortedStores, search]);

  const handleSelect = (storeName) => {
    Haptics.selectionAsync();
    if (from === 'BudgetSetup') {
      navigation.navigate('BudgetSetup', { selectedStore: storeName });
    } else {
      navigation.navigate('MainTabs', {
        screen: 'Home',
        params: { selectedStore: storeName },
      });
    }
  };

  const handleAddStore = async () => {
    const trimmed = newStoreName.trim();
    if (!trimmed) return;
    const ok = await addStore(trimmed);
    if (ok) {
      setNewStoreName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>

      {/* Header — CozyStoreSelect */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Назад"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.title, { color: colors.text }]}>От къде ще пазарувате?</Text>
          <Text style={[s.subtitle, { color: colors.textTertiary }]}>Изберете една или повече вериги</Text>
        </View>
      </View>

      {/* Search — pill */}
      <View style={s.searchWrap}>
        <View style={[s.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search-outline" size={16} color={colors.textQuaternary} />
          <TextInput
            style={[s.searchInput, { color: colors.text }]}
            placeholder="Търси магазин..."
            placeholderTextColor={colors.textQuaternary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            keyboardAppearance={isDark ? 'dark' : 'light'}
            accessibilityLabel="Търси магазин"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Изчисти">
              <Ionicons name="close-circle" size={16} color={colors.textQuaternary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Nearby Stores */}
        <FadeInView delay={0}>
          <View style={s.sectionHeader}>
            <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
            <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>БЛИЗКИ МАГАЗИНИ</Text>
            {locationLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />}
          </View>
          <View style={[s.nearbyWrap, { backgroundColor: colors.card }]}>
            {locationLoading && nearbyStores.length === 0 ? (
              <View style={s.nearbyPlaceholder}>
                <Text style={{ color: colors.textQuaternary, fontSize: 13 }}>Търсене на обекти...</Text>
              </View>
            ) : locationError ? (
              <TouchableOpacity style={s.nearbyPlaceholder} onPress={fetchNearby}>
                <Ionicons name="refresh-outline" size={16} color={colors.textQuaternary} style={{ marginBottom: 4 }} />
                <Text style={{ color: colors.textQuaternary, fontSize: 13 }}>
                  {!hasPermission ? 'Разрешете достъп до локация в настройките' : 'Неуспешно зареждане. Опитайте пак.'}
                </Text>
              </TouchableOpacity>
            ) : nearbyStores.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.nearbyScroll}>
                {nearbyStores.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[s.nearbyChip, { backgroundColor: colors.cardAlt }]}
                    onPress={() => handleSelect(st)}
                  >
                    <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                    <Text style={[s.nearbyChipText, { color: colors.text }]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={s.nearbyPlaceholder}>
                <Text style={{ color: colors.textQuaternary, fontSize: 13 }}>Няма открити магазини наблизо</Text>
              </View>
            )}
          </View>
        </FadeInView>

        {/* Add custom store */}
        <FadeInView delay={60}>
          <View style={s.sectionHeader}>
            <Ionicons name="add-circle-outline" size={14} color={colors.textTertiary} />
            <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>НОВ МАГАЗИН</Text>
          </View>
          <View style={[s.addCard, { backgroundColor: colors.card }]}>
            <TextInput
              style={[s.addInput, { color: colors.text, backgroundColor: colors.cardAlt }]}
              placeholder="Добави нов магазин..."
              placeholderTextColor={colors.textQuaternary}
              value={newStoreName}
              onChangeText={setNewStoreName}
              returnKeyType="done"
              onSubmitEditing={handleAddStore}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Нов магазин"
            />
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddStore}
              accessibilityLabel="Добави магазин"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Store list — CozyStoreSelect card layout */}
        <FadeInView delay={120}>
          <View style={s.sectionHeader}>
            <Ionicons name="list-outline" size={14} color={colors.textTertiary} />
            <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>ВСИЧКИ МАГАЗИНИ</Text>
          </View>
          <View style={s.storeCardList}>
            {filtered.map((st) => {
              const fav = isFavorite(st);
              const isCustom = customs.includes(st);
              // Generate a stable color from store name
              const hue = (st.charCodeAt(0) * 47 + st.charCodeAt(st.length - 1) * 13) % 360;
              const logoColor = `hsl(${hue}, 45%, 42%)`;
              const initial = st.charAt(0).toUpperCase();
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    s.storeCard,
                    { backgroundColor: colors.card },
                    fav && { borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                  onPress={() => handleSelect(st)}
                  activeOpacity={0.75}
                  accessibilityLabel={`Избери ${st}`}
                  accessibilityRole="button"
                >
                  {/* CozyStoreSelect logo square */}
                  <View style={[s.storeLogo, { backgroundColor: logoColor }]}>
                    <Text style={s.storeLogoText}>{initial}</Text>
                  </View>

                  <View style={s.storeCardBody}>
                    <Text style={[s.storeCardName, { color: colors.text }]} numberOfLines={1}>{st}</Text>
                    <Text style={[s.storeCardTag, { color: colors.textTertiary }]}>
                      {fav ? '★ Любим магазин' : isCustom ? 'Персонализиран' : 'Верига'}
                    </Text>
                  </View>

                  {/* Actions */}
                  <TouchableOpacity
                    onPress={() => { toggleFavorite(st); Haptics.selectionAsync(); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={fav ? `Премахни ${st} от любими` : `Добави ${st} в любими`}
                  >
                    <Ionicons
                      name={fav ? 'star' : 'star-outline'}
                      size={17}
                      color={fav ? STAR_COLOR : colors.border}
                    />
                  </TouchableOpacity>

                  {isCustom && (
                    <TouchableOpacity
                      onPress={() => { removeStore(st); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Изтрий ${st}`}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.red} />
                    </TouchableOpacity>
                  )}

                  {/* CozyStoreSelect check circle */}
                  <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </TouchableOpacity>
              );
            })}

            {filtered.length === 0 && (
              <View style={s.emptyRow}>
                <Text style={[s.emptyText, { color: colors.textQuaternary }]}>
                  Няма намерени магазини
                </Text>
              </View>
            )}
          </View>
        </FadeInView>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c, isDark, isTablet) {
  const sh = getShadows(isDark);
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.card, justifyContent: 'center', alignItems: 'center',
      ...sh.sm,
    },
    title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
    searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12,
      ...sh.sm,
    },
    searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

    nearbyWrap: { borderRadius: 16, overflow: 'hidden', ...sh.sm, marginBottom: 4 },
    nearbyScroll: { padding: 12, gap: 10 },
    nearbyChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, ...sh.sm },
    nearbyChipText: { fontSize: 14, fontWeight: '600' },
    nearbyPlaceholder: { padding: 20, alignItems: 'center', justifyContent: 'center' },

    content: {
      padding: 16, paddingBottom: 44,
      maxWidth: isTablet ? 720 : undefined,
      alignSelf: isTablet ? 'center' : undefined,
      width: '100%',
    },

    addCard: {
      flexDirection: 'row', gap: 10, borderRadius: 14,
      padding: 12, marginBottom: 14, ...sh.sm,
    },
    addInput: {
      flex: 1, borderRadius: 10, paddingHorizontal: 12,
      paddingVertical: 11, fontSize: 15,
    },
    addBtn: {
      width: 44, height: 44, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
    },

    // CozyStoreSelect card list
    storeCardList: { gap: 10, marginBottom: 14 },
    storeCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 18, padding: 16,
      borderWidth: 1.5, borderColor: 'transparent',
      ...sh.sm,
    },
    storeLogo: {
      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
      justifyContent: 'center', alignItems: 'center',
    },
    storeLogoText: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
    storeCardBody: { flex: 1 },
    storeCardName: { fontSize: 16, fontWeight: '600' },
    storeCardTag: { fontSize: 12, marginTop: 2, fontWeight: '500' },

    emptyRow: { padding: 20, alignItems: 'center' },
    emptyText: { fontSize: 14, fontWeight: '500' },
  });
}
