import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'];

async function lookupBarcode(barcode) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'BudgetShoppingApp/1.0' } }
    );
    const json = await res.json();
    if (json.status !== 1) return { name: '', barcode };
    const p = json.product;
    const name =
      p.product_name_bg ||
      p.product_name ||
      p.product_name_en ||
      p.generic_name ||
      '';
    const brands = p.brands || '';
    const quantity = p.quantity || '';
    const fullName = [name, brands && `(${brands})`, quantity].filter(Boolean).join(' ').trim();
    return { name: fullName, barcode };
  } catch {
    return { name: '', barcode };
  }
}

export default function BarcodeScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState('');

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || data === lastCode) return;
    setScanned(true);
    setLastCode(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      const result = await lookupBarcode(data);
      navigation.navigate('Home', { scannedProduct: result });
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="camera-outline" size={64} color="#E0E0EA" />
        <Text style={styles.permTitle}>Нужен е достъп до камерата</Text>
        <Text style={styles.permSub}>За да сканирате баркодове</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Разреши достъп</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Назад</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Сканирай продукт</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scan frame */}
        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Търсене на продукта...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom hint */}
        <View style={styles.bottomBar}>
          {scanned && !loading ? (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => { setScanned(false); setLastCode(''); }}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.rescanText}>Сканирай отново</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.hint}>Насочете камерата към баркода на продукта</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = '#6C63FF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FC', padding: 32, gap: 12 },

  permTitle: { fontSize: 19, fontWeight: '800', color: '#1A1A2E', marginTop: 16 },
  permSub: { fontSize: 14, color: '#aaa', textAlign: 'center' },
  permBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 12,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backLink: { marginTop: 8 },
  backLinkText: { color: '#aaa', fontSize: 14, fontWeight: '600' },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  frameWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame: {
    width: 260, height: 200, borderRadius: 12, position: 'relative',
    justifyContent: 'center', alignItems: 'center',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
  },
  tl: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderTopLeftRadius: 8,
  },
  tr: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderTopRightRadius: 8,
  },
  bl: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderBottomLeftRadius: 8,
  },
  br: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR, borderBottomRightRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  loadingText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 28, paddingHorizontal: 24,
    alignItems: 'center', gap: 16,
  },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6C63FF', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
  },
  rescanText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
