export interface FontTemplate {
  id: string;
  name: string;
  tagline: string;
  fontFamily: string;
  sampleText: string;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  isLight: boolean;
  hasPattern: boolean;
  bg: string;
  headerBg: string;
  headerText: string;
  headerMuted: string;
  cardBg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  accent: string;
  accentText: string;
  text: string;
  muted: string;
  patternColor: string;
}

export interface AppearanceSettings {
  themeId: string;
  fontId: string;
  customWallpaper: string | null;
  wallpaperDim: number; // 0 to 90 (%)
}

export const STORAGE_APPEARANCE_KEY = 'KIMA_APPEARANCE_SETTINGS_V1';
export const STORAGE_HEADER_PHOTO_KEY = 'KIMA_HEADER_PHOTO_V1';
export const STORAGE_HEADER_SUBTITLE_KEY = 'KIMA_HEADER_SUBTITLE_V1';
export const FIXED_HEADER_PREFIX = 'Keterangan Apel';
export const DEFAULT_HEADER_SUBTITLE = 'Kompi Markas';

export const FONT_TEMPLATES: FontTemplate[] = [
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    tagline: 'Modern & Tegas (Default)',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    tagline: 'Klasik Android & WhatsApp',
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'inter',
    name: 'Inter',
    tagline: 'Bersih & Minimalis',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    tagline: 'Bulat & Geometris',
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    tagline: 'Netral & Mudah Dibaca',
    fontFamily: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'nunito',
    name: 'Nunito',
    tagline: 'Lembut & Santai',
    fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'lato',
    name: 'Lato',
    tagline: 'Simpel & Seimbang',
    fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    tagline: 'Tegas & Berkarakter',
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'worksans',
    name: 'Work Sans',
    tagline: 'Rapi untuk Aplikasi Harian',
    fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
  {
    id: 'jetbrains',
    name: 'JetBrains Mono',
    tagline: 'Taktis & Monospace',
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
    sampleText: 'Serda Zulfi · SIAP OPS',
  },
];

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'wa-dark',
    name: 'WhatsApp Gelap',
    description: 'Tema gelap khas WhatsApp',
    isLight: false,
    hasPattern: true,
    bg: '#0b141a',
    headerBg: '#111b21',
    headerText: '#e9edef',
    headerMuted: '#8696a0',
    cardBg: '#111b21',
    surface: '#202c33',
    surfaceHover: '#2a3942',
    border: '#2a3942',
    accent: '#00a884',
    accentText: '#0b141a',
    text: '#e9edef',
    muted: '#8696a0',
    patternColor: '#233138',
  },
  {
    id: 'wa-light',
    name: 'WhatsApp Terang',
    description: 'Header hijau WhatsApp & latar krem',
    isLight: true,
    hasPattern: true,
    bg: '#efeae2',
    headerBg: '#008069',
    headerText: '#ffffff',
    headerMuted: '#d9fdd3',
    cardBg: '#ffffff',
    surface: '#f0f2f5',
    surfaceHover: '#e4e8ec',
    border: '#d1d7db',
    accent: '#008069',
    accentText: '#ffffff',
    text: '#111b21',
    muted: '#54656f',
    patternColor: '#d9d2c5',
  },
  {
    id: 'wa-emerald',
    name: 'Hijau Zamrud',
    description: 'Gelap dengan aksen zamrud segar',
    isLight: false,
    hasPattern: true,
    bg: '#081813',
    headerBg: '#0e261d',
    headerText: '#e9edef',
    headerMuted: '#8eb5a6',
    cardBg: '#0e261d',
    surface: '#143328',
    surfaceHover: '#1c4436',
    border: '#1f4d3d',
    accent: '#00c896',
    accentText: '#061a14',
    text: '#e9edef',
    muted: '#8eb5a6',
    patternColor: '#173c2f',
  },
  {
    id: 'wa-midnight',
    name: 'Biru Malam',
    description: 'Nuansa biru malam tenang',
    isLight: false,
    hasPattern: true,
    bg: '#0a121e',
    headerBg: '#111c2d',
    headerText: '#f1f5f9',
    headerMuted: '#94a3b8',
    cardBg: '#111c2d',
    surface: '#1a283d',
    surfaceHover: '#233550',
    border: '#263854',
    accent: '#38bdf8',
    accentText: '#081421',
    text: '#f1f5f9',
    muted: '#94a3b8',
    patternColor: '#192940',
  },
  {
    id: 'wa-olive',
    name: 'Hijau Taktis',
    description: 'Nuansa loreng olive militer',
    isLight: false,
    hasPattern: true,
    bg: '#10150c',
    headerBg: '#192113',
    headerText: '#f0f4ea',
    headerMuted: '#9ba88d',
    cardBg: '#192113',
    surface: '#242e1c',
    surfaceHover: '#2e3b24',
    border: '#354429',
    accent: '#84cc16',
    accentText: '#111809',
    text: '#f0f4ea',
    muted: '#9ba88d',
    patternColor: '#24301b',
  },
  {
    id: 'wa-burgundy',
    name: 'Marun Gelap',
    description: 'Elegan dengan aksen merah muda',
    isLight: false,
    hasPattern: true,
    bg: '#180c11',
    headerBg: '#24131a',
    headerText: '#fdf2f4',
    headerMuted: '#bfa0aa',
    cardBg: '#24131a',
    surface: '#311a24',
    surfaceHover: '#3e212e',
    border: '#4a2635',
    accent: '#fb7185',
    accentText: '#1e0a11',
    text: '#fdf2f4',
    muted: '#bfa0aa',
    patternColor: '#2f1822',
  },
  {
    id: 'wa-amber',
    name: 'Coklat Kopi',
    description: 'Hangat dengan aksen emas',
    isLight: false,
    hasPattern: true,
    bg: '#16110c',
    headerBg: '#221a13',
    headerText: '#faf5ef',
    headerMuted: '#b5a392',
    cardBg: '#221a13',
    surface: '#2f241b',
    surfaceHover: '#3b2e23',
    border: '#453528',
    accent: '#f59e0b',
    accentText: '#1a1106',
    text: '#faf5ef',
    muted: '#b5a392',
    patternColor: '#2c2118',
  },
  {
    id: 'wa-slate',
    name: 'Abu Polos',
    description: 'Tampilan bersih tanpa pola',
    isLight: false,
    hasPattern: false,
    bg: '#121417',
    headerBg: '#1b1e23',
    headerText: '#f3f4f6',
    headerMuted: '#9ca3af',
    cardBg: '#1b1e23',
    surface: '#262b33',
    surfaceHover: '#313742',
    border: '#363d48',
    accent: '#00a884',
    accentText: '#0b141a',
    text: '#f3f4f6',
    muted: '#9ca3af',
    patternColor: '#262b33',
  },
];

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  themeId: 'wa-dark',
  fontId: 'jakarta',
  customWallpaper: null,
  wallpaperDim: 55,
};

