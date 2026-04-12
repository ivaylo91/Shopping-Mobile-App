/**
 * Generates app icon assets:
 *   assets/icon.png          — 1024×1024, full icon with background (iOS + Android legacy)
 *   assets/adaptive-icon.png — 1024×1024, foreground only on transparent bg (Android adaptive)
 *   assets/splash-icon.png   — 1024×1024, transparent bg (centered on purple splash screen)
 *
 * Run: node scripts/generateIcon.js
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const PURPLE = '#6C63FF';
const ASSETS = path.join(__dirname, '..', 'assets');

// ─── SVG pieces ───────────────────────────────────────────────────────────────

// Shopping bag drawn with pure SVG (no emoji, reliable cross-platform rendering)
const bag = `
  <!-- Handles -->
  <path d="M 392 368 C 392 254 450 190 512 190 C 574 190 632 254 632 368"
        fill="none" stroke="white" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Body -->
  <rect x="248" y="340" width="528" height="408" rx="54" fill="white"/>

  <!-- Top fold line inside body -->
  <rect x="248" y="424" width="528" height="3" fill="${PURPLE}" opacity="0.10"/>

  <!-- Three dots → "items in bag" -->
  <circle cx="392" cy="544" r="24" fill="${PURPLE}" opacity="0.16"/>
  <circle cx="512" cy="544" r="24" fill="${PURPLE}" opacity="0.16"/>
  <circle cx="632" cy="544" r="24" fill="${PURPLE}" opacity="0.16"/>

  <!-- Small checkmark → "smart" cue -->
  <polyline points="456,622 496,666 576,574"
            fill="none" stroke="${PURPLE}" stroke-width="24"
            stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
`;

const label = `
  <text x="512" y="818"
        font-family="'Arial Black', 'Arial Bold', Arial, Helvetica, sans-serif"
        font-size="76" font-weight="900" fill="white" text-anchor="middle"
        letter-spacing="-1">&#1055;&#1072;&#1079;&#1072;&#1088;&#1091;&#1074;&#1072;&#1081;</text>
  <text x="512" y="912"
        font-family="'Arial Black', 'Arial Bold', Arial, Helvetica, sans-serif"
        font-size="76" font-weight="900" fill="white" text-anchor="middle"
        letter-spacing="6">&#1091;&#1084;&#1085;&#1086;</text>
`;
// Пазарувай = &#1055;&#1072;&#1079;&#1072;&#1088;&#1091;&#1074;&#1072;&#1081;
// умно      = &#1091;&#1084;&#1085;&#1086;

// ─── SVG templates ───────────────────────────────────────────────────────────

// Full icon — purple background
const iconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${PURPLE}"/>
  ${bag}
  ${label}
</svg>`);

// Adaptive icon — transparent bg, content scaled to 68 % and centered
// Android safe zone: inner ~66 % of 108dp grid → we leave ~16 % padding each side
const adaptiveSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(163,130) scale(0.68)">
    ${bag}
    ${label}
  </g>
</svg>`);

// Splash icon — transparent bg, content fits a 512×512 centre (resizeMode: contain)
const splashSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 1024 1024">
  ${bag}
  ${label}
</svg>`);

// ─── Generator ────────────────────────────────────────────────────────────────

async function generate() {
  fs.mkdirSync(ASSETS, { recursive: true });

  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('✅  assets/icon.png');

  await sharp(adaptiveSvg)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));
  console.log('✅  assets/adaptive-icon.png');

  await sharp(splashSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('✅  assets/splash-icon.png');

  console.log('\nDone! Rebuild the app to see the new icon.');
}

generate().catch((err) => {
  console.error('❌ Icon generation failed:', err.message);
  process.exit(1);
});
