import React, { useRef, useState } from 'react';
import {
  X,
  Palette,
  Type,
  ImagePlus,
  Trash2,
  Check,
  RotateCcw,
  SunMoon,
  Camera,
} from 'lucide-react';
import {
  AppearanceSettings,
  DEFAULT_APPEARANCE_SETTINGS,
  FONT_TEMPLATES,
  THEME_TEMPLATES,
  buildWhatsAppPatternDataUrl,
  getFontById,
  getThemeById,
} from '../utils/appearanceManager';
import { compressWallpaperToDataUrl } from '../utils/imageUtils';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppearanceSettings;
  onUpdateSettings: (next: AppearanceSettings) => void;
  onOpenHeaderPhoto: () => void;
  headerSubtitle?: string;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenHeaderPhoto,
  headerSubtitle = 'Kompi Markas',
}) => {
  const [activeSection, setActiveSection] = useState<'theme' | 'font'>('theme');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeTheme = getThemeById(settings.themeId);
  const activeFont = getFontById(settings.fontId);
  const patternUrl = activeTheme.hasPattern
    ? buildWhatsAppPatternDataUrl(activeTheme.patternColor, activeTheme.isLight ? 0.55 : 0.45)
    : 'none';

  const handleSelectWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const compressed = await compressWallpaperToDataUrl(file, 720, 1280, 0.78);
      onUpdateSettings({
        ...settings,
        customWallpaper: compressed,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gagal memproses gambar wallpaper.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tema, Wallpaper, dan Font"
        className="w-full max-w-[440px] bg-[var(--wa-card)] text-[var(--wa-text)] border-t border-x border-[var(--wa-border)] rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden pb-safe"
        style={{ fontFamily: activeFont.fontFamily }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[var(--wa-border)]" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-[var(--wa-border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${activeTheme.accent}22`, color: activeTheme.accent }}
            >
              <Palette className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold truncate">Tema, Wallpaper &amp; Font</h3>
              <p className="text-[12px] text-[var(--wa-muted)] truncate">
                {activeTheme.name} · {activeFont.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Pengaturan Tampilan"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-[var(--wa-surface)] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-4 pt-3 pb-2">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--wa-surface)] border border-[var(--wa-border)]">
            <button
              type="button"
              onClick={() => setActiveSection('theme')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'theme'
                  ? 'bg-[var(--wa-card)] text-[var(--wa-accent)] shadow-xs'
                  : 'text-[var(--wa-muted)] hover:text-[var(--wa-text)]'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>Tema &amp; Gambar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('font')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'font'
                  ? 'bg-[var(--wa-card)] text-[var(--wa-accent)] shadow-xs'
                  : 'text-[var(--wa-muted)] hover:text-[var(--wa-text)]'
              }`}
            >
              <Type className="w-4 h-4 shrink-0" />
              <span>Font ({FONT_TEMPLATES.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 pt-2 overflow-y-auto flex-1 space-y-4">
          {/* Live WhatsApp Mini Preview */}
          <div className="rounded-2xl overflow-hidden border border-[var(--wa-border)] shadow-sm">
            <div
              className="px-3.5 py-2 flex items-center justify-between text-[12px] font-bold gap-2"
              style={{ backgroundColor: activeTheme.headerBg, color: activeTheme.headerText }}
            >
              <span className="truncate">Keterangan Apel {headerSubtitle}</span>
              <span className="text-[10px] font-medium opacity-85 shrink-0">{activeFont.name}</span>
            </div>
            <div
              className="relative px-3.5 py-3 space-y-2"
              style={{
                backgroundColor: activeTheme.bg,
                backgroundImage: settings.customWallpaper
                  ? `url(${settings.customWallpaper})`
                  : patternUrl,
                backgroundSize: settings.customWallpaper ? 'cover' : '120px 120px',
                backgroundPosition: 'center',
              }}
            >
              {settings.customWallpaper && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundColor: activeTheme.isLight
                      ? `rgba(239, 234, 226, ${settings.wallpaperDim / 100})`
                      : `rgba(11, 20, 26, ${settings.wallpaperDim / 100})`,
                  }}
                />
              )}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{
                      backgroundColor: `${activeTheme.accent}28`,
                      color: activeTheme.accent,
                      border: `1px solid ${activeTheme.accent}55`,
                    }}
                  >
                    SRD
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{ color: activeTheme.text }}
                    >
                      Serda Zulfi
                    </div>
                    <div
                      className="text-[11px] truncate"
                      style={{ color: activeTheme.muted }}
                    >
                      SIAP OPS · Paten: STAF OPS
                    </div>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: activeTheme.accent,
                    color: activeTheme.accentText,
                  }}
                >
                  HADIR
                </span>
              </div>
            </div>
          </div>

          {activeSection === 'theme' && (
            <>
              {/* Custom Image Upload from Phone */}
              <div className="p-3.5 rounded-2xl bg-[var(--wa-surface)] border border-[var(--wa-border)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-[13.5px] font-bold">Wallpaper dari Galeri HP</h4>
                    <p className="text-[11.5px] text-[var(--wa-muted)]">
                      Pasang foto/gambar pribadi sebagai latar belakang
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectWallpaper}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl text-[13px] font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                    style={{
                      backgroundColor: activeTheme.accent,
                      color: activeTheme.accentText,
                    }}
                  >
                    <ImagePlus className="w-4 h-4 shrink-0" />
                    <span>
                      {isUploading
                        ? 'Memproses gambar...'
                        : settings.customWallpaper
                        ? 'Ganti Gambar HP'
                        : 'Pilih Gambar dari HP'}
                    </span>
                  </button>

                  {settings.customWallpaper && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          customWallpaper: null,
                        })
                      }
                      aria-label="Hapus gambar wallpaper"
                      title="Hapus Gambar"
                      className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 inline-flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[12px] text-rose-400 font-medium">{uploadError}</p>
                )}

                {settings.customWallpaper && (
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="inline-flex items-center gap-1.5 text-[var(--wa-muted)] font-medium">
                        <SunMoon className="w-3.5 h-3.5" />
                        <span>Redupkan Latar (Agar Teks Jelas)</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums">
                        {settings.wallpaperDim}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={settings.wallpaperDim}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          wallpaperDim: Number(e.target.value),
                        })
                      }
                      aria-label="Tingkat peredupan wallpaper"
                      className="w-full accent-[var(--wa-accent)] cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Template Tema WhatsApp */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold uppercase tracking-wide text-[var(--wa-muted)]">
                    Template Tema ({THEME_TEMPLATES.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHeaderPhoto();
                    }}
                    className="text-[12px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    style={{ color: activeTheme.accent }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Ubah Foto</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {THEME_TEMPLATES.map((tpl) => {
                    const selected = settings.themeId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            themeId: tpl.id,
                          })
                        }
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'ring-2 ring-[var(--wa-accent)] border-[var(--wa-accent)] bg-[var(--wa-surface)]'
                            : 'border-[var(--wa-border)] bg-[var(--wa-surface)]/60 hover:bg-[var(--wa-surface)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-5 h-5 rounded-full border border-white/20"
                              style={{ backgroundColor: tpl.headerBg }}
                            />
                            <span
                              className="w-5 h-5 rounded-full border border-white/20 -ml-2"
                              style={{ backgroundColor: tpl.bg }}
                            />
                            <span
                              className="w-5 h-5 rounded-full border border-white/20 -ml-2"
                              style={{ backgroundColor: tpl.accent }}
                            />
                          </div>
                          {selected && (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: tpl.accent, color: tpl.accentText }}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] font-bold truncate">{tpl.name}</div>
                        <div className="text-[11px] text-[var(--wa-muted)] truncate">
                          {tpl.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeSection === 'font' && (
            <div className="space-y-2">
              <p className="text-[12px] text-[var(--wa-muted)]">
                Pilih 1 dari {FONT_TEMPLATES.length} font favorit yang langsung mengubah seluruh tulisan aplikasi:
              </p>
              <div className="space-y-2">
                {FONT_TEMPLATES.map((font, idx) => {
                  const selected = settings.fontId === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          fontId: font.id,
                        })
                      }
                      style={{ fontFamily: font.fontFamily }}
                      className={`w-full min-h-[58px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                        selected
                          ? 'border-[var(--wa-accent)] ring-1 ring-[var(--wa-accent)] bg-[var(--wa-surface)]'
                          : 'border-[var(--wa-border)] bg-[var(--wa-surface)]/50 hover:bg-[var(--wa-surface)]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[var(--wa-muted)]">
                            #{idx + 1}
                          </span>
                          <span className="text-[14.5px] font-bold truncate">{font.name}</span>
                        </div>
                        <div className="text-[12px] text-[var(--wa-muted)] truncate mt-0.5">
                          {font.tagline} · {font.sampleText}
                        </div>
                      </div>
                      {selected && (
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: activeTheme.accent,
                            color: activeTheme.accentText,
                          }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reset Appearance Button */}
          <div className="pt-1 pb-2">
            <button
              type="button"
              onClick={() => onUpdateSettings(DEFAULT_APPEARANCE_SETTINGS)}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[var(--wa-border)] bg-[var(--wa-surface)] hover:bg-[var(--wa-surface-hover)] text-[13px] font-semibold text-[var(--wa-muted)] hover:text-[var(--wa-text)] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Kembalikan Tema &amp; Font Default</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
