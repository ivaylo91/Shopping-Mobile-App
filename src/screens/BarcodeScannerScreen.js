import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import Text from '../components/Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { CATEGORIES, getCategoryColors } from './HomeScreen';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'];

async function lookupBarcode(barcode) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'BudgetShoppingApp/1.0' } }
    );
    const json = await res.json();
    if (json.status !== 1) return { name: '', barcode, found: false };
    const p = json.product;
    const name = p.product_name_bg || p.product_name || p.product_name_en || p.generic_name || '';
    const brands = p.brands || '';
    const quantity = p.quantity || '';
    const category = p.categories_tags?.[0]?.replace('en:', '') || '';
    const imageUrl = p.image_small_url || '';
    const fullName = [name, brands && `(${brands})`, quantity].filter(Boolean).join(' ').trim();
    return { name: fullName, barcode, found: true, category, brands, imageUrl };
  } catch {
    return { name: '', barcode, found: false };
  }
}

function guessMappedCategory(category = '') {
  const c = category.toLowerCase();
  if (c.includes('dairy') || c.includes('milk') || c.includes('cheese')) return 'dairy';
  if (c.includes('meat') || c.includes('chicken') || c.includes('beef')) return 'meat';
  if (c.includes('vegetable') || c.includes('veggie')) return 'veggies';
  if (c.includes('fruit') || c.includes('juice')) return 'fruit';
  if (c.includes('beverage') || c.includes('drink') || c.includes('water')) return 'drinks';
  if (c.includes('bread') || c.includes('cereal') || c.includes('pasta')) return 'food';
  return 'other';
}

// ─── Bottom Sheet Preview ─────────────────────────────────────────────────────

function ProductPreviewSheet({ result, onAdd, onRescan, onClose, colors, isDark }) {
  if (!result) return null;
  const mappedCat = guessMappedCategory(result.category);
  const catMeta = CATEGORIES.find((c) => c.id === mappedCat) || CATEGORIES[CATEGORIES.length - 1];
  const catColors = getCategoryColors(mappedCat, isDark);

  return (
    <View style={[sheetS.sheet, { backgroundColor: colors.card }]}>
      <View style={[sheetS.handle, { backgroundColor: colors.border }]} />

      {result.found ? (
        <>
          <View style={sheetS.productRow}>
            <View style={[sheetS.iconWrap, { backgroundColor: catColors.bg }]}>
              <Text style={{ fontSize: 28 }}>{catMeta.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sheetS.productName, { color: colors.text }]} numberOfLines={2}>
                {result.name || 'Неизвестен продукт'}
              </Text>
              {result.brands && (
                <Text style={[sheetS.productBrand, { color: colors.textTertiary }]}>{result.brands}</Text>
              )}
              <View style={[sheetS.catBadge, { backgroundColor: catColors.bg }]}>
                <Text style={[sheetS.catBadgeText, { color: catColors.text }]}>{catMeta.label}</Text>
              </View>
            </View>
          </View>

          <View style={sheetS.barcodeRow}>
            <Ionicons name="barcode-outline" size={14} color={colors.textTertiary} />
            <Text style={[sheetS.barcodeText, { color: colors.textTertiary }]}>{result.barcode}</Text>
          </View>

          <TouchableOpacity style={[sheetS.addBtn, { backgroundColor: colors.primary }]} onPress={onAdd}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={sheetS.addBtnText}>Добави в списъка</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Ionicons name="search-outline" size={48} color={colors.border} />
            <Text style={[sheetS.notFoundTitle, { color: colors.text }]}>Продуктът не е намерен</Text>
            <Text style={[sheetS.notFoundSub, { color: colors.textTertiary }]}>Баркод: {result.barcode}</Text>
          </View>
          <TouchableOpacity style={[sheetS.addBtn, { backgroundColor: colors.primary }]} onPress={onAdd}>
            <Text style={sheetS.addBtnText}>Добави ръчно с баркода</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={[sheetS.rescanBtn, { backgroundColor: colors.cardAlt }]} onPress={onRescan}>
        <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
        <Text style={[sheetS.rescanText, { color: colors.textSecondary }]}>Сканирай отново</Text>
      </TouchableOpacity>
    </View>
  );
}

const sheetS = StyleSheet.create({
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 14 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  productRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  iconWrap: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 16, fontWeight: '700', marginBottom: 4, lineHeight: 22 },
  productBrand: { fontSize: 12, marginBottom: 6 },
  catBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  barcodeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barcodeText: { fontSize: 12 },
  addBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  rescanBtn: { borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rescanText: { fontWeight: '600', fontSize: 14 },
  notFoundTitle: { fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  notFoundSub: { fontSize: 13, marginBottom: 8 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BarcodeScannerScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || data === lastCode) return;
    setScanned(true);
    setLastCode(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      const result = await lookupBarcode(data);
      setScannedResult(result);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!scannedResult) return;
    navigation.navigate('Home', { scannedProduct: scannedResult });
  };

  const handleRescan = () => {
    setScanned(false);
    setLastCode('');
    setScannedResult(null);
  };

  if (!permission) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[s.center, { backgroundColor: colors.bg }]}>
        <Ionicons name="camera-outline" size={64} color={colors.border} />
        <Text style={[s.permTitle, { color: colors.text }]}>Нужен е достъп до камерата</Text>
        <Text style={[s.permSub, { color: colors.textTertiary }]}>За да сканирате баркодове</Text>
        <TouchableOpacity style={[s.permBtn, { backgroundColor: colors.primary }]} onPress={requestPermission} accessibilityLabel="Разреши достъп до камерата" accessibilityRole="button">
          <Text style={s.permBtnText}>Разреши достъп</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Назад" accessibilityRole="button">
          <Text style={[s.backLinkText, { color: colors.textTertiary }]}>Назад</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
      />

      <View style={s.overlay}>
        <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()} accessibilityLabel="Затвори скенера" accessibilityRole="button">
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Сканирай продукт</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.frameWrap}>
          <View style={[s.frame, { width: Math.min(280, screenWidth * 0.7), height: Math.round(Math.min(280, screenWidth * 0.7) * 0.77) }]}>
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
            {loading && (
              <View style={s.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={s.loadingText}>Търсене на продукта...</Text>
              </View>
            )}
          </View>
          {!scannedResult && !loading && (
            <Text style={s.hint}>Насочете камерата към баркода на продукта</Text>
          )}
        </View>

        {/* Bottom sheet preview when product found */}
        {scannedResult && (
          <ProductPreviewSheet
            result={scannedResult}
            onAdd={handleAdd}
            onRescan={handleRescan}
            colors={colors}
            isDark={isDark}
          />
        )}
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = '#2B7A5C';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  permTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  permSub: { fontSize: 14, textAlign: 'center' },
  permBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backLinkText: { marginTop: 8, fontSize: 14, fontWeight: '600' },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.55)' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  frameWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  frame: { borderRadius: 12, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR, borderTopLeftRadius: 8 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR, borderTopRightRadius: 8 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR, borderBottomLeftRadius: 8 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR, borderBottomRightRadius: 8 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