export function getThemeById(themeId: string): ThemeTemplate {
  return THEME_TEMPLATES.find((t) => t.id === themeId) || THEME_TEMPLATES[0];
}

export function getFontById(fontId: string): FontTemplate {
  return FONT_TEMPLATES.find((f) => f.id === fontId) || FONT_TEMPLATES[0];
}

export function sanitizeAppearanceSettings(
  raw: Partial<AppearanceSettings> | null | undefined
): AppearanceSettings {
  const theme = getThemeById(raw?.themeId || DEFAULT_APPEARANCE_SETTINGS.themeId);
  const font = getFontById(raw?.fontId || DEFAULT_APPEARANCE_SETTINGS.fontId);
  const wallpaper =
    typeof raw?.customWallpaper === 'string' && raw.customWallpaper.startsWith('data:image/')
      ? raw.customWallpaper
      : null;
  const rawDim = Number(raw?.wallpaperDim);
  const wallpaperDim = Number.isFinite(rawDim)
    ? Math.max(10, Math.min(90, Math.round(rawDim)))
    : DEFAULT_APPEARANCE_SETTINGS.wallpaperDim;

  return {
    themeId: theme.id,
    fontId: font.id,
    customWallpaper: wallpaper,
    wallpaperDim,
  };
}

export function loadAppearanceSettings(): AppearanceSettings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_APPEARANCE_SETTINGS;
    const saved = localStorage.getItem(STORAGE_APPEARANCE_KEY);
    if (!saved) return DEFAULT_APPEARANCE_SETTINGS;
    return sanitizeAppearanceSettings(JSON.parse(saved));
  } catch {
    return DEFAULT_APPEARANCE_SETTINGS;
  }
}

