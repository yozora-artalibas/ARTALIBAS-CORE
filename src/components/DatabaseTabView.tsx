import React, { useState } from 'react';
import {
  Search,
  X,
  RotateCcw,
  UserPlus,
  FileSpreadsheet,
  Shield,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';
import { Personnel } from '../types/personnel';
import {
  getShortRankCode,
  getAvatarColorClasses,
  QUICK_APEL_PRESETS,
  QuickPresetOption,
} from '../utils/mobileHelpers';

interface DatabaseTabViewProps {
  personnelList: Personnel[];
  patentCategories: string[];
  syncedPresets?: QuickPresetOption[];
  onApplyDatabaseToApel: () => void;
  onUpdatePersonnelPaten: (id: number, newPaten: string) => void;
  onUpdatePersonnelName: (id: number, newName: string) => void;
  onUpdatePersonnelPangkat: (id: number, newPangkat: string) => void;
  onDeletePersonnel: (id: number) => void;
  onOpenAddPersonnel: () => void;
  onOpenGoogleSheetsModal: () => void;
  isAdmin: boolean;
  autoSyncEnabled: boolean;
  isGoogleConnected: boolean;
}

export const DatabaseTabView: React.FC<DatabaseTabViewProps> = ({
  personnelList,
  patentCategories,
  syncedPresets = QUICK_APEL_PRESETS,
  onApplyDatabaseToApel,
  onUpdatePersonnelPaten,
  onUpdatePersonnelName,
  onUpdatePersonnelPangkat,
  onDeletePersonnel,
  onOpenAddPersonnel,
  onOpenGoogleSheetsModal,
  isAdmin,
  autoSyncEnabled,
  isGoogleConnected,
}) => {
  const [search, setSearch] = useState<string>('');
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [editPangkat, setEditPangkat] = useState<string>('');
  const [editNama, setEditNama] = useState<string>('');
  const [editPaten, setEditPaten] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = personnelList.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.pangkat.toLowerCase().includes(q) ||
      p.keterangan_paten.toLowerCase().includes(q)
    );
  });

  const openEditor = (p: Personnel) => {
    setEditingPerson(p);
    setEditPangkat(p.pangkat);
    setEditNama(p.nama);
    setEditPaten(p.keterangan_paten);
    setConfirmDeleteId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    if (editNama.trim()) onUpdatePersonnelName(editingPerson.id, editNama.trim());
    if (editPangkat.trim()) onUpdatePersonnelPangkat(editingPerson.id, editPangkat.trim());
    if (editPaten.trim()) onUpdatePersonnelPaten(editingPerson.id, editPaten.trim().toUpperCase());
    setEditingPerson(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Header & Quick Controls */}
      <div className="bg-[var(--wa-card)]/95 border border-[var(--wa-border)] rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--wa-text)]">
              Database Personel Paten
            </h2>
            <p className="text-[12px] text-[var(--wa-muted)] tabular-nums">
              {personnelList.length} personel organik terdaftar
            </p>
          </div>
          {!isAdmin && (
            <span className="text-[11px] text-amber-400 inline-flex items-center gap-1 shrink-0">
              <Shield className="w-3.5 h-3.5" />
              <span>Mode Baca</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={onApplyDatabaseToApel}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--wa-accent)] hover:opacity-95 text-[var(--wa-accent-text)] text-[13px] font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Terapkan ke Apel</span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAddPersonnel}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--wa-surface)] hover:bg-[var(--wa-surface-hover)] text-[var(--wa-text)] text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[var(--wa-accent)]" />
              <span>Tambah Personel</span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenGoogleSheetsModal}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--wa-surface)] hover:bg-[var(--wa-surface-hover)] text-[var(--wa-text)] text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[var(--wa-accent)]" />
              <span>
                Google Sheets{autoSyncEnabled && isGoogleConnected ? ' (Aktif)' : ''}
              </span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--wa-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, pangkat, atau paten..."
            className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-xl bg-[var(--wa-surface)] text-[14px] text-[var(--wa-text)] placeholder-[var(--wa-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--wa-accent)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Hapus pencarian database"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[var(--wa-muted)] hover:text-[var(--wa-text)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Personnel Patent List */}
      <div className="bg-[var(--wa-card)]/95 border border-[var(--wa-border)] rounded-2xl overflow-hidden divide-y divide-[var(--wa-border)]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[var(--wa-muted)]">
            Tidak ada data personel paten yang cocok.
          </div>
        ) : (
          filtered.map((person, idx) => {
            const shortRank = getShortRankCode(person.pangkat);
            const avatarClasses = getAvatarColorClasses(person.pangkat);
            return (
              <div
                key={person.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--wa-surface)]/50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-[#111b21] ${avatarClasses}`}
                >
                  {shortRank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[var(--wa-text)] truncate">
                    {person.pangkat} {person.nama}
                  </div>
                  <div className="text-[12px] text-[var(--wa-muted)] truncate tabular-nums">
                    #{idx + 1} · Paten:{' '}
                    <span className="text-[var(--wa-accent)] font-medium">
                      {person.keterangan_paten}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditor(person)}
                      aria-label={`Edit paten ${person.nama}`}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-[var(--wa-surface)] hover:text-[var(--wa-text)] cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {confirmDeleteId === person.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDeletePersonnel(person.id);
                          setConfirmDeleteId(null);
                        }}
                        className="min-h-[36px] px-2.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Hapus?
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(person.id)}
                        aria-label={`Hapus ${person.nama} dari database`}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Patent Bottom Sheet */}
      {editingPerson && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs"
          onClick={() => setEditingPerson(null)}
        >
          <div
            className="w-full max-w-[440px] bg-[var(--wa-card)] text-[var(--wa-text)] border-t border-x border-[var(--wa-border)] rounded-t-3xl p-5 space-y-4 shadow-2xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold">Edit Data Paten Personel</h3>
              <button
                type="button"
                onClick={() => setEditingPerson(null)}
                aria-label="Tutup Editor Paten"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-[var(--wa-surface)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--wa-muted)] mb-1">
                  Pangkat
                </label>
                <input
                  type="text"
                  required
                  value={editPangkat}
                  onChange={(e) => setEditPangkat(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--wa-surface)] border border-[var(--wa-border)] text-[14px] text-[var(--wa-text)] focus:outline-none focus:border-[var(--wa-accent)]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[var(--wa-muted)] mb-1">
                  Nama Personel
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--wa-surface)] border border-[var(--wa-border)] text-[14px] text-[var(--wa-text)] focus:outline-none focus:border-[var(--wa-accent)]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[var(--wa-muted)] mb-1.5">
                  Keterangan Paten Organik (Sinkron Apel &amp; Sub Ket)
                </label>
                <div className="max-h-44 overflow-y-auto flex flex-wrap gap-1.5 mb-2.5 pr-0.5">
                  {syncedPresets
                    .filter((p) => p.subKet !== 'KOSONG' && p.subKet !== 'TMMD')
                    .map((preset) => {
                      const isActive = editPaten.trim().toUpperCase() === preset.subKet.toUpperCase();
                      return (
                        <button
                          key={preset.subKet}
                          type="button"
                          onClick={() => setEditPaten(preset.subKet)}
                          className={`min-h-[38px] max-w-full px-3 py-1.5 rounded-lg text-[12px] font-semibold text-left inline-flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[var(--wa-accent)] text-[var(--wa-accent-text)]'
                              : 'bg-[var(--wa-surface)] text-[var(--wa-text)] hover:bg-[var(--wa-surface-hover)]'
                          }`}
                        >
                          <span className="whitespace-normal break-words leading-snug">{preset.label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                </div>
                <input
                  type="text"
                  list="db-tab-paten-list"
                  required
                  value={editPaten}
                  onChange={(e) => setEditPaten(e.target.value.toUpperCase())}
                  placeholder="Atau ketik keterangan paten..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--wa-surface)] border border-[var(--wa-border)] text-[14px] text-[var(--wa-text)] placeholder-[var(--wa-muted)] placeholder:normal-case uppercase font-mono focus:outline-none focus:border-[var(--wa-accent)]"
                />
                <datalist id="db-tab-paten-list">
                  {syncedPresets
                    .filter((p) => p.subKet !== 'KOSONG' && p.subKet !== 'TMMD')
                    .map((p) => (
                      <option key={p.subKet} value={p.subKet} />
                    ))}
                  {patentCategories
                    .filter((c) => c.trim().toUpperCase() !== 'TMMD')
                    .map((c) => (
                      <option key={`pat-${c}`} value={c} />
                    ))}
                  <option value="LAIN LAIN" />
                </datalist>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="min-h-[44px] px-4 rounded-xl bg-[var(--wa-surface)] text-[var(--wa-text)] text-[14px] font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-[var(--wa-accent)] hover:opacity-95 text-[var(--wa-accent-text)] text-[14px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
