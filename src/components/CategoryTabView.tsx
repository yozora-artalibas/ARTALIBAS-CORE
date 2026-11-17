import React, { useState } from 'react';
import { FolderPlus, Check, Trash2, Edit2, Shield, Tag, X, Lock } from 'lucide-react';
import { isProtectedSiapOps } from '../utils/personnelLogic';

interface CategoryTabViewProps {
  categories: string[];
  onAddCategory: (newCategory: string) => void;
  onEditCategory?: (oldCategory: string, newCategory: string) => void;
  onRemoveCategory?: (category: string) => void;
  subKetList?: string[];
  onAddSubKet?: (newSubKet: string) => void;
  onRemoveSubKet?: (subKet: string) => void;
  isAdmin?: boolean;
}

export const CategoryTabView: React.FC<CategoryTabViewProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onRemoveCategory,
  subKetList = [],
  onAddSubKet,
  onRemoveSubKet,
  isAdmin = false,
}) => {
  const [innerTab, setInnerTab] = useState<'paten' | 'subket'>('paten');

  // Patent state
  const [newCat, setNewCat] = useState<string>('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Sub-ket state
  const [newSubKet, setNewSubKet] = useState<string>('');

  const filteredCategories = categories.filter((cat) => cat.trim().toUpperCase() !== 'TMMD');
  const filteredSubKetList = subKetList.filter((sk) => sk.trim().toUpperCase() !== 'TMMD');

  const handleSubmitNewCat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCat.trim().toUpperCase();
    if (!trimmed || categories.includes(trimmed)) return;
    onAddCategory(trimmed);
    setNewCat('');
  };

  const handleStartEdit = (cat: string) => {
    if (isProtectedSiapOps(cat)) return;
    setEditingCat(cat);
    setEditValue(cat);
  };

  const handleSaveEdit = (oldCat: string) => {
    if (isProtectedSiapOps(oldCat)) {
      setEditingCat(null);
      setEditValue('');
      return;
    }
    const trimmed = editValue.trim().toUpperCase();
    if (trimmed && trimmed !== oldCat && !isProtectedSiapOps(trimmed) && onEditCategory) {
      onEditCategory(oldCat, trimmed);
    }
    setEditingCat(null);
    setEditValue('');
  };

  const handleSubmitNewSubKet = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubKet.trim().toUpperCase();
    if (!trimmed || subKetList.includes(trimmed)) return;
    if (onAddSubKet) {
      onAddSubKet(trimmed);
    }
    setNewSubKet('');
  };

  return (
    <div className="w-full px-4 py-4 space-y-4">
      {/* Header Summary Card */}
      <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a884]/15 border border-[#00a884]/30 flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5 text-[#00a884]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-[#e9edef] leading-tight">
              Kelola Paten &amp; Sub Keterangan
            </h2>
            <p className="text-[12px] text-[#8696a0] mt-0.5">
              Tersinkron otomatis dengan Ubah Keterangan Apel
            </p>
          </div>
        </div>

        {/* Segmented Inner Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0b141a] border border-[#202c33]">
          <button
            type="button"
            onClick={() => setInnerTab('paten')}
            className={`min-h-[44px] px-2 py-2 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              innerTab === 'paten'
                ? 'bg-[#202c33] text-[#00a884] border border-[#2a3942]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Paten ({filteredCategories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setInnerTab('subket')}
            className={`min-h-[44px] px-2 py-2 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              innerTab === 'subket'
                ? 'bg-[#202c33] text-[#00a884] border border-[#2a3942]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span>Sub Ket ({filteredSubKetList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Keterangan Paten Organik */}
      {innerTab === 'paten' && (
        <div className="space-y-4">
          {!isAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[12px] flex items-start gap-2.5">
              <Shield className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span className="leading-relaxed">
                Mode Baca (User): Hanya Administrator Utama &amp; Admin yang berhak menambah, mengubah, atau menghapus Keterangan Paten Organik.
              </span>
            </div>
          )}

          {isAdmin && (
            <form
              onSubmit={handleSubmitNewCat}
              className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 space-y-2.5"
            >
              <label className="block text-[12px] font-semibold text-[#e9edef]">
                Tambah Keterangan Paten / Seksi Baru
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="Contoh: TON PAL, SATUAN KAWAL"
                  aria-label="Tambah keterangan paten baru"
                  className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl bg-[#202c33] border border-[#2a3942] text-[13px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884] uppercase font-mono"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl text-[13px] font-bold text-[#0b141a] bg-[#00a884] hover:bg-[#00bf96] transition-colors shrink-0 cursor-pointer"
                >
                  Tambah
                </button>
              </div>
            </form>
          )}

          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#202c33] flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-bold text-[#e9edef] uppercase tracking-wide whitespace-nowrap">
                Daftar Paten ({filteredCategories.length})
              </h3>
              <span className="text-[11px] text-[#8696a0] whitespace-nowrap shrink-0">
                {isAdmin ? 'Admin: Ubah & Hapus' : 'Mode Baca'}
              </span>
            </div>
            <div className="divide-y divide-[#202c33]">
              {filteredCategories.map((cat, idx) => {
                const isEditing = editingCat === cat;

                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 min-h-[52px]"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(cat);
                            } else if (e.key === 'Escape') {
                              setEditingCat(null);
                            }
                          }}
                          className="flex-1 min-w-0 min-h-[40px] px-2.5 py-1 bg-[#202c33] border border-[#00a884] rounded-lg text-[13px] text-[#e9edef] uppercase font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00bf96] cursor-pointer"
                          title="Simpan"
                          aria-label="Simpan perubahan paten"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCat(null)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-[#202c33] text-[#aebac1] hover:bg-[#2a3942] cursor-pointer"
                          title="Batal"
                          aria-label="Batal ubah paten"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[11px] font-mono text-[#8696a0] w-5 shrink-0 tabular-nums">
                          {idx + 1}.
                        </span>
                        <span className="text-[13.5px] font-mono font-semibold text-[#e9edef] truncate">
                          {cat}
                        </span>
                      </div>
                    )}

                    {!isEditing && isProtectedSiapOps(cat) && (
                      <span
                        title="SIAP OPS tidak dapat diubah nama atau dihapus"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00a884]/10 border border-[#00a884]/30 text-[11px] font-semibold text-[#00a884] shrink-0"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Terkunci</span>
                      </span>
                    )}

                    {!isEditing && isAdmin && !isProtectedSiapOps(cat) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-sky-400 transition-colors cursor-pointer"
                          title="Ubah nama"
                          aria-label={`Ubah ${cat}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {onRemoveCategory && (
                          <button
                            type="button"
                            onClick={() => onRemoveCategory(cat)}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-[#202c33] hover:bg-rose-900/40 text-rose-400 transition-colors cursor-pointer"
                            title="Hapus kategori paten ini"
                            aria-label={`Hapus ${cat}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Sub Keterangan Apel */}
      {innerTab === 'subket' && (
        <div className="space-y-4">
          <form
            onSubmit={handleSubmitNewSubKet}
            className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 space-y-2.5"
          >
            <label className="block text-[12px] font-semibold text-[#e9edef]">
              Tambah Sub Keterangan Apel Baru
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={newSubKet}
                onChange={(e) => setNewSubKet(e.target.value)}
                placeholder="Contoh: PIKET YON, KORVE GUDANG"
                aria-label="Tambah sub keterangan apel baru"
                className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl bg-[#202c33] border border-[#2a3942] text-[13px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884] uppercase font-mono"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-xl text-[13px] font-bold text-[#0b141a] bg-[#00a884] hover:bg-[#00bf96] transition-colors shrink-0 cursor-pointer"
              >
                Tambah
              </button>
            </div>
            <p className="text-[11px] text-[#00a884]">
              Hapus sub ket → personel otomatis masuk ke SIAP OPS
            </p>
          </form>

          <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#202c33] flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-bold text-[#e9edef] uppercase tracking-wide">
                Daftar Sub Keterangan ({filteredSubKetList.length})
              </h3>
              <span className="text-[11px] text-[#8696a0]">Urutan Baku</span>
            </div>
            <div className="divide-y divide-[#202c33]">
              {filteredSubKetList.map((sk, idx) => (
                <div
                  key={sk}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 min-h-[52px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[11px] font-mono text-[#8696a0] w-5 shrink-0 tabular-nums">
                      {idx + 1}.
                    </span>
                    <span className="text-[13.5px] font-mono font-semibold text-[#e9edef] truncate">
                      {sk}
                    </span>
                  </div>
                  {isProtectedSiapOps(sk) ? (
                    <span
                      title="SIAP OPS tidak dapat diubah nama atau dihapus"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00a884]/10 border border-[#00a884]/30 text-[11px] font-semibold text-[#00a884] shrink-0"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Terkunci</span>
                    </span>
                  ) : (
                    onRemoveSubKet && (
                      <button
                        type="button"
                        onClick={() => onRemoveSubKet(sk)}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-[#202c33] hover:bg-rose-900/40 text-rose-400 transition-colors shrink-0 cursor-pointer"
                        title="Hapus sub keterangan ini"
                        aria-label={`Hapus sub keterangan ${sk}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
