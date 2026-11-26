import React from 'react';
import { SlidersHorizontal, X, ArrowUpDown, ListFilter } from 'lucide-react';
import { MusterSummary } from '../types/personnel';
import { countActiveAdvancedFilters } from '../utils/mobileHelpers';

interface WhatsAppFilterStripProps {
  summary: MusterSummary;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedRank: string;
  selectedSubKet: string;
  searchQuery: string;
  totalFiltered: number;
  totalMaster: number;
  onOpenFilterSheet: () => void;
  onResetFilters: () => void;
  onSortPangkatNama: () => void;
  onSortKeteranganApel: () => void;
  activeSortMode?: 'pangkat' | 'keterangan' | null;
  isLightTheme?: boolean;
}

export const WhatsAppFilterStrip: React.FC<WhatsAppFilterStripProps> = ({
  summary,
  selectedStatus,
  onSelectStatus,
  selectedCategory,
  onSelectCategory,
  selectedRank,
  selectedSubKet,
  searchQuery,
  totalFiltered,
  totalMaster,
  onOpenFilterSheet,
  onResetFilters,
  onSortPangkatNama,
  onSortKeteranganApel,
  activeSortMode = null,
  isLightTheme = false,
}) => {
  const advancedCount = countActiveAdvancedFilters({ selectedRank, selectedSubKet });
  const isFiltered =
    selectedStatus !== 'Semua' ||
    selectedCategory !== 'Semua' ||
    selectedRank !== 'Semua' ||
    selectedSubKet !== 'Semua' ||
    searchQuery.trim() !== '';

  const isChipActive = (type: 'all' | 'hadir' | 'kurang' | string) => {
    if (type === 'all') return selectedStatus === 'Semua' && selectedCategory === 'Semua';
    if (type === 'hadir') return selectedStatus === 'HADIR' && selectedCategory === 'Semua';
    if (type === 'kurang') return selectedStatus === 'KURANG' && selectedCategory === 'Semua';
    return selectedCategory === type;
  };

  const handleChipClick = (type: 'all' | 'hadir' | 'kurang' | string) => {
    if (type === 'all') {
      onSelectStatus('Semua');
      onSelectCategory('Semua');
    } else if (type === 'hadir') {
      onSelectStatus('HADIR');
      onSelectCategory('Semua');
    } else if (type === 'kurang') {
      onSelectStatus('KURANG');
      onSelectCategory('Semua');
    } else {
      onSelectStatus('Semua');
      onSelectCategory(selectedCategory === type ? 'Semua' : type);
    }
  };

  const chips = [
    { key: 'all', label: `Semua ${summary.total}` },
    { key: 'hadir', label: `Hadir ${summary.hadir}` },
    { key: 'kurang', label: `Kurang ${summary.kurang}` },
    { key: 'DINAS DALAM', label: `Dinas Dalam ${summary.kategoriBreakdown['DINAS DALAM']}` },
    { key: 'DINAS LUAR', label: `Dinas Luar ${summary.kategoriBreakdown['DINAS LUAR']}` },
    { key: 'DINAS KHUSUS', label: `Dinas Khusus ${summary.kategoriBreakdown['DINAS KHUSUS']}` },
    { key: 'LAIN LAIN', label: `Lain-lain ${summary.kategoriBreakdown['LAIN LAIN']}` },
  ];

  const yellowSortClasses = isLightTheme
    ? activeSortMode === 'pangkat'
      ? 'bg-amber-200 border-amber-500 text-amber-950 ring-1 ring-amber-500/60'
      : 'bg-amber-100 border-amber-400/80 text-amber-900 hover:bg-amber-200/80'
    : activeSortMode === 'pangkat'
    ? 'bg-amber-400/28 border-amber-400 text-amber-200 ring-1 ring-amber-400/70'
    : 'bg-amber-400/18 border-amber-400/45 text-amber-300 hover:bg-amber-400/28';

  const greenSortClasses = isLightTheme
    ? activeSortMode === 'keterangan'
      ? 'bg-emerald-200 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600/60'
      : 'bg-emerald-100 border-emerald-500/75 text-emerald-900 hover:bg-emerald-200/80'
    : activeSortMode === 'keterangan'
    ? 'bg-emerald-500/28 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/70'
    : 'bg-emerald-500/18 border-emerald-400/45 text-emerald-300 hover:bg-emerald-500/28';

  return (
    <div className="bg-[var(--wa-card)]/92 backdrop-blur-xs border-b border-[var(--wa-border)] px-3 sm:px-4 py-2.5 space-y-2 transition-colors">
      <div className="flex items-center justify-between gap-2">
        {/* WhatsApp horizontal filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-0.5">
          {chips.map((chip) => {
            const active = isChipActive(chip.key);
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => handleChipClick(chip.key)}
                style={
                  active
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--wa-accent) 18%, transparent)',
                        color: 'var(--wa-accent)',
                      }
                    : undefined
                }
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 tabular-nums transition-colors cursor-pointer ${
                  active
                    ? 'font-semibold'
                    : 'bg-[var(--wa-surface)] text-[var(--wa-muted)] hover:bg-[var(--wa-surface-hover)] hover:text-[var(--wa-text)]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenFilterSheet}
            style={
              advancedCount > 0
                ? {
                    backgroundColor: 'color-mix(in srgb, var(--wa-accent) 18%, transparent)',
                    color: 'var(--wa-accent)',
                  }
                : undefined
            }
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              advancedCount > 0
                ? 'font-semibold'
                : 'bg-[var(--wa-surface)] text-[var(--wa-muted)] hover:bg-[var(--wa-surface-hover)] hover:text-[var(--wa-text)]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter{advancedCount > 0 ? ` (${advancedCount})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Symmetrical 2-Column Sort Pill Bar (Kuning & Hijau) right below filter chips & above personnel row #1 */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2" role="group" aria-label="Urutkan Daftar Personel">
        <button
          type="button"
          id="btn_sort_pangkat_nama"
          onClick={onSortPangkatNama}
          className={`min-h-[36px] w-full px-1.5 sm:px-2.5 py-1.5 rounded-full border text-[10.5px] sm:text-[11.5px] font-semibold tracking-tight inline-flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer ${yellowSortClasses}`}
        >
          <ArrowUpDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="truncate">Urutkan Pangkat &amp; Nama</span>
        </button>

        <button
          type="button"
          id="btn_sort_keterangan_apel"
          onClick={onSortKeteranganApel}
          className={`min-h-[36px] w-full px-1.5 sm:px-2.5 py-1.5 rounded-full border text-[10.5px] sm:text-[11.5px] font-semibold tracking-tight inline-flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer ${greenSortClasses}`}
        >
          <ListFilter className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="truncate">Urutkan Keterangan Apel</span>
        </button>
      </div>

      {/* Active filter summary line */}
      {isFiltered && (
        <div className="flex items-center justify-between text-[12px] text-[var(--wa-muted)] px-1">
          <span className="truncate tabular-nums">
            Menampilkan <strong className="text-[var(--wa-text)]">{totalFiltered}</strong> dari {totalMaster} personel
            {selectedRank !== 'Semua' ? ` · ${selectedRank}` : ''}
            {selectedSubKet !== 'Semua' ? ` · ${selectedSubKet}` : ''}
            {searchQuery.trim() ? ` · "${searchQuery.trim()}"` : ''}
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-[var(--wa-accent)] hover:underline font-medium shrink-0 ml-2 py-1 px-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
};
