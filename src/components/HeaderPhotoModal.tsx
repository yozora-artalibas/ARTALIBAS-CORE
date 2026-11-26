import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RotateCcw, ImagePlus, Check } from 'lucide-react';
import { compressProfilePhotoToDataUrl } from '../utils/imageUtils';
import {
  DEFAULT_HEADER_SUBTITLE,
  sanitizeHeaderSubtitle,
} from '../utils/appearanceManager';

const DEFAULT_HEADER_LOGO = '/pwa-512x512.png';

interface HeaderPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  headerSubtitle: string;
  onSavePhoto: (dataUrl: string | null) => void;
  onSaveSubtitle: (nextSubtitle: string) => void;
}

export const HeaderPhotoModal: React.FC<HeaderPhotoModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  headerSubtitle,
  onSavePhoto,
  onSaveSubtitle,
}) => {
  const [draftSubtitle, setDraftSubtitle] = useState<string>(headerSubtitle);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftSubtitle(headerSubtitle);
      setNameError(null);
      setErrorMsg(null);
    }
  }, [isOpen, headerSubtitle]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const compressed = await compressProfilePhotoToDataUrl(file, 256, 0.85);
      onSavePhoto(compressed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedRaw = draftSubtitle
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^keterangan\s+apel\b[:\-\s]*/i, '')
      .trim();
    if (!cleanedRaw) {
      setNameError('Nama setelah "Keterangan Apel" tidak boleh kosong.');
      return;
    }
    const saved = sanitizeHeaderSubtitle(cleanedRaw);
    onSaveSubtitle(saved);
    setNameError(null);
    onClose();
  };

  const quickUnits = [
    DEFAULT_HEADER_SUBTITLE,
    'Kipan A',
    'Kipan B',
    'Kipan C',
    'Kompi Bantuan',
    'Kompi Peternakan',
    'Kompi Pertanian',
    'Kompi Medis',
    'Kompi Zeni',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ubah Foto dan Header"
        className="w-full max-w-[440px] bg-[var(--wa-card)] text-[var(--wa-text)] border-t border-x border-[var(--wa-border)] rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[var(--wa-border)]" />
        </div>

        <div className="px-5 py-3 border-b border-[var(--wa-border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[var(--wa-accent)]/15 text-[var(--wa-accent)] flex items-center justify-center shrink-0">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold truncate">Ubah Foto &amp; Header</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Ubah Foto dan Header"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--wa-muted)] hover:bg-[var(--wa-surface)] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">

          {/* Photo Section */}
          <div className="p-4 rounded-2xl bg-[var(--wa-surface)] border border-[var(--wa-border)] flex flex-col items-center gap-4">
            <div className="relative">
              <div
                className={`w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--wa-accent)] shadow-lg ${
                  photoUrl ? 'bg-[var(--wa-card)]' : 'bg-white p-1.5'
                }`}
              >
                <img
                  src={photoUrl || DEFAULT_HEADER_LOGO}
                  alt="Foto Profil Header"
                  className={`w-full h-full ${photoUrl ? 'object-cover' : 'object-contain'}`}
                />
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label="Ubah foto"
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[var(--wa-accent)] text-[var(--wa-accent-text)] shadow-md flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {errorMsg && (
              <p className="text-[12.5px] text-rose-400 font-medium text-center">{errorMsg}</p>
            )}

            <div className="w-full space-y-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => inputRef.current?.click()}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[var(--wa-accent)] text-[var(--wa-accent-text)] text-[13.5px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <ImagePlus className="w-4 h-4" />
                <span>{isProcessing ? 'Menyimpan Foto...' : 'Ubah Foto'}</span>
              </button>

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => onSavePhoto(null)}
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[var(--wa-card)] hover:bg-[var(--wa-surface-hover)] border border-[var(--wa-border)] text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kembalikan ke Logo Bawaan</span>
                </button>
              )}
            </div>
          </div>

          {/* Editable Unit Name Section */}
          <form
            onSubmit={handleSaveName}
            className="p-4 rounded-2xl bg-[var(--wa-surface)] border border-[var(--wa-border)] space-y-3"
          >
            <div>
              <label
                htmlFor="input_header_unit"
                className="block text-[13.5px] font-bold mb-1.5"
              >
                Nama Kompi
              </label>
              <input
                id="input_header_unit"
                type="text"
                maxLength={40}
                value={draftSubtitle}
                onChange={(e) => {
                  setDraftSubtitle(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Contoh: Kompi Markas"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--wa-card)] border border-[var(--wa-border)] text-[14px] font-semibold text-[var(--wa-text)] placeholder-[var(--wa-muted)] focus:outline-none focus:border-[var(--wa-accent)]"
              />
              {nameError && (
                <p className="text-[12px] text-rose-400 font-medium mt-1">{nameError}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {quickUnits.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => {
                    setDraftSubtitle(unit);
                    setNameError(null);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                    draftSubtitle.trim().toLowerCase() === unit.toLowerCase()
                      ? 'border-[var(--wa-accent)] bg-[var(--wa-accent)]/15 text-[var(--wa-accent)] font-semibold'
                      : 'border-[var(--wa-border)] bg-[var(--wa-card)] text-[var(--wa-muted)] hover:text-[var(--wa-text)]'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>

            <button
              type="submit"
              id="btn_save_header_title"
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[var(--wa-accent)] text-[var(--wa-accent-text)] text-[13.5px] font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Header</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
