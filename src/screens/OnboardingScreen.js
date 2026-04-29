import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing, ReduceMotion,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from '../components/Text';

export const ONBOARDING_KEY = '@onboarding_v1';

export async function markOnboardingComplete() {
  try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
}
export async function hasSeenOnboarding() {
  try { return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true'; } catch { return false; }
}

// Strong ease-out bezier — starts at full velocity, decelerates naturally
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const t = (duration) => ({ duration, easing: EASE_OUT, reduceMotion: ReduceMotion.System });

const SLIDES = [
  {
    key: 'budget',
    eyebrow: 'УМНО ПАЗАРУВАНЕ',
    headline: 'Бюджет\nпод контрол',
    desc: 'Задайте бюджет, добавете продукти и следете разходите си в реално време.',
    emoji: '🛒',
    accent: '#2B7A5C',
    accentLight: 'rgba(43,122,92,0.08)',
    accentBorder: 'rgba(43,122,92,0.18)',
    shadowColor: '#2B7A5C',
  },
  {
    key: 'compare',
    eyebrow: 'СРАВНИ ЦЕНИТЕ',
    headline: 'Намери\nнай-добра сделка',
    desc: 'Сравнете цени в Lidl, Kaufland и Billa — открийте кой магазин е най-изгоден за вашия списък.',
    emoji: '📊',
    accent: '#1556A0',
    accentLight: 'rgba(21,86,160,0.07)',
    accentBorder: 'rgba(21,86,160,0.16)',
    shadowColor: '#1556A0',
  },
  {
    key: 'meals',
    eyebrow: 'AI РЕЦЕПТИ',
    headline: 'Яж вкусно\nи здравословно',
    desc: 'Изкуственият интелект генерира дневен план с рецепти точно от вашия списък с продукти.',
    emoji: '🍽️',
    accent: '#C96B28',
    accentLight: 'rgba(201,107,40,0.08)',
    accentBorder: 'rgba(201,107,40,0.18)',
    shadowColor: '#C96B28',
  },
];

// ─── Animated progress dot ────────────────────────────────────────────────────

function Dot({ active, accent }) {
  const w  = useSharedValue(active ? 24 : 6);
  const op = useSharedValue(active ? 1 : 0.28);

  useEffect(() => {
    w.value  = withTiming(active ? 24 : 6,  t(300));
    op.value = withTiming(active ? 1 : 0.28, t(300));
  }, [active]);

  const style = useAnimatedStyle(() => ({ width: w.value, opacity: op.value }));
  return <Animated.View style={[s.dot, { backgroundColor: accent }, style]} />;
}

// ─── Double-bezel illustration card ──────────────────────────────────────────
// Outer shell: tinted ring with accent border
// Inner core: white surface with ambient shadow — physical depth

function IllustrationCard({ slide, cardStyle }) {
  return (
    <Animated.View
      style={[
        s.cardShell,
        {
          backgroundColor: slide.accentLight,
          borderColor: slide.accentBorder,
        },
        cardStyle,
      ]}
    >
      <View
        style={[
          s.cardCore,
          {
            shadowColor: slide.shadowColor,
          },
        ]}
      >
        <Text style={s.cardEmoji}>{slide.emoji}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState(SLIDES[0]);
  const busy = useRef(false);

  // Staggered shared values — reset + drive each slide
  const cardOp    = useSharedValue(0);
  const cardScale = useSharedValue(0.86);
  const eyOp      = useSharedValue(0);
  const eyY       = useSharedValue(16);
  const hlOp      = useSharedValue(0);
  const hlY       = useSharedValue(16);
  const dscOp     = useSharedValue(0);
  const dscY      = useSharedValue(16);

  const animateIn = useCallback(() => {
    cardOp.value    = withTiming(1, t(520));
    cardScale.value = withTiming(1, t(520));
    eyOp.value      = withDelay(90,  withTiming(1, t(420)));
    eyY.value       = withDelay(90,  withTiming(0, t(420)));
    hlOp.value      = withDelay(170, withTiming(1, t(420)));
    hlY.value       = withDelay(170, withTiming(0, t(420)));
    dscOp.value     = withDelay(250, withTiming(1, t(420)));
    dscY.value      = withDelay(250, withTiming(0, t(420)));
  }, []);

  const animateOut = useCallback((onDone) => {
    const fast = t(130);
    cardOp.value = withTiming(0, fast);
    eyOp.value   = withTiming(0, fast);
    hlOp.value   = withTiming(0, fast);
    dscOp.value  = withTiming(0, fast);
    setTimeout(() => {
      // Reset positions while invisible
      cardScale.value = 0.86;
      eyY.value  = 16;
      hlY.value  = 16;
      dscY.value = 16;
      onDone?.();
    }, 145);
  }, []);

  // Kick off initial entrance on mount
  useEffect(() => { animateIn(); }, []);

  const advance = useCallback(() => {
    if (busy.current) return;
    const next = index + 1;

    if (next >= SLIDES.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      busy.current = true;
      animateOut(async () => {
        await markOnboardingComplete();
        navigation.replace('Login');
      });
      return;
    }

    Haptics.selectionAsync();
    busy.current = true;
    animateOut(() => {
      setSlide(SLIDES[next]);
      setIndex(next);
      busy.current = false;
      animateIn();
    });
  }, [index, animateIn, animateOut, navigation]);

  const skip = useCallback(async () => {
    Haptics.selectionAsync();
    await markOnboardingComplete();
    navigation.replace('Login');
  }, [navigation]);

  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOp.value,
    transform: [{ scale: cardScale.value }],
  }));
  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: eyOp.value,
    transform: [{ translateY: eyY.value }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: hlOp.value,
    transform: [{ translateY: hlY.value }],
  }));
  const descStyle = useAnimatedStyle(() => ({
    opacity: dscOp.value,
    transform: [{ translateY: dscY.value }],
  }));

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={s.root}>
      {/* Skip — only shown on first two slides */}
      {!isLast && (
        <TouchableOpacity
          style={s.skipBtn}
          onPress={skip}
          accessibilityLabel="Пропусни въвеждането"
          accessibilityRole="button"
        >
          <Text style={s.skipText}>Пропусни</Text>
        </TouchableOpacity>
      )}

      {/* ── Illustration area ── */}
      <View style={s.illustrationArea}>
        <IllustrationCard slide={slide} cardStyle={cardStyle} />
      </View>

      {/* ── Text content ── */}
      <View style={s.textArea}>

        {/* Eyebrow pill */}
        <Animated.View style={[s.eyebrowWrap, eyebrowStyle]}>
          <View style={[s.eyebrowPill, { backgroundColor: slide.accentLight, borderColor: slide.accentBorder }]}>
            <Text style={[s.eyebrowText, { color: slide.accent }]}>{slide.eyebrow}</Text>
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.View style={headlineStyle}>
          <Text style={s.headline}>{slide.headline}</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View style={descStyle}>
          <Text style={s.desc}>{slide.desc}</Text>
        </Animated.View>
      </View>

      {/* ── Bottom chrome ── */}
      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom + 8, 28) }]}>

        {/* Progress dots */}
        <View style={s.dots}>
          {SLIDES.map((sl, i) => (
            <Dot key={sl.key} active={i === index} accent={slide.accent} />
          ))}
        </View>

        {/* Primary CTA — pill with button-in-button arrow */}
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: slide.accent }]}
          onPress={advance}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Започни' : 'Напред'}
        >
          <Text style={s.ctaText}>{isLast ? 'Започни' : 'Напред'}</Text>
          <View style={s.ctaArrow}>
            <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={15} color={slide.accent} />
          </View>
        </TouchableOpacity>

        {/* Last slide: guest shortcut */}
        {isLast ? (
          <TouchableOpacity
            style={s.ghostBtn}
            onPress={skip}
            accessibilityRole="button"
            accessibilityLabel="Продължи като гост"
          >
            <Text style={s.ghostText}>Продължи като гост</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.ghostBtn} />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFCFB' },

  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8A89E',
    letterSpacing: 0.1,
  },

  // ─ Illustration ─

  illustrationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Outer shell — tinted ring, accent hairline border
  cardShell: {
    width: 228,
    height: 228,
    borderRadius: 52,
    padding: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Inner core — white surface floating above shell
  cardCore: {
    width: '100%',
    height: '100%',
    borderRadius: 42, // 52 - 10 for concentric curve
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
  },

  cardEmoji: { fontSize: 76, lineHeight: 92 },

  // ─ Text ─

  textArea: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 12,
  },

  eyebrowWrap: { alignSelf: 'flex-start' },
  eyebrowPill: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },

  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: '#19190F',
    lineHeight: 44,
    letterSpacing: -0.6,
  },

  desc: {
    fontSize: 15,
    color: '#72726A',
    lineHeight: 23,
    fontWeight: '400',
    maxWidth: 360,
  },

  // ─ Bottom chrome ─

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 2,
  },

  dot: { height: 6, borderRadius: 3 },

  // Pill CTA with button-in-button trailing icon
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 32,
    paddingRight: 14,
    gap: 12,
  },
  ctaText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  ctaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  ghostBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    minHeight: 42,
  },
  ghostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8A89E',
    letterSpacing: 0.1,
  },
});
