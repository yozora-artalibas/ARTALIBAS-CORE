import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MoreVertical,
  ArrowLeft,
  X,
  FileText,
  AlertTriangle,
  History,
  CheckSquare,
  RotateCcw,
  UserPlus,
  ArrowRightLeft,
  FileSpreadsheet,
  Palette,
} from 'lucide-react';
import { FIXED_HEADER_PREFIX } from '../utils/appearanceManager';

const DEFAULT_APP_LOGO_URL = '/pwa-512x512.png';

interface HeaderProps {
  onOpenExport: () => void;
  onOpenDuplicateModal: () => void;
  onOpenHistory: () => void;
  onOpenAppearance: () => void;
  onOpenHeaderPhoto: () => void;
  onResetAllToPaten: () => void;
  onOpenAddPersonnel: () => void;
  onCopyApelToPaten: () => void;
  onOpenGoogleSheetsModal: () => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hasDuplicates: boolean;
  duplicateCount: number;
  totalHistoryCount?: number;
  headerPhotoUrl: string | null;
  headerSubtitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExport,
  onOpenDuplicateModal,
  onOpenHistory,
  onOpenAppearance,
  onOpenHeaderPhoto,
  onResetAllToPaten,
  onOpenAddPersonnel,
  onCopyApelToPaten,
  onOpenGoogleSheetsModal,
  isSelectionMode,
  onToggleSelectionMode,
  searchQuery,
  onSearchChange,
  hasDuplicates,
  duplicateCount,
  totalHistoryCount = 0,
  headerPhotoUrl,
  headerSubtitle,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        if (isSearchOpen && !searchQuery) {
          setIsSearchOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchOpen, searchQuery]);

  const runMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <header
      className={`shrink-0 ${
        isMenuOpen ? 'z-50' : 'z-40'
      } bg-[var(--wa-header)] text-[var(--wa-header-text)] border-b border-[var(--wa-border)] px-2 pt-safe transition-colors`}
    >
      {/* Full-screen click interceptor when 3-dot menu is open so tapping outside ONLY dismisses the menu first */}
      {isMenuOpen && (
        <div
          data-testid="menu-dismiss-backdrop"
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-transparent"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen(false);
          }}
        />
      )}

      <div className="w-full min-h-[60px] py-1 flex items-center justify-between gap-2">
        {isSearchOpen ? (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                onSearchChange('');
              }}
              aria-label="Tutup Pencarian"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--wa-header-text)]/80 hover:bg-black/15 hover:text-[var(--wa-header-text)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama, pangkat, atau keterangan..."
              aria-label="Cari personel"
              className="flex-1 bg-transparent text-[15px] text-[var(--wa-header-text)] placeholder-[var(--wa-header-muted)] focus:outline-none py-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Hapus Kata Kunci"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--wa-header-text)]/80 hover:bg-black/15 hover:text-[var(--wa-header-text)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Left: WhatsApp-style tappable group avatar + Keterangan Apel [Nama Kompi] */}
            <button
              type="button"
              id="btn_header_photo"
              onClick={onOpenHeaderPhoto}
              aria-label={`Ubah foto dan nama ${FIXED_HEADER_PREFIX} ${headerSubtitle}`}
              title="Ketuk untuk ubah foto & tulisan satuan"
              className="flex items-center gap-2.5 min-w-0 flex-1 pl-1 py-1 rounded-xl text-left hover:bg-black/10 active:bg-black/15 transition-colors cursor-pointer"
            >
              <span
                className={`relative w-9 h-9 rounded-full overflow-hidden border border-[var(--wa-border)] shrink-0 ${
                  headerPhotoUrl ? 'bg-[var(--wa-surface)]' : 'bg-white p-0.5'
                }`}
              >
                <img
                  src={headerPhotoUrl || DEFAULT_APP_LOGO_URL}
                  alt={`Foto ${FIXED_HEADER_PREFIX} ${headerSubtitle}`}
                  className={`w-full h-full ${headerPhotoUrl ? 'object-cover' : 'object-contain'}`}
                />
              </span>
              <span className="min-w-0 flex-1">
                <h1 className="text-[14px] sm:text-[15.5px] font-bold tracking-tight text-[var(--wa-header-text)] leading-tight line-clamp-2">
                  {FIXED_HEADER_PREFIX} {headerSubtitle}
                </h1>
              </span>
            </button>

            {/* Right: Top Watermark "Artalibas Core YTP 942" right above Search Icon + 3-Dot Overflow Menu (⋮) */}
            <div className="flex flex-col items-end justify-center shrink-0 relative z-50" ref={menuRef}>
              <span
                data-testid="watermark-top"
                className="text-[8.5px] font-bold tracking-[0.08em] uppercase text-[var(--wa-header-muted)] opacity-90 leading-none pr-1.5 pt-0.5 whitespace-nowrap select-none pointer-events-none"
              >
                Artalibas Core YTP 942
              </span>
              <div className="flex items-center gap-0.5 -mt-0.5">
                <button
                  type="button"
                  id="btn_header_search"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Cari Personel"
                  title="Cari Personel"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--wa-header-text)]/85 hover:bg-black/15 hover:text-[var(--wa-header-text)] transition-colors cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    id="btn_menu_titik_tiga"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    aria-label="Menu Utama"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    title="Menu Lainnya"
                    className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--wa-header-text)]/85 hover:bg-black/15 hover:text-[var(--wa-header-text)] transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-5 h-5" />
                    {hasDuplicates && (
                      <span
                        aria-label="1 pemberitahuan duplikat"
                        className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[var(--wa-header)]"
                      />
                    )}
                  </button>

                {/* WhatsApp-style 3-Dot Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Menu Navigasi dan Pengaturan"
                    className="absolute right-0 top-12 w-72 max-w-[calc(100vw-16px)] bg-[var(--wa-card)] text-[var(--wa-text)] rounded-xl shadow-2xl border border-[var(--wa-border)] py-1 z-50 max-h-[85dvh] overflow-y-auto"
                  >
                    {/* Group 1: Laporan & Audit */}
                    <div className="py-0.5 border-b border-[var(--wa-border)]">
                      <div className="px-4 py-0.5 text-[10px] font-semibold text-[var(--wa-muted)]">
                        Laporan &amp; Audit
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onOpenExport)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-[var(--wa-accent)] shrink-0" />
                        <span className="flex-1 truncate">Format Laporan Apel (WA)</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onOpenDuplicateModal)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${
                            hasDuplicates ? 'text-amber-400' : 'text-[var(--wa-muted)]'
                          }`}
                        />
                        <span className="flex-1 truncate">Audit Duplikat</span>
                        {duplicateCount > 0 && (
                          <span className="text-[12px] font-bold text-amber-400 tabular-nums">
                            {duplicateCount}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onOpenHistory)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <History className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="flex-1 truncate">Log Riwayat</span>
                        {totalHistoryCount > 0 && (
                          <span className="text-[12px] text-[var(--wa-muted)] tabular-nums">
                            {totalHistoryCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Group 2: Atur Daftar Apel */}
                    <div className="py-0.5 border-b border-[var(--wa-border)]">
                      <div className="px-4 py-0.5 text-[10px] font-semibold text-[var(--wa-muted)]">
                        Atur Daftar Apel
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onToggleSelectionMode)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <CheckSquare
                          className={`w-4 h-4 shrink-0 ${
                            isSelectionMode ? 'text-[var(--wa-accent)]' : 'text-[var(--wa-muted)]'
                          }`}
                        />
                        <span className="flex-1 truncate">
                          {isSelectionMode ? 'Selesai Pilih Banyak' : 'Pilih Banyak Personel'}
                        </span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onResetAllToPaten)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] text-amber-400 hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="flex-1 truncate">Reset Semua ke Paten</span>
                      </button>
                    </div>

                    {/* Group 3: Master Data */}
                    <div className="py-0.5 border-b border-[var(--wa-border)]">
                      <div className="px-4 py-0.5 text-[10px] font-semibold text-[var(--wa-muted)]">
                        Master Data
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onOpenAddPersonnel)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="flex-1 truncate">Tambah Personel Paten</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onCopyApelToPaten)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="flex-1 truncate">Salin Apel ke Paten</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => runMenuAction(onOpenGoogleSheetsModal)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[var(--wa-accent)] shrink-0" />
                        <span className="flex-1 truncate">Otomasi Google Sheets</span>
                      </button>
                    </div>

                    {/* Group 4: Tampilan */}
                    <div className="py-0.5">
                      <div className="px-4 py-0.5 text-[10px] font-semibold text-[var(--wa-muted)]">
                        Tampilan
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        id="btn_menu_appearance"
                        onClick={() => runMenuAction(onOpenAppearance)}
                        className="w-full min-h-[40px] px-4 py-1.5 text-left text-[13.5px] hover:bg-[var(--wa-surface)] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <Palette className="w-4 h-4 text-[var(--wa-accent)] shrink-0" />
                        <span className="flex-1 truncate">Tema, Wallpaper &amp; Font</span>
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
