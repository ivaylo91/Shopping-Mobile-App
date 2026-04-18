import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList } from 'react-native';
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getCategoryEmoji } from './HomeScreen';
import AnimatedPressable from '../components/AnimatedPressable';

// Generate a 6-char alphanumeric code
function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Item row ─────────────────────────────────────────────────────────────────

const SharedItem = memo(function SharedItem({ item, checked, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.item, checked && styles.itemChecked]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.75}
    >
      <View style={styles.checkBox}>
        {checked
          ? <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
          : <Ionicons name="ellipse-outline" size={24} color="#ddd" />}
      </View>
      <View style={styles.itemIconWrap}>
        <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category)}</Text>
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemName, checked && styles.itemNameChecked]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.note ? <Text style={styles.itemNote}>📝 {item.note}</Text> : null}
        <Text style={styles.itemMeta}>{item.price?.toFixed(2)} € × {item.quantity}</Text>
      </View>
      <Text style={[styles.itemPrice, checked && styles.itemPriceChecked]}>
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
      // Add self to participants
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
    <SafeAreaView style={styles.joinContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
      </TouchableOpacity>
      <View style={styles.joinContent}>
        <View style={styles.joinIcon}>
          <Ionicons name="people-outline" size={40} color="#6C63FF" />
        </View>
        <Text style={styles.joinTitle}>Присъедини се към списък</Text>
        <Text style={styles.joinSub}>Въведете 6-символния код, получен от споделящия</Text>
        <TextInput
          style={styles.codeInput}
          placeholder="XXXXXX"
          placeholderTextColor="#ccc"
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={handleJoin}
        />
        <AnimatedPressable
          style={[styles.joinBtn, (loading || code.length < 6) && styles.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={loading || code.length < 6}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="enter-outline" size={18} color="#fff" /><Text style={styles.joinBtnText}>Присъедини се</Text></>}
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

  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create the shared list doc (owner only, on mount)
  useEffect(() => {
    if (isOwner && list) {
      createSharedList();
    }
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
    } catch (err) {
      showToast('Грешка при създаване', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Real-time listener
  useEffect(() => {
    const ref = doc(db, 'sharedLists', code);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSharedData(snap.data());
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [code]);

  const toggleCheck = useCallback(async (itemId) => {
    if (!sharedData) return;
    Haptics.selectionAsync();
    const prev = sharedData.checked?.[itemId] || false;
    try {
      await updateDoc(doc(db, 'sharedLists', code), {
        [`checked.${itemId}`]: !prev,
      });
    } catch {
      showToast('Грешка при обновяване', 'error');
    }
  }, [sharedData, code, showToast]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `🛒 Присъедини се към моя списък за пазаруване!\n\nКод: ${code}\n\nОтвори приложението и въведи кода.`,
      });
    } catch {}
  };

  const { spent, remaining, checkedCount, progress, items, checked } = useMemo(() => {
    if (!sharedData) return { spent: 0, remaining: 0, checkedCount: 0, progress: 0, items: [], checked: {} };
    const ch = sharedData.checked || {};
    const it = sharedData.items || [];
    const sp = it.reduce((s, i) => (ch[i.id] ? s + i.subtotal : s), 0);
    const cnt = Object.values(ch).filter(Boolean).length;
    return {
      spent: sp,
      remaining: (sharedData.budget || 0) - sp,
      checkedCount: cnt,
      progress: it.length > 0 ? cnt / it.length : 0,
      items: it,
      checked: ch,
    };
  }, [sharedData]);

  const renderItem = useCallback(
    ({ item }) => <SharedItem item={item} checked={!!checked[item.id]} onToggle={toggleCheck} />,
    [checked, toggleCheck]
  );

  if (loading || creating) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>{creating ? 'Създаване на споделен списък...' : 'Зареждане...'}</Text>
      </SafeAreaView>
    );
  }

  if (!sharedData) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={56} color="#E0E0EA" />
        <Text style={styles.errorText}>Списъкът не е намерен</Text>
      </SafeAreaView>
    );
  }

  const barWidth = `${Math.min(progress * 100, 100)}%`;
  const participantCount = sharedData.participants?.length || 1;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{sharedData.listName}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.codeBadge}>
                <Ionicons name="qr-code-outline" size={11} color="#6C63FF" />
                <Text style={styles.codeText}>{code}</Text>
              </View>
              <View style={styles.peopleBadge}>
                <Ionicons name="people-outline" size={11} color="#2ecc71" />
                <Text style={styles.peopleText}>{participantCount} участника</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={22} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: barWidth }]} />
        </View>
        <Text style={styles.progressText}>{checkedCount} / {items.length} отметнати</Text>
      </View>

      {/* Code share banner */}
      {isOwner && (
        <TouchableOpacity style={styles.shareBanner} onPress={handleShare} activeOpacity={0.85}>
          <View style={styles.shareBannerLeft}>
            <Text style={styles.shareBannerTitle}>Код за споделяне</Text>
            <Text style={styles.shareBannerCode}>{code}</Text>
          </View>
          <View style={styles.shareBannerRight}>
            <Ionicons name="share-social-outline" size={20} color="#6C63FF" />
            <Text style={styles.shareBannerBtn}>Сподели</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Budget tracker */}
      <View style={styles.budgetBar}>
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Бюджет</Text>
          <Text style={styles.budgetStatValue}>{sharedData.budget?.toFixed(2)} €</Text>
        </View>
        <View style={styles.budgetDivider} />
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Изхарчено</Text>
          <Text style={[styles.budgetStatValue, { color: '#e67e22' }]}>{spent.toFixed(2)} €</Text>
        </View>
        <View style={styles.budgetDivider} />
        <View style={styles.budgetStat}>
          <Text style={styles.budgetStatLabel}>Оставащо</Text>
          <Text style={[styles.budgetStatValue, { color: remaining >= 0 ? '#2ecc71' : '#e74c3c' }]}>
            {remaining.toFixed(2)} €
          </Text>
        </View>
      </View>

      {/* Live indicator */}
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Живо — обновява се в реално време</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FC', gap: 12 },
  loadingText: { fontSize: 14, color: '#aaa', fontWeight: '600' },
  errorText: { fontSize: 16, color: '#e74c3c', fontWeight: '700' },

  // Join screen
  joinContainer: { flex: 1, backgroundColor: '#F7F8FC', padding: 24 },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  joinContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  joinIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#F0EEFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  joinTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  joinSub: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  codeInput: {
    fontSize: 32, fontWeight: '800', color: '#1A1A2E', textAlign: 'center',
    letterSpacing: 8, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    width: '100%', borderWidth: 2, borderColor: '#eee',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, width: '100%',
    justifyContent: 'center',
    shadowColor: '#6C63FF', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  joinBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  joinBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Shared list screen
  header: {
    backgroundColor: '#fff', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  headerMeta: { flexDirection: 'row', gap: 8, marginTop: 3 },
  codeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0EEFF', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  codeText: { fontSize: 11, fontWeight: '800', color: '#6C63FF', letterSpacing: 1 },
  peopleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FFF4', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  peopleText: { fontSize: 11, fontWeight: '700', color: '#2ecc71' },
  progressTrack: { height: 6, backgroundColor: '#F0EEFF', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: '#6C63FF', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  shareBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F0EEFF', marginHorizontal: 14, marginTop: 12, borderRadius: 14,
    padding: 14, borderWidth: 1.5, borderColor: '#E0DCFF',
  },
  shareBannerLeft: { gap: 2 },
  shareBannerTitle: { fontSize: 11, color: '#9B96D4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  shareBannerCode: { fontSize: 24, fontWeight: '800', color: '#6C63FF', letterSpacing: 4 },
  shareBannerRight: { alignItems: 'center', gap: 4 },
  shareBannerBtn: { fontSize: 11, fontWeight: '700', color: '#6C63FF' },

  budgetBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 14, marginTop: 12, borderRadius: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 4 },
  budgetStatValue: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  budgetDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },

  liveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71' },
  liveText: { fontSize: 12, color: '#aaa', fontWeight: '600' },

  list: { padding: 14, paddingBottom: 20 },
  item: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
  },
  itemChecked: { opacity: 0.45 },
  checkBox: {},
  itemIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 1 },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#bbb' },
  itemNote: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#aaa' },
  itemPrice: { fontSize: 15, fontWeight: '800', color: '#6C63FF' },
  itemPriceChecked: { color: '#ccc' },
});
