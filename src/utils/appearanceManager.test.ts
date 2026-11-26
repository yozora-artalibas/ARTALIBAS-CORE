import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FONT_TEMPLATES,
  THEME_TEMPLATES,
  DEFAULT_APPEARANCE_SETTINGS,
  FIXED_HEADER_PREFIX,
  DEFAULT_HEADER_SUBTITLE,
  getThemeById,
  getFontById,
  sanitizeAppearanceSettings,
  sanitizeHeaderSubtitle,
  formatHeaderTitle,
  buildAppearanceCssVars,
  buildWhatsAppPatternDataUrl,
} from './appearanceManager';
import { computeScaledDimensions } from './imageUtils';

test('FONT_TEMPLATES exposes exactly 10 distinct favorite simple-app fonts', () => {
  assert.equal(FONT_TEMPLATES.length, 10);
  const ids = new Set(FONT_TEMPLATES.map((f) => f.id));
  const names = new Set(FONT_TEMPLATES.map((f) => f.name));
  assert.equal(ids.size, 10);
  assert.equal(names.size, 10);
  for (const font of FONT_TEMPLATES) {
    assert.ok(font.fontFamily.length > 0);
    assert.ok(font.tagline.length > 0);
  }
});

test('THEME_TEMPLATES includes WhatsApp dark, light, and tinted presets', () => {
  assert.ok(THEME_TEMPLATES.length >= 6);
  const dark = getThemeById('wa-dark');
  const light = getThemeById('wa-light');
  assert.equal(dark.isLight, false);
  assert.equal(light.isLight, true);
  // Unknown ID falls back to default wa-dark
  assert.equal(getThemeById('nonexistent').id, 'wa-dark');
  assert.equal(getFontById('nonexistent').id, 'jakarta');
});

test('sanitizeAppearanceSettings validates wallpaper data URLs and clamps dim percentage', () => {
  const sanitized = sanitizeAppearanceSettings({
    themeId: 'wa-emerald',
    fontId: 'poppins',
    customWallpaper: 'https://evil.example/image.png', // non data URL rejected
    wallpaperDim: 150,
  });

  assert.equal(sanitized.themeId, 'wa-emerald');
  assert.equal(sanitized.fontId, 'poppins');
  assert.equal(sanitized.customWallpaper, null);
  assert.equal(sanitized.wallpaperDim, 90);

  const validWallpaper = sanitizeAppearanceSettings({
    ...DEFAULT_APPEARANCE_SETTINGS,
    customWallpaper: 'data:image/jpeg;base64,abc123',
    wallpaperDim: 2,
  });
  assert.equal(validWallpaper.customWallpaper, 'data:image/jpeg;base64,abc123');
  assert.equal(validWallpaper.wallpaperDim, 10);
});

test('buildAppearanceCssVars and buildWhatsAppPatternDataUrl return complete theme tokens', () => {
  const vars = buildAppearanceCssVars({
    themeId: 'wa-midnight',
    fontId: 'roboto',
    customWallpaper: null,
    wallpaperDim: 55,
  });

  assert.equal(vars['--wa-bg'], '#0a121e');
  assert.equal(vars['--wa-accent'], '#38bdf8');
  assert.ok(vars['--font-app'].includes('Roboto'));

  const pattern = buildWhatsAppPatternDataUrl('#233138');
  assert.ok(pattern.startsWith('url("data:image/svg+xml,'));
});

test('computeScaledDimensions preserves aspect ratio within max phone bounds', () => {
  const portrait = computeScaledDimensions(1440, 2560, 720, 1280);
  assert.deepEqual(portrait, { width: 720, height: 1280 });

  const small = computeScaledDimensions(400, 600, 720, 1280);
  assert.deepEqual(small, { width: 400, height: 600 });
});

test('sanitizeHeaderSubtitle and formatHeaderTitle keep Keterangan Apel paten while customizing unit name', () => {
  assert.equal(FIXED_HEADER_PREFIX, 'Keterangan Apel');
  assert.equal(DEFAULT_HEADER_SUBTITLE, 'Kompi Markas');
  assert.equal(formatHeaderTitle(''), 'Keterangan Apel Kompi Markas');
  assert.equal(formatHeaderTitle('   '), 'Keterangan Apel Kompi Markas');
  assert.equal(formatHeaderTitle('Kipan A 942'), 'Keterangan Apel Kipan A 942');
  assert.equal(sanitizeHeaderSubtitle('Keterangan Apel Kompi Bantuan'), 'Kompi Bantuan');
  assert.equal(formatHeaderTitle('Keterangan Apel Kompi Senapan B'), 'Keterangan Apel Kompi Senapan B');
});