export function saveAppearanceSettings(settings: AppearanceSettings): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_APPEARANCE_KEY, JSON.stringify(sanitizeAppearanceSettings(settings)));
  } catch {
    // Fallback without wallpaper if storage quota is full
    try {
      const lite = { ...sanitizeAppearanceSettings(settings), customWallpaper: null };
      localStorage.setItem(STORAGE_APPEARANCE_KEY, JSON.stringify(lite));
    } catch {
      // Ignore storage error
    }
  }
}

export function loadHeaderPhoto(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const val = localStorage.getItem(STORAGE_HEADER_PHOTO_KEY);
    if (val && val.startsWith('data:image/')) return val;
    return null;
  } catch {
    return null;
  }
}

export function saveHeaderPhoto(dataUrl: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      localStorage.setItem(STORAGE_HEADER_PHOTO_KEY, dataUrl);
    } else {
      localStorage.removeItem(STORAGE_HEADER_PHOTO_KEY);
    }
  } catch {
    // Ignore quota errors cleanly
  }
}

export function sanitizeHeaderSubtitle(raw: string | null | undefined): string {
  const collapsed = (raw ?? '').replace(/\s+/g, ' ').trim();
  const withoutDuplicatePrefix = collapsed.replace(/^keterangan\s+apel\b[:\-\s]*/i, '').trim();
  if (!withoutDuplicatePrefix) return DEFAULT_HEADER_SUBTITLE;
  return withoutDuplicatePrefix.slice(0, 40).trim() || DEFAULT_HEADER_SUBTITLE;
}

export function formatHeaderTitle(subtitle: string | null | undefined): string {
  return `${FIXED_HEADER_PREFIX} ${sanitizeHeaderSubtitle(subtitle)}`;
}

export function loadHeaderSubtitle(): string {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_HEADER_SUBTITLE;
    const saved = localStorage.getItem(STORAGE_HEADER_SUBTITLE_KEY);
    return sanitizeHeaderSubtitle(saved);
  } catch {
    return DEFAULT_HEADER_SUBTITLE;
  }
}

export function saveHeaderSubtitle(subtitle: string): string {
  const clean = sanitizeHeaderSubtitle(subtitle);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_HEADER_SUBTITLE_KEY, clean);
    }
  } catch {
    // Ignore storage errors cleanly
  }
  return clean;
}

/**
 * Generates an inline SVG doodle pattern reminiscent of WhatsApp chat wallpaper.
 */
export function buildWhatsAppPatternDataUrl(strokeColor: string, opacity = 0.45): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g fill="none" stroke="${strokeColor}" stroke-width="1.3" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="22" r="7"/><path d="M58 18h14v10H62l-4 4z"/><path d="M98 16l4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1z"/><path d="M16 64c4-6 12-6 16 0s-4 14-8 14-12-8-8-14z"/><rect x="52" y="54" width="16" height="12" rx="3"/><path d="M92 64h14M99 57v14"/><path d="M20 98l10-6v12z"/><circle cx="62" cy="100" r="6"/><path d="M59 100h6"/><path d="M92 98c3-4 9-4 12 0"/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function buildAppearanceCssVars(settings: AppearanceSettings): Record<string, string> {
  const theme = getThemeById(settings.themeId);
  const font = getFontById(settings.fontId);
  return {
    '--wa-bg': theme.bg,
    '--wa-header': theme.headerBg,
    '--wa-header-text': theme.headerText,
    '--wa-header-muted': theme.headerMuted,
    '--wa-card': theme.cardBg,
    '--wa-surface': theme.surface,
    '--wa-surface-hover': theme.surfaceHover,
    '--wa-border': theme.border,
    '--wa-accent': theme.accent,
    '--wa-accent-text': theme.accentText,
    '--wa-text': theme.text,
    '--wa-muted': theme.muted,
    '--font-app': font.fontFamily,
  };
}
