import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getCategoryEmoji } from './HomeScreen';
import AnimatedPressable from '../components/AnimatedPressable';

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Item row ─────────────────────────────────────────────────────────────────

const SharedItem = memo(function SharedItem({ item, checked, onToggle, colors }) {
  return (
    <TouchableOpacity
      style={[
        { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 1 },
        checked && { opacity: 0.45 },
      ]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.75}
    >
      <View>
        {checked
          ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          : <Ionicons name="ellipse-outline" size={24} color={colors.border} />}
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 1 }, checked && { textDecorationLine: 'line-through', color: colors.textQuaternary }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.note ? <Text style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 2 }}>📝 {item.note}</Text> : null}
        <Text style={{ fontSize: 12, color: colors.textTertiary }}>{item.price?.toFixed(2)} € × {item.quantity}</Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: checked ? colors.textQuaternary : colors.primary }}>
        {item.subtotal?.toFixed(2)} €
      </Text>
    </TouchableOpacity>
  );
});

// ─── Join Screen ──────────────────────────────────────────────────────────────

export function JoinSharedListScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useToast();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const handleJoin = async () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) { showToast('Въведете 6-символен код', 'warning'); return; }
    setLoading(true);
    try {
      const ref = doc(db, 'sharedLists', c);
      const snap = await getDoc(ref);
      if (!snap.exists()) { showToast('Невалиден код', 'error'); return; }
      const data = snap.data();
      if (data.expiresAt?.toMillis() < Date.now()) { showToast('Споделеният списък е изтекъл', 'error'); return; }
      const participants = [...new Set([...(data.participants || []), user.uid])];
      await updateDoc(ref, { participants });
      navigation.replace('SharedList', { code: c, isOwner: false });
    } catch (err) {
      showToast(err?.message || 'Грешка при свързване', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, alignSelf: 'flex-start' }}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="people-outline" size={40} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' }}>Присъедини се към списък</Text>
        <Text style={{ fontSize: 14, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 }}>Въведете 6-символния код, получен от споделящия</Text>
        <TextInput
          style={{
            fontSize: 32, fontWeight: '800', color: colors.text, textAlign: 'center',
            letterSpacing: 8, backgroundColor: colors.card, borderRadius: 16, padding: 16,
            width: '100%', borderWidth: 2, borderColor: colors.border,
            shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
          }}
          placeholder="XXXXXX"
          placeholderTextColor={colors.textQuaternary}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={handleJoin}
          keyboardAppearance={isDark ? 'dark' : 'light'}
        />
        <AnimatedPressable
          style={[
            { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, width: '100%', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
            (loading || code.length < 6) && { opacity: 0.45, shadowOpacity: 0 },
          ]}
          onPress={handleJoin}
          disabled={loading || code.length < 6}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="enter-outline" size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Присъедини се</Text></>}
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Shared List Screen ───────────────────────────────────────────────────────

export default function SharedListScreen({ route, navigation }) {
  const { code, isOwner, list, budget, listName, store } = route.params;
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const { colors } = useTheme();

  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOwner && list) createSharedList();
  }, []);

  const createSharedList = async () => {
    setCreating(true);
    try {
      const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await setDoc(doc(db, 'sharedLists', code), {
        code,
        ownerId: user.uid,
        listName: listName || 'Споделен списък',
        store: store || 'Всички',
        budget: budget || 0,
        items: list,
        checked: {},
        participants: [user.uid],
        createdAt: serverTimestamp(),
        expiresAt: expires,
      });
    } catch {
      showToast('Грешка при създаване', 'error');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const ref = doc(db, 'sharedLists', code);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setSharedData(snap.data());
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [code]);

  const toggleCheck = useCallback(async (itemId) => {
    if (!sharedData) return;
    Haptics.selectionAsync();
    const prev = sharedData.checked?.[itemId] || false;
    try {
      await updateDoc(doc(db, 'sharedLists', code), { [`checked.${itemId}`]: !prev });
    } catch {
      showToast('Грешка при обновяване', 'error');
    }
  }, [sharedData, code, showToast]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: `🛒 Присъедини се към моя списък за пазаруване!\n\nКод: ${code}\n\nОтвори приложението и въведи кода.` });
    } catch {}
  };

  const { spent, remaining, checkedCount, progress, items, checked } = useMemo(() => {
    if (!sharedData) return { spent: 0, remaining: 0, checkedCount: 0, progress: 0, items: [], checked: {} };
    const ch = sharedData.checked || {};
    const it = sharedData.items || [];
    const sp = it.reduce((s, i) => (ch[i.id] ? s + i.subtotal : s), 0);
    const cnt = Object.values(ch).filter(Boolean).length;
    return { spent: sp, remaining: (sharedData.budget || 0) - sp, checkedCount: cnt, progress: it.length > 0 ? cnt / it.length : 0, items: it, checked: ch };
  }, [sharedData]);

  const renderItem = useCallback(
    ({ item }) => <SharedItem item={item} checked={!!checked[item.id]} onToggle={toggleCheck} colors={colors} />,
    [checked, toggleCheck, colors]
  );

  if (loading || creating) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 12 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontSize: 14, color: colors.textTertiary, fontWeight: '600' }}>
          {creating ? 'Създаване на споделен списък...' : 'Зареждане...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (!sharedData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 12 }}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.border} />
        <Text style={{ fontSize: 16, color: colors.red, fontWeight: '700' }}>Списъкът не е намерен</Text>
      </SafeAreaView>
    );
  }

  const barWidth = `${Math.min(progress * 100, 100)}%`;
  const participantCount = sharedData.participants?.length || 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* Header */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }} numberOfLines={1}>{sharedData.listName}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Ionicons name="qr-code-outline" size={11} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1 }}>{code}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.greenLight ?? '#F0FFF4', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Ionicons name="people-outline" size={11} color={colors.green} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.green }}>{participantCount} участника</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 6, backgroundColor: colors.primaryLight, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
          <View style={{ height: 6, backgroundColor: colors.primary, borderRadius: 3, width: barWidth }} />
        </View>
        <Text style={{ fontSize: 12, color: colors.textTertiary, fontWeight: '600' }}>{checkedCount} / {items.length} отметнати</Text>
      </View>

      {/* Code share banner */}
      {isOwner && (
        <TouchableOpacity
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryLight, marginHorizontal: 14, marginTop: 12, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: colors.border }}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Код за споделяне</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: 4 }}>{code}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Сподели</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Budget tracker */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 14, marginTop: 12, borderRadius: 14, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginBottom: 4 }}>Бюджет</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{sharedData.budget?.toFixed(2)} €</Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginBottom: 4 }}>Изхарчено</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.orange }}>{spent.toFixed(2)} €</Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '600', marginBottom: 4 }}>Оставащо</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color: remaining >= 0 ? colors.green : colors.red }}>
            {remaining.toFixed(2)} €
          </Text>
        </View>
      </View>

      {/* Live indicator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green }} />
        <Text style={{ fontSize: 12, color: colors.textTertiary, fontWeight: '600' }}>Живо — обновява се в реално време</Text>
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={72}
        contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
