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

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Назад"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>Избор на магазин</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[s.searchBar, { backgroundColor: colors.cardAlt }]}>
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

        {/* Store list */}
        <FadeInView delay={120}>
          <View style={s.sectionHeader}>
            <Ionicons name="list-outline" size={14} color={colors.textTertiary} />
            <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>ВСИЧКИ МАГАЗИНИ</Text>
          </View>
          <View style={[s.listCard, { backgroundColor: colors.card }]}>
            {filtered.map((st, i) => {
              const fav = isFavorite(st);
              const isCustom = customs.includes(st);
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    s.storeRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight },
                  ]}
                  onPress={() => handleSelect(st)}
                  activeOpacity={0.75}
                  accessibilityLabel={`Избери ${st}`}
                  accessibilityRole="button"
                >
                  {/* Star */}
                  <TouchableOpacity
                    onPress={() => { toggleFavorite(st); Haptics.selectionAsync(); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={fav ? `Премахни ${st} от любими` : `Добави ${st} в любими`}
                  >
                    <Ionicons
                      name={fav ? 'star' : 'star-outline'}
                      size={18}
                      color={fav ? STAR_COLOR : colors.border}
                    />
                  </TouchableOpacity>

                  {/* Store icon */}
                  <View style={[s.storeIcon, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="storefront-outline" size={15} color={colors.primary} />
                  </View>

                  <Text style={[s.storeName, { color: colors.text }]} numberOfLines={1}>{st}</Text>

                  {/* Delete custom */}
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
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 18, paddingVertical: 14,
      borderBottomWidth: 1,
    },
    title: { fontSize: 18, fontWeight: '700' },
    searchWrap: {
      paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1,
    },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
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

    listCard: { borderRadius: 14, overflow: 'hidden', ...sh.sm },
    storeRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 14,
    },
    storeIcon: {
      width: 30, height: 30, borderRadius: 8,
      justifyContent: 'center', alignItems: 'center',
    },
    storeName: { flex: 1, fontSize: 15, fontWeight: '600' },

    emptyRow: { padding: 20, alignItems: 'center' },
    emptyText: { fontSize: 14, fontWeight: '500' },
  });
}
