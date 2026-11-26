import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_PERSONNEL_DATABASE,
  INITIAL_KETERANGAN_PATEN_LIST,
} from './data/initialData';
import {
  Personnel,
  KategoriDinas,
  ChangeHistoryEntry,
  ChatMessage,
} from './types/personnel';
import {
  calculateMusterSummary,
  sortPersonnel,
  sortPersonnelByKeteranganApel,
  resetAllToPaten,
  parseNlpCommand,
  inferCategoryAndStatus,
  movePersonnelRow,
  getRankLevel,
  reassignSubKetToSiapOps,
  insertSubKetInOrder,
  insertPatentInOrder,
  isProtectedSiapOps,
} from './utils/personnelLogic';
import {
  INITIAL_CHANGE_HISTORY,
  createHistoryEntry,
  generateDiffHistory,
} from './utils/historyManager';
import {
  loadPersonnelFromStorage,
  savePersonnelToStorage,
  loadPatentCategoriesFromStorage,
  savePatentCategoriesToStorage,
  loadSubKetListFromStorage,
  saveSubKetListToStorage,
  loadHistoryFromStorage,
  saveHistoryToStorage,
} from './utils/storageManager';
import {
  AppearanceSettings,
  loadAppearanceSettings,
  saveAppearanceSettings,
  loadHeaderPhoto,
  saveHeaderPhoto,
  loadHeaderSubtitle,
  saveHeaderSubtitle,
  getThemeById,
  getFontById,
  buildAppearanceCssVars,
  buildWhatsAppPatternDataUrl,
} from './utils/appearanceManager';
import { Header } from './components/Header';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { WhatsAppFilterStrip } from './components/WhatsAppFilterStrip';
import { FilterSheetModal } from './components/FilterSheetModal';
import { PersonnelChatList } from './components/PersonnelChatList';
import { PersonnelActionSheet } from './components/PersonnelActionSheet';
import { SummaryTabView } from './components/SummaryTabView';
import { DatabaseTabView } from './components/DatabaseTabView';
import { buildSyncedApelOptions } from './utils/mobileHelpers';
import { AlertBanner } from './components/AlertBanner';
import { PersonnelModal } from './components/PersonnelModal';
import { QuickMoveModal } from './components/QuickMoveModal';
import { CategoryTabView } from './components/CategoryTabView';
import { DuplicateResolverModal } from './components/DuplicateResolverModal';
import { ExportApelModal } from './components/ExportApelModal';
import { HistoryModal } from './components/HistoryModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { AppearanceModal } from './components/AppearanceModal';
import { HeaderPhotoModal } from './components/HeaderPhotoModal';
import { SplashScreen } from './components/SplashScreen';
import { User } from 'firebase/auth';
import {
  initGoogleAuth,
  googleSignIn,
  googleLogout,
} from './services/googleSheetsAuth';
import {
  fetchPersonnelFromSheet,
  hasPersonnelChanges,
  parseSpreadsheetId,
} from './services/googleSheetsService';
import { Check, Info, AlertCircle, FileText, ArrowRightLeft, WifiOff } from 'lucide-react';

const STORAGE_KEY_GSHEET_URL = 'KIMA_GSHEET_URL_V3';
const STORAGE_KEY_GSHEET_TAB = 'KIMA_GSHEET_TAB_V3';
const STORAGE_KEY_GSHEET_AUTOSYNC = 'KIMA_GSHEET_AUTOSYNC_V3';
const STORAGE_KEY_GSHEET_LAST_SYNC = 'KIMA_GSHEET_LAST_SYNC_V3';

export default function App() {
  // Appearance (Theme, Wallpaper, 10 Fonts) & Custom Header Photo
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(() =>
    loadAppearanceSettings()
  );
  const [headerPhotoUrl, setHeaderPhotoUrl] = useState<string | null>(() => loadHeaderPhoto());
  const [headerSubtitle, setHeaderSubtitle] = useState<string>(() => loadHeaderSubtitle());
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState<boolean>(false);
  const [isHeaderPhotoModalOpen, setIsHeaderPhotoModalOpen] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Master persistent state - pre-sorted by rank & name automatically on initial load
  const [personnelList, setPersonnelList] = useState<Personnel[]>(() => sortPersonnel(loadPersonnelFromStorage()));
  const [patentCategories, setPatentCategories] = useState<string[]>(() => loadPatentCategoriesFromStorage());
  const [subKetList, setSubKetList] = useState<string[]>(() => loadSubKetListFromStorage());
  const [historyEntries, setHistoryEntries] = useState<ChangeHistoryEntry[]>(() => loadHistoryFromStorage());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Automatically persist any data updates to localStorage
  useEffect(() => {
    savePersonnelToStorage(personnelList);
  }, [personnelList]);

  useEffect(() => {
    savePatentCategoriesToStorage(patentCategories);
  }, [patentCategories]);

  useEffect(() => {
    saveSubKetListToStorage(subKetList);
  }, [subKetList]);

  useEffect(() => {
    saveHistoryToStorage(historyEntries);
  }, [historyEntries]);

  // Filter state
  const [selectedRank, setSelectedRank] = useState<string>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedSubKet, setSelectedSubKet] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals visibility
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState<boolean>(false);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);

  const [isQuickMoveOpen, setIsQuickMoveOpen] = useState<boolean>(false);
  const [quickMoveTarget, setQuickMoveTarget] = useState<Personnel | null>(null);

  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historySelectedPersonnel, setHistorySelectedPersonnel] = useState<Personnel | null>(null);

  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // WhatsApp-style Mobile-Native Navigation & Sheets State
  const [activeTab, setActiveTab] = useState<ActiveTab>('apel');
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [actionSheetTarget, setActionSheetTarget] = useState<{ person: Personnel; index: number } | null>(null);
  const [activeSortMode, setActiveSortMode] = useState<'pangkat' | 'keterangan' | null>('pangkat');

  // Google Sheets Live Auto-Sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [savedSheetUrl, setSavedSheetUrl] = useState<string>(() => localStorage.getItem(STORAGE_KEY_GSHEET_URL) || '');
  const [savedSheetTab, setSavedSheetTab] = useState<string>(() => localStorage.getItem(STORAGE_KEY_GSHEET_TAB) || '');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY_GSHEET_AUTOSYNC) !== 'false');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_GSHEET_LAST_SYNC) || null);
  const isLiveSyncingRef = useRef<boolean>(false);

  // Chatbot drawer state
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'Siap! Asisten Chatbot KIMA siap membantu pengecekan dan pengaturan apel harian.\n\nContoh perintah:\n• "masukan Prada .../ Serda ... ke keterangan siapops"\n• "kembalikan semua personel ke keterangan paten"\n• "tampilkan personel pangkat Serda"\n• "cek kelengkapan apel"\n• "cek data personel ganda maupun kurang"\n• Atau tempel pesan apel WA berformat "Jumlah: ... Kurang: ... Keterangan: ..." untuk audit otomatis ganda, kurang, & lebih',
      timestamp: '06:00 WIB',
    },
  ]);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleUpdateAppearance = (next: AppearanceSettings) => {
    setAppearanceSettings(next);
    saveAppearanceSettings(next);
  };

  const handleSaveHeaderPhoto = (dataUrl: string | null) => {
    setHeaderPhotoUrl(dataUrl);
    saveHeaderPhoto(dataUrl);
    showToast(dataUrl ? 'Foto berhasil diperbarui.' : 'Foto dikembalikan ke logo bawaan.');
  };

  const handleSaveHeaderSubtitle = (nextSubtitle: string) => {
    const saved = saveHeaderSubtitle(nextSubtitle);
    setHeaderSubtitle(saved);
    showToast(`Tulisan header diubah menjadi "Keterangan Apel ${saved}".`);
  };

  const activeTheme = useMemo(() => getThemeById(appearanceSettings.themeId), [appearanceSettings.themeId]);
  const activeFont = useMemo(() => getFontById(appearanceSettings.fontId), [appearanceSettings.fontId]);
  const appearanceCssVars = useMemo(() => buildAppearanceCssVars(appearanceSettings), [appearanceSettings]);
  const patternUrl = useMemo(
    () =>
      activeTheme.hasPattern
        ? buildWhatsAppPatternDataUrl(activeTheme.patternColor, activeTheme.isLight ? 0.55 : 0.45)
        : 'none',
    [activeTheme]
  );

  // Muster summary calculation
  const summary = useMemo(() => {
    return calculateMusterSummary(personnelList);
  }, [personnelList]);

  // Dynamically compute unique ranks
  const availableRanks = useMemo(() => {
    const standardOrder = ['Letda', 'Serka', 'Serma', 'Sertu', 'Serda', 'Kopka', 'Koptu', 'Kopda', 'Praka', 'Pratu', 'Prada'];
    const ranksPresent = new Set<string>();

    personnelList.forEach((p) => {
      const firstWord = p.pangkat.split(' ')[0].trim();
      if (firstWord) ranksPresent.add(firstWord);
      if (p.pangkat.trim()) ranksPresent.add(p.pangkat.trim());
    });

    const list: string[] = ['Semua'];
    standardOrder.forEach((r) => {
      if (ranksPresent.has(r) || personnelList.some((p) => p.pangkat.toLowerCase().includes(r.toLowerCase()))) {
        list.push(r);
      }
    });

    ranksPresent.forEach((r) => {
      if (!list.includes(r) && !standardOrder.some((s) => r.toLowerCase().startsWith(s.toLowerCase()))) {
        list.push(r);
      }
    });

    return list;
  }, [personnelList]);

  // Dynamically compute sub-keterangan options for FilterBar
  const availableSubKet = useMemo(() => {
    const set = new Set<string>();
    set.add('SIAP OPS');
    subKetList.forEach((sk) => set.add(sk.toUpperCase()));
    personnelList.forEach((p) => {
      if (p.sub_keterangan_saat_ini && p.sub_keterangan_saat_ini !== 'KOSONG') {
        set.add(p.sub_keterangan_saat_ini.toUpperCase());
      }
    });
    patentCategories.forEach((c) => {
      if (c) set.add(c.toUpperCase());
    });
    const sorted = Array.from(set).sort((a, b) => {
      if (a === 'SIAP OPS') return -1;
      if (b === 'SIAP OPS') return 1;
      return a.localeCompare(b);
    });
    return ['Semua', ...sorted];
  }, [personnelList, patentCategories, subKetList]);

  // Filtered personnel calculation
  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((person) => {
      if (selectedRank !== 'Semua') {
        if (!person.pangkat.toLowerCase().includes(selectedRank.toLowerCase())) {
          return false;
        }
      }

      if (selectedCategory !== 'Semua') {
        if (person.kategori_saat_ini !== selectedCategory) {
          return false;
        }
      }

      if (selectedSubKet !== 'Semua') {
        if (person.sub_keterangan_saat_ini.toUpperCase() !== selectedSubKet.toUpperCase()) {
          return false;
        }
      }

      if (selectedStatus !== 'Semua') {
        if (person.status_dinas !== selectedStatus) {
          return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inName = person.nama.toLowerCase().includes(q);
        const inRank = person.pangkat.toLowerCase().includes(q);
        const inSub = person.sub_keterangan_saat_ini.toLowerCase().includes(q);
        const inPaten = person.keterangan_paten.toLowerCase().includes(q);
        const inCat = (person.catatan || '').toLowerCase().includes(q);
        if (!inName && !inRank && !inSub && !inPaten && !inCat) {
          return false;
        }
      }

      return true;
    });
  }, [personnelList, selectedRank, selectedCategory, selectedSubKet, selectedStatus, searchQuery]);

  // Action: Reset All to Patent
  const handleResetAllToPaten = () => {
    const updated = resetAllToPaten(personnelList).map((p) => ({
      ...p,
      updatedAt: new Date().toISOString(),
    }));

    const newLogs: ChangeHistoryEntry[] = [];
    const actor = 'Operator KIMA';
    personnelList.forEach((oldP, idx) => {
      const newP = updated[idx];
      if (
        oldP.sub_keterangan_saat_ini !== newP.sub_keterangan_saat_ini ||
        oldP.kategori_saat_ini !== newP.kategori_saat_ini ||
        oldP.status_dinas !== newP.status_dinas
      ) {
        newLogs.push(
          createHistoryEntry(
            newP,
            'RESET_PATEN',
            'Sub Keterangan & Status',
            `${oldP.sub_keterangan_saat_ini} (${oldP.status_dinas})`,
            `${newP.sub_keterangan_saat_ini} (${newP.status_dinas})`,
            actor,
            'Reset massal ke penugasan paten organik'
          )
        );
      }
    });

    setPersonnelList(updated);
    if (newLogs.length > 0) {
      setHistoryEntries((prev) => [...newLogs, ...prev]);
    }

    showToast(`Seluruh personel (${updated.length} orang) berhasil dikembalikan ke keterangan paten.`);
  };

  // Sort Action 1: Urutkan sesuai Pangkat & Nama
  const handleSortPangkatNama = () => {
    const sorted = sortPersonnel(personnelList);
    setPersonnelList(sorted);
    setActiveSortMode('pangkat');
    showToast('Data berhasil diubah sesuai Pangkat & Nama');
  };

  // Sort Action 2: Urutkan sesuai Keterangan Apel
  const handleSortKeteranganApel = () => {
    const sorted = sortPersonnelByKeteranganApel(personnelList);
    setPersonnelList(sorted);
    setActiveSortMode('keterangan');
    showToast('Data berhasil diubah sesuai Keterangan Apel');
  };

  // Action: Update Personnel Name
  const handleUpdatePersonnelName = (id: number, newName: string) => {
    const target = personnelList.find((p) => p.id === id);
    if (!target || target.nama === newName) return;

    const oldName = target.nama;
    const actor = 'Operator KIMA';
    const updated = personnelList.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          nama: newName,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const log = createHistoryEntry(
      { ...target, nama: newName },
      'EDIT_LENGKAP',
      'Nama Personel',
      oldName,
      newName,
      actor,
      'Perubahan nama personel'
    );

    setPersonnelList(updated);
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`Nama personel berhasil diubah menjadi "${newName}".`);
  };

  // Action: Update Personnel Pangkat
  const handleUpdatePersonnelPangkat = (id: number, newPangkat: string) => {
    const target = personnelList.find((p) => p.id === id);
    if (!target || target.pangkat === newPangkat) return;

    const oldPangkat = target.pangkat;
    const newLevel = getRankLevel(newPangkat);
    const actor = 'Operator KIMA';
    const updated = personnelList.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          pangkat: newPangkat,
          pangkat_level: newLevel,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const log = createHistoryEntry(
      { ...target, pangkat: newPangkat, pangkat_level: newLevel },
      'EDIT_LENGKAP',
      'Pangkat Personel',
      oldPangkat,
      newPangkat,
      actor,
      'Perubahan pangkat personel'
    );

    setPersonnelList(updated);
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`Pangkat ${target.nama} berhasil diubah menjadi "${newPangkat}".`);
  };

  // Action: Update Personnel Sub Keterangan
  const handleUpdatePersonnelSubKet = (id: number, newSubKet: string) => {
    const target = personnelList.find((p) => p.id === id);
    if (!target || target.sub_keterangan_saat_ini === newSubKet) return;

    const oldSub = target.sub_keterangan_saat_ini;
    const { category, status } = inferCategoryAndStatus(newSubKet);
    const actor = 'Operator KIMA';
    const upperSub = newSubKet.trim().toUpperCase();
    if (upperSub && upperSub !== 'KOSONG' && upperSub !== 'TMMD' && !subKetList.includes(upperSub)) {
      setSubKetList((prev) => [...prev, upperSub]);
    }

    const updated = personnelList.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          sub_keterangan_saat_ini: newSubKet,
          kategori_saat_ini: category,
          status_dinas: status,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const log = createHistoryEntry(
      { ...target, sub_keterangan_saat_ini: newSubKet, kategori_saat_ini: category, status_dinas: status },
      'UBAH_SUB_KETERANGAN',
      'Sub Keterangan & Status',
      `${oldSub} (${target.status_dinas})`,
      `${newSubKet} (${status})`,
      actor,
      'Perubahan langsung sub-keterangan apel'
    );

    setPersonnelList(updated);
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`Sub keterangan ${target.pangkat} ${target.nama} diubah ke "${newSubKet}".`);
  };

  // Action: Update Personnel Paten
  const handleUpdatePersonnelPaten = (id: number, newPaten: string) => {
    const target = personnelList.find((p) => p.id === id);
    if (!target || target.keterangan_paten === newPaten) return;

    const upperPaten = newPaten.trim().toUpperCase();
    if (upperPaten && upperPaten !== 'TMMD') {
      if (!patentCategories.includes(upperPaten)) {
        setPatentCategories((prev) => [...prev, upperPaten]);
      }
      if (!subKetList.includes(upperPaten)) {
        setSubKetList((prev) => [...prev, upperPaten]);
      }
    }

    const oldPaten = target.keterangan_paten;
    const actor = 'Operator KIMA';
    const updated = personnelList.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          keterangan_paten: newPaten,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const log = createHistoryEntry(
      { ...target, keterangan_paten: newPaten },
      'EDIT_LENGKAP',
      'Keterangan Paten Organik',
      oldPaten,
      newPaten,
      actor,
      'Perubahan keterangan paten organik di database master'
    );

    setPersonnelList(updated);
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`Keterangan paten ${target.nama} diperbarui menjadi "${newPaten}".`);
  };

  // Action: Reorder Row Position
  const handleMoveRow = (fromIndex: number, toIndex: number) => {
    const moved = movePersonnelRow(personnelList, fromIndex, toIndex);
    setPersonnelList(moved);
    showToast(`Posisi baris nomor ${fromIndex + 1} dipindahkan ke urutan ${toIndex + 1}.`);
  };

  // Action: Edit/Rename Patent Category (also synced with Sub Keterangan & Apel)
  const handleEditCategory = (oldCat: string, newCat: string) => {
    if (isProtectedSiapOps(oldCat) || isProtectedSiapOps(newCat)) {
      showToast('Keterangan SIAP OPS bersifat baku dan tidak dapat diubah namanya.', 'warning');
      return;
    }

    const updatedCategories = patentCategories.map((c) => (c === oldCat ? newCat : c));
    setPatentCategories(updatedCategories);
    setSubKetList((prev) => {
      const renamed = prev.map((s) => (s === oldCat ? newCat : s));
      return renamed.includes(newCat) ? renamed : [...renamed, newCat];
    });

    const updatedPersonnel = personnelList.map((p) => {
      let changed = false;
      let pPaten = p.keterangan_paten;
      let pSub = p.sub_keterangan_saat_ini;
      if (pPaten === oldCat) {
        pPaten = newCat;
        changed = true;
      }
      if (pSub === oldCat) {
        pSub = newCat;
        changed = true;
      }
      return changed
        ? { ...p, keterangan_paten: pPaten, sub_keterangan_saat_ini: pSub, updatedAt: new Date().toISOString() }
        : p;
    });

    setPersonnelList(updatedPersonnel);
    showToast(`Keterangan paten "${oldCat}" berhasil diubah menjadi "${newCat}".`);
  };

  // Action: Remove Patent Category (also synced with Sub Keterangan; move affected apel personnel to SIAP OPS)
  const handleRemoveCategory = (cat: string) => {
    if (isProtectedSiapOps(cat)) {
      showToast('Keterangan SIAP OPS bersifat baku dan tidak dapat dihapus.', 'warning');
      return;
    }

    const updatedCategories = patentCategories.filter((c) => c !== cat);
    setPatentCategories(updatedCategories);
    setSubKetList((prev) => prev.filter((s) => s !== cat));

    const withUpdatedPaten = personnelList.map((p) => {
      if (p.keterangan_paten === cat) {
        return { ...p, keterangan_paten: 'LAIN LAIN', updatedAt: new Date().toISOString() };
      }
      return p;
    });

    const { updated, movedIds, movedCount } = reassignSubKetToSiapOps(withUpdatedPaten, cat);
    setPersonnelList(updated);

    if (movedCount > 0) {
      const actor = 'Operator KIMA';
      const movedSet = new Set(movedIds);
      const logs = withUpdatedPaten
        .filter((p) => movedSet.has(p.id))
        .map((p) =>
          createHistoryEntry(
            p,
            'UBAH_SUB_KETERANGAN',
            'Sub Keterangan & Kategori',
            `${p.sub_keterangan_saat_ini} (${p.kategori_saat_ini})`,
            'SIAP OPS (SIAP OPS)',
            actor,
            `Sub keterangan "${cat}" dihapus → otomatis masuk SIAP OPS`
          )
        );
      setHistoryEntries((prev) => [...logs, ...prev]);
      showToast(`Keterangan "${cat}" dihapus & ${movedCount} personel otomatis masuk ke SIAP OPS.`);
    } else {
      showToast(`Keterangan paten "${cat}" berhasil dihapus.`);
    }
  };

  // Action: Sub Keterangan Management (Add & Remove - preserves canonical Sub Keterangan order)
  const handleAddSubKet = (newSub: string) => {
    const upper = newSub.trim().toUpperCase();
    if (!upper || upper === 'TMMD') return;
    setSubKetList((prev) => insertSubKetInOrder(prev, upper));
    showToast(`Sub keterangan "${upper}" berhasil ditambahkan sesuai urutan menu.`);
  };

  const handleRemoveSubKet = (targetSub: string) => {
    if (isProtectedSiapOps(targetSub)) {
      showToast('Sub keterangan SIAP OPS bersifat baku dan tidak dapat dihapus.', 'warning');
      return;
    }

    const updatedSubList = subKetList.filter((sk) => sk !== targetSub);
    setSubKetList(updatedSubList);

    const { updated, movedIds, movedCount } = reassignSubKetToSiapOps(personnelList, targetSub);
    if (movedCount > 0) {
      const actor = 'Operator KIMA';
      const movedSet = new Set(movedIds);
      const logs = personnelList
        .filter((p) => movedSet.has(p.id))
        .map((p) =>
          createHistoryEntry(
            p,
            'UBAH_SUB_KETERANGAN',
            'Sub Keterangan & Kategori',
            `${p.sub_keterangan_saat_ini} (${p.kategori_saat_ini})`,
            'SIAP OPS (SIAP OPS)',
            actor,
            `Sub keterangan "${targetSub}" dihapus → otomatis masuk SIAP OPS`
          )
        );
      setPersonnelList(updated);
      setHistoryEntries((prev) => [...logs, ...prev]);
      showToast(`Sub keterangan "${targetSub}" dihapus & ${movedCount} personel otomatis masuk ke SIAP OPS.`);
    } else {
      showToast(`Sub keterangan "${targetSub}" berhasil dihapus & disinkronkan.`);
    }
  };

  // Action: Save Personnel (Add or Edit)
  const handleSavePersonnel = (person: Personnel) => {
    const existingIndex = personnelList.findIndex((p) => p.id === person.id);
    const actor = 'Operator KIMA';

    if (existingIndex >= 0) {
      const oldPerson = personnelList[existingIndex];
      const safePerson = person;

      const diffLogs = generateDiffHistory(oldPerson, safePerson, actor, 'EDIT_LENGKAP');

      const updated = [...personnelList];
      updated[existingIndex] = {
        ...safePerson,
        updatedAt: new Date().toISOString(),
      };
      setPersonnelList(updated);

      if (diffLogs.length > 0) {
        setHistoryEntries((prev) => [...diffLogs, ...prev]);
      }
      showToast(`Data personel ${safePerson.pangkat} ${safePerson.nama} berhasil diperbarui.`);
    } else {
      const newPersonWithTime = {
        ...person,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const log = createHistoryEntry(
        newPersonWithTime,
        'TAMBAH_BARU',
        'Personel Baru',
        '-',
        `${person.pangkat} ${person.nama} (${person.sub_keterangan_saat_ini})`,
        actor,
        'Penambahan total paten personel baru'
      );

      const updated = [newPersonWithTime, ...personnelList];
      setPersonnelList(updated);
      setHistoryEntries((prev) => [log, ...prev]);
      showToast(`Personel baru ${person.pangkat} ${person.nama} berhasil ditambahkan ke total paten.`);
    }
  };

  // Action: Delete Personnel
  const handleDeletePersonnel = (id: number) => {
    const target = personnelList.find((p) => p.id === id);
    if (!target) return;

    const actor = 'Operator KIMA';
    const log = createHistoryEntry(
      target,
      'EDIT_LENGKAP',
      'Penghapusan Personel',
      `${target.pangkat} ${target.nama}`,
      '(Dihapus)',
      actor,
      'Penghapusan slot personel'
    );

    const updated = personnelList.filter((p) => p.id !== id);
    setPersonnelList(updated);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`Personel ${target.pangkat} ${target.nama} berhasil dihapus.`);
  };

  // Action: Copy All Current Apel Status to Patent Database
  const handleCopyApelToPaten = () => {
    const now = new Date().toISOString();
    const actor = 'Operator KIMA';
    const newLogs: ChangeHistoryEntry[] = [];
    const newPatenSet = new Set(patentCategories);

    const updated = personnelList.map((p) => {
      const oldPaten = p.keterangan_paten;
      const newPaten = p.sub_keterangan_saat_ini;

      if (newPaten && !newPatenSet.has(newPaten)) {
        newPatenSet.add(newPaten);
      }

      if (oldPaten !== newPaten) {
        newLogs.push(
          createHistoryEntry(
            p,
            'UBAH_PATEN',
            'Keterangan Paten Organik',
            oldPaten,
            newPaten,
            actor,
            `Pemindahan Keterangan Apel ("${newPaten}") ke Database Keterangan Paten Organik`
          )
        );
      }

      return {
        ...p,
        keterangan_paten: newPaten,
        updatedAt: now,
      };
    });

    const updatedPatentCategories = Array.from(newPatenSet);
    setPersonnelList(updated);
    setPatentCategories(updatedPatentCategories);
    savePersonnelToStorage(updated);
    savePatentCategoriesToStorage(updatedPatentCategories);

    if (newLogs.length > 0) {
      setHistoryEntries((prev) => [...newLogs, ...prev]);
    }

    showToast('Seluruh data keterangan apel berhasil dipindahkan ke keterangan paten database master.', 'success');
  };

  // Google Sheets Auth Handlers
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        showToast(`Akun Google ${res.user.email} berhasil terhubung.`);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghubungkan akun Google.', 'warning');
    }
  };

  const handleGoogleSignOut = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    showToast('Koneksi akun Google berhasil diputuskan.', 'info');
  };

  const handleSaveSheetUrl = (url: string) => {
    setSavedSheetUrl(url);
    localStorage.setItem(STORAGE_KEY_GSHEET_URL, url);
  };

  const handleSaveSheetTab = (tab: string) => {
    setSavedSheetTab(tab);
    localStorage.setItem(STORAGE_KEY_GSHEET_TAB, tab);
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem(STORAGE_KEY_GSHEET_AUTOSYNC, String(enabled));
    if (enabled) {
      showToast('Auto-Sync Google Sheets aktif. Database paten akan otomatis diperbarui setiap kali ada perubahan di Google Sheet.', 'success');
    } else {
      showToast('Auto-Sync Google Sheets dinonaktifkan.', 'info');
    }
  };

  // Apply Live Sheet Data to Patent Database
  const handleApplySheetData = (newPersonnel: Personnel[], newCategories: string[]) => {
    const now = new Date().toISOString();
    const sorted = sortPersonnel(newPersonnel);
    setPersonnelList(sorted);
    savePersonnelToStorage(sorted);

    if (newCategories.length > 0) {
      const catSet = new Set(patentCategories);
      newCategories.forEach((c) => catSet.add(c));
      const updatedCats = Array.from(catSet);
      setPatentCategories(updatedCats);
      savePatentCategoriesToStorage(updatedCats);
    }

    setLastSyncTime(now);
    localStorage.setItem(STORAGE_KEY_GSHEET_LAST_SYNC, now);

    const log = createHistoryEntry(
      sorted[0] || personnelList[0],
      'UBAH_PATEN',
      'Sinkronisasi Google Sheets',
      `${personnelList.length} Personel`,
      `${sorted.length} Personel`,
      googleUser?.email || 'Google Sheets Auto-Sync',
      'Sinkronisasi otomatis database paten dari Google Sheets'
    );
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`Database paten berhasil disinkronkan (${sorted.length} personel).`);
  };

  // Live Auto-Sync Routine
  const triggerLiveSheetSync = async () => {
    if (isLiveSyncingRef.current) return;
    const rawId = parseSpreadsheetId(savedSheetUrl);
    if (!rawId || !googleToken) return;

    isLiveSyncingRef.current = true;
    try {
      const tabToUse = savedSheetTab || 'Sheet1';
      const result = await fetchPersonnelFromSheet(rawId, tabToUse, googleToken, personnelList);
      if (result.personnel.length > 0 && hasPersonnelChanges(personnelList, result.personnel)) {
        handleApplySheetData(result.personnel, result.categories);
      }
    } catch (err) {
      console.warn('Auto-sync live poll check:', err);
    } finally {
      isLiveSyncingRef.current = false;
    }
  };

  // Google Auth Listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Live Polling & Window Focus Auto-Sync Listener
  useEffect(() => {
    if (!autoSyncEnabled || !googleToken || !savedSheetUrl.trim()) return;

    // Initial check
    triggerLiveSheetSync();

    // Check every 30 seconds
    const interval = setInterval(() => {
      triggerLiveSheetSync();
    }, 30000);

    // Immediate check whenever user switches back to this window tab
    const onWindowFocus = () => {
      triggerLiveSheetSync();
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [autoSyncEnabled, googleToken, savedSheetUrl, savedSheetTab, personnelList]);

  // Action: Quick Move (single or batch)
  const handleQuickMoveConfirm = (newSubKet: string, explicitCategory?: KategoriDinas) => {
    const { category, status } = explicitCategory
      ? { category: explicitCategory, status: explicitCategory === 'SIAP OPS' ? ('HADIR' as const) : ('KURANG' as const) }
      : inferCategoryAndStatus(newSubKet);

    const upperSub = newSubKet.trim().toUpperCase();
    if (upperSub && upperSub !== 'KOSONG' && upperSub !== 'TMMD' && !subKetList.includes(upperSub)) {
      setSubKetList((prev) => [...prev, upperSub]);
    }

    const idsToMove = quickMoveTarget ? [quickMoveTarget.id] : Array.from(selectedIds);
    if (idsToMove.length === 0) return;

    const idSet = new Set(idsToMove);
    const newLogs: ChangeHistoryEntry[] = [];
    const actor = 'Operator KIMA';

    const updated = personnelList.map((p) => {
      if (idSet.has(p.id)) {
        newLogs.push(
          createHistoryEntry(
            p,
            'UBAH_SUB_KETERANGAN',
            'Sub Keterangan & Kategori',
            `${p.sub_keterangan_saat_ini} (${p.kategori_saat_ini})`,
            `${newSubKet} (${category})`,
            actor,
            `Pemindahan status apel dinas ke ${newSubKet}`
          )
        );

        return {
          ...p,
          sub_keterangan_saat_ini: newSubKet,
          kategori_saat_ini: category,
          status_dinas: status,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setPersonnelList(updated);
    if (newLogs.length > 0) {
      setHistoryEntries((prev) => [...newLogs, ...prev]);
    }

    if (quickMoveTarget) {
      showToast(`Status ${quickMoveTarget.pangkat} ${quickMoveTarget.nama} berhasil diubah ke "${newSubKet}".`);
      setQuickMoveTarget(null);
    } else {
      showToast(`${idsToMove.length} personel berhasil dipindahkan ke "${newSubKet}".`);
      setSelectedIds(new Set());
    }
  };

  // Action: Resolve Duplicates
  const handleResolveDuplicateSingle = (name: string, chosenSubKet: string) => {
    const matches = personnelList.filter((p) => p.nama.toLowerCase() === name.toLowerCase());
    if (matches.length === 0) return;

    const { category, status } = inferCategoryAndStatus(chosenSubKet);
    const actor = 'Operator KIMA';
    const primaryId = matches[0].id;

    const updated = personnelList.map((p) => {
      if (p.id === primaryId) {
        return {
          ...p,
          sub_keterangan_saat_ini: chosenSubKet,
          kategori_saat_ini: category,
          status_dinas: status,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const log = createHistoryEntry(
      matches[0],
      'RESOLUSI_DUPLIKAT',
      'Resolusi Duplikasi',
      matches.map((m) => m.sub_keterangan_saat_ini).join(' & '),
      `${chosenSubKet} (${status})`,
      actor,
      `Resolusi nama ganda "${name}" ditetapkan ke ${chosenSubKet}`
    );

    setPersonnelList(updated);
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`Duplikat untuk "${name}" berhasil diselesaikan ke "${chosenSubKet}".`);
  };

  const handleResolveDuplicateAll = () => {
    const { duplicates } = summary;
    if (duplicates.length === 0) return;

    let updated = [...personnelList];
    const newLogs: ChangeHistoryEntry[] = [];
    const actor = 'Operator KIMA';

    duplicates.forEach((dup) => {
      const match = updated.find((p) => p.nama.toLowerCase() === dup.nama.toLowerCase());
      if (match) {
        const preferredSub = dup.posisi_tercatat[0] || match.keterangan_paten;
        const { category, status } = inferCategoryAndStatus(preferredSub);

        updated = updated.map((p) => {
          if (p.id === match.id) {
            return {
              ...p,
              sub_keterangan_saat_ini: preferredSub,
              kategori_saat_ini: category,
              status_dinas: status,
              updatedAt: new Date().toISOString(),
            };
          }
          return p;
        });

        newLogs.push(
          createHistoryEntry(
            match,
            'RESOLUSI_DUPLIKAT',
            'Resolusi Duplikasi Otomatis',
            dup.posisi_tercatat.join(' & '),
            `${preferredSub} (${status})`,
            actor,
            'Resolusi otomatis penetapan ke penugasan pertama'
          )
        );
      }
    });

    setPersonnelList(updated);
    if (newLogs.length > 0) {
      setHistoryEntries((prev) => [...newLogs, ...prev]);
    }

    showToast(`${duplicates.length} nama duplikat berhasil diselesaikan secara otomatis.`);
    setIsDuplicateModalOpen(false);
  };

  // Action: Open Individual History
  const handleOpenIndividualHistory = (person: Personnel) => {
    setHistorySelectedPersonnel(person);
    setIsHistoryModalOpen(true);
  };

  // Action: Delete Single History Entry
  const handleDeleteHistoryEntry = (id: string) => {
    const filtered = historyEntries.filter((h) => h.id !== id);
    setHistoryEntries(filtered);
    showToast('Catatan log riwayat berhasil dihapus.');
  };

  // Action: Clear All History
  const handleClearAllHistory = () => {
    setHistoryEntries([]);
    showToast('Seluruh catatan log riwayat perubahan berhasil dihapus.');
  };

  // Action: Checkbox selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (filteredPersonnel.length === 0) return;
    const allFilteredSelected = filteredPersonnel.every((p) => selectedIds.has(p.id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredPersonnel.forEach((p) => next.delete(p.id));
      } else {
        filteredPersonnel.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  // Action: Chatbot NLP Command execution
  const handleExecuteCommand = (rawText: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: rawText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    const { updatedList, result } = parseNlpCommand(rawText, personnelList);

    const assistantMsg: ChatMessage = {
      id: `bot_${Date.now()}`,
      sender: 'assistant',
      text: result.message,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      actionExecuted: result.action,
      details: result.success ? `Berhasil memproses perintah: ${result.action}` : 'Gagal memproses',
    };

    setChatMessages((prev) => [...prev, userMsg, assistantMsg]);

    if (result.success) {
      if (result.action === 'ASSIGN_SUB_KETERANGAN' || result.action === 'RESET_ALL_TO_PATEN') {
        setPersonnelList(updatedList);
        const log = createHistoryEntry(
          updatedList[0] || personnelList[0],
          'PERINTAH_CHATBOT',
          'Perintah Asisten Chatbot',
          '-',
          rawText,
          'Chatbot KIMA',
          result.message
        );
        setHistoryEntries((prev) => [log, ...prev]);
      } else if (result.action === 'FILTER_BY_RANK') {
        setSelectedRank(result.data.targetRank);
      } else if (result.action === 'FILTER_BY_CATEGORY') {
        setSelectedCategory(result.data.targetCategory);
      } else if (result.action === 'REPORT_EXPORT') {
        setIsExportModalOpen(true);
      } else if (result.action === 'CHECK_DUPLICATES') {
        setIsDuplicateModalOpen(true);
      }
      showToast(result.message);
    } else {
      showToast(result.message, 'warning');
    }

    return {
      success: result.success,
      message: result.message,
      action: result.action,
    };
  };

  const handleQuickAssignFromSheet = (personId: number, newSubKet: string, explicitCategory?: KategoriDinas) => {
    const target = personnelList.find((p) => p.id === personId);
    if (!target) return;

    const { category, status } = explicitCategory
      ? { category: explicitCategory, status: explicitCategory === 'SIAP OPS' ? ('HADIR' as const) : ('KURANG' as const) }
      : inferCategoryAndStatus(newSubKet);

    const upperSub = newSubKet.trim().toUpperCase();
    if (upperSub && upperSub !== 'KOSONG' && upperSub !== 'TMMD' && !subKetList.includes(upperSub)) {
      setSubKetList((prev) => [...prev, upperSub]);
    }

    const actor = 'Operator KIMA';
    const updated = personnelList.map((p) =>
      p.id === personId
        ? {
            ...p,
            sub_keterangan_saat_ini: newSubKet,
            kategori_saat_ini: category,
            status_dinas: status,
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    const log = createHistoryEntry(
      target,
      'UBAH_SUB_KETERANGAN',
      'Sub Keterangan & Kategori',
      `${target.sub_keterangan_saat_ini} (${target.kategori_saat_ini})`,
      `${newSubKet} (${category})`,
      actor,
      `Pemindahan cepat ke ${newSubKet}`
    );

    setPersonnelList(updated);
    setHistoryEntries((prev) => [log, ...prev]);
    showToast(`${target.pangkat} ${target.nama} dipindahkan ke "${newSubKet}".`);
  };

  const syncedApelPresets = useMemo(
    () => buildSyncedApelOptions(subKetList, patentCategories),
    [subKetList, patentCategories]
  );

  const isAdmin = true;

  const resetAllFilters = () => {
    setSelectedRank('Semua');
    setSelectedCategory('Semua');
    setSelectedSubKet('Semua');
    setSelectedStatus('Semua');
    setSearchQuery('');
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050a0d] flex justify-center overflow-hidden">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div
        style={{
          ...(appearanceCssVars as React.CSSProperties),
          fontFamily: activeFont.fontFamily,
          backgroundColor: 'var(--wa-bg)',
          color: 'var(--wa-text)',
        }}
        className="relative w-full max-w-[440px] h-full flex flex-col overflow-hidden md:border-x md:border-[var(--wa-border)] md:shadow-2xl selection:bg-[var(--wa-accent)] selection:text-[var(--wa-accent-text)]"
      >
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 pointer-events-none">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-[13px] font-semibold bg-[var(--wa-surface)] text-[var(--wa-text)] ${
                toastMessage.type === 'success'
                  ? 'border-[var(--wa-accent)]/60'
                  : toastMessage.type === 'warning'
                  ? 'border-amber-500/60'
                  : 'border-sky-500/60'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-[var(--wa-accent)] shrink-0" />
              ) : toastMessage.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span className="leading-snug">{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* WhatsApp-Style Top App Bar with 3-Dot Overflow Menu */}
        <Header
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
          onOpenHistory={() => {
            setHistorySelectedPersonnel(null);
            setIsHistoryModalOpen(true);
          }}
          onOpenAppearance={() => setIsAppearanceModalOpen(true)}
          onOpenHeaderPhoto={() => setIsHeaderPhotoModalOpen(true)}
          onResetAllToPaten={handleResetAllToPaten}
          onOpenAddPersonnel={() => {
            setPersonnelToEdit(null);
            setIsPersonnelModalOpen(true);
          }}
          onCopyApelToPaten={handleCopyApelToPaten}
          onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={() => {
            if (isSelectionMode) {
              setIsSelectionMode(false);
              setSelectedIds(new Set());
            } else {
              setActiveTab('apel');
              setIsSelectionMode(true);
            }
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() && activeTab !== 'apel') {
              setActiveTab('apel');
            }
          }}
          hasDuplicates={summary.duplicates.length > 0}
          duplicateCount={summary.duplicates.length}
          totalHistoryCount={historyEntries.length}
          headerPhotoUrl={headerPhotoUrl}
          headerSubtitle={headerSubtitle}
        />

        {/* Fixed WhatsApp Wallpaper / Pattern Behind Scrollable Main Content */}
        <div className="relative flex-1 w-full overflow-hidden flex flex-col">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundColor: activeTheme.bg,
              backgroundImage: appearanceSettings.customWallpaper
                ? `url(${appearanceSettings.customWallpaper})`
                : patternUrl,
              backgroundSize: appearanceSettings.customWallpaper ? 'cover' : '120px 120px',
              backgroundPosition: 'center',
              backgroundRepeat: appearanceSettings.customWallpaper ? 'no-repeat' : 'repeat',
            }}
          />
          {appearanceSettings.customWallpaper && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                backgroundColor: activeTheme.isLight
                  ? `rgba(239, 234, 226, ${appearanceSettings.wallpaperDim / 100})`
                  : `rgba(11, 20, 26, ${appearanceSettings.wallpaperDim / 100})`,
              }}
            />
          )}

          {/* Scrollable Native App Content Area */}
          <main className="relative z-10 flex-1 w-full overflow-y-auto overscroll-y-contain no-scrollbar pb-24">
            {activeTab === 'apel' && (
              <div className="w-full">
                {/* Compact Audit Alert Banner */}
                <AlertBanner
                  duplicates={summary.duplicates}
                  unaccountedCount={summary.unaccountedCount}
                  onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
                  onQuickResolveAll={handleResolveDuplicateAll}
                  dismissed={alertDismissed}
                  onDismiss={() => setAlertDismissed(true)}
                />

                {/* WhatsApp-style Filter Chips & Symmetrical Yellow/Green Sort Bar */}
                <WhatsAppFilterStrip
                  summary={summary}
                  selectedStatus={selectedStatus}
                  onSelectStatus={setSelectedStatus}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  selectedRank={selectedRank}
                  selectedSubKet={selectedSubKet}
                  searchQuery={searchQuery}
                  totalFiltered={filteredPersonnel.length}
                  totalMaster={personnelList.length}
                  onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
                  onResetFilters={resetAllFilters}
                  onSortPangkatNama={handleSortPangkatNama}
                  onSortKeteranganApel={handleSortKeteranganApel}
                  activeSortMode={activeSortMode}
                  isLightTheme={activeTheme.isLight}
                />

                {/* Native WhatsApp Mobile Chat List */}
                <PersonnelChatList
                  personnelList={filteredPersonnel}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onCancelSelectionMode={() => {
                    setIsSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  onSelectPerson={(person, index) => {
                    const realIndex = personnelList.findIndex((p) => p.id === person.id);
                    setActionSheetTarget({ person, index: realIndex >= 0 ? realIndex : index });
                  }}
                />
              </div>
            )}

          {activeTab === 'ringkasan' && (
            <SummaryTabView
              summary={summary}
              personnelList={personnelList}
              onNavigateCategory={(cat) => {
                setSelectedStatus('Semua');
                setSelectedCategory(cat);
                setActiveTab('apel');
              }}
              onNavigateStatus={(st) => {
                setSelectedCategory('Semua');
                setSelectedStatus(st);
                setActiveTab('apel');
              }}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {activeTab === 'kelola' && (
            <CategoryTabView
              categories={patentCategories}
              onAddCategory={(newCat) => {
                const upper = newCat.trim().toUpperCase();
                if (!upper || upper === 'TMMD') return;
                setPatentCategories((prev) => insertPatentInOrder(prev, upper));
                showToast(`Keterangan paten "${upper}" berhasil ditambahkan & disinkronkan.`);
              }}
              onEditCategory={handleEditCategory}
              onRemoveCategory={handleRemoveCategory}
              subKetList={subKetList}
              onAddSubKet={handleAddSubKet}
              onRemoveSubKet={handleRemoveSubKet}
              isAdmin={isAdmin}
            />
          )}

            {activeTab === 'database' && (
              <DatabaseTabView
                personnelList={personnelList}
                patentCategories={patentCategories}
                syncedPresets={syncedApelPresets}
                onApplyDatabaseToApel={handleResetAllToPaten}
                onUpdatePersonnelPaten={handleUpdatePersonnelPaten}
                onUpdatePersonnelName={handleUpdatePersonnelName}
                onUpdatePersonnelPangkat={handleUpdatePersonnelPangkat}
                onDeletePersonnel={handleDeletePersonnel}
                onOpenAddPersonnel={() => {
                  setPersonnelToEdit(null);
                  setIsPersonnelModalOpen(true);
                }}
                onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
                isAdmin={isAdmin}
                autoSyncEnabled={autoSyncEnabled}
                isGoogleConnected={!!googleUser}
              />
            )}
          </main>
        </div>

        {/* WhatsApp-style Floating Action Button (FAB) */}
        {isSelectionMode && selectedIds.size > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuickMoveTarget(null);
              setIsQuickMoveOpen(true);
            }}
            className="absolute bottom-[92px] right-4 z-30 h-14 px-5 rounded-2xl bg-[var(--wa-accent)] text-[var(--wa-accent-text)] hover:brightness-110 font-bold text-[14px] shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span>Pindah ({selectedIds.size})</span>
          </button>
        ) : activeTab === 'apel' ? (
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            aria-label="Salin Format Laporan Apel"
            title="Format Laporan Apel WhatsApp"
            className="absolute bottom-[92px] right-4 z-30 w-14 h-14 rounded-2xl bg-[var(--wa-accent)] text-[var(--wa-accent-text)] hover:brightness-110 shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          >
            <FileText className="w-6 h-6" />
          </button>
        ) : null}

        {/* Mobile Native Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          totalCount={summary.total}
          duplicateCount={summary.duplicates.length}
        />

        {!isOnline && (
          <div className="absolute bottom-[92px] left-4 z-30 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-[#0b141a] shadow-xl">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Mode Offline — Data tersimpan tetap aktif</span>
          </div>
        )}
      </div>

      {/* Bottom Sheet for Tapped Personnel Row */}
      <PersonnelActionSheet
        person={actionSheetTarget?.person || null}
        personIndex={actionSheetTarget?.index ?? -1}
        totalCount={personnelList.length}
        onClose={() => setActionSheetTarget(null)}
        onQuickAssign={handleQuickAssignFromSheet}
        onOpenFullEdit={(person) => {
          setPersonnelToEdit(person);
          setIsPersonnelModalOpen(true);
        }}
        onOpenQuickMove={(person) => {
          setQuickMoveTarget(person);
          setIsQuickMoveOpen(true);
        }}
        onViewHistory={handleOpenIndividualHistory}
        onMoveRow={handleMoveRow}
        onDelete={handleDeletePersonnel}
        isAdmin={isAdmin}
        syncedPresets={syncedApelPresets}
      />

      {/* Bottom Sheet for Advanced Filters (Pangkat & Sub Keterangan) */}
      <FilterSheetModal
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        selectedRank={selectedRank}
        onSelectRank={setSelectedRank}
        availableRanks={availableRanks}
        selectedSubKet={selectedSubKet}
        onSelectSubKet={setSelectedSubKet}
        availableSubKet={availableSubKet}
        onResetFilters={resetAllFilters}
      />

      {/* Modals */}
      <PersonnelModal
        isOpen={isPersonnelModalOpen}
        onClose={() => setIsPersonnelModalOpen(false)}
        onSave={handleSavePersonnel}
        personnelToEdit={personnelToEdit}
        patentCategories={patentCategories}
        syncedPresets={syncedApelPresets}
        isAdmin={isAdmin}
      />

      <QuickMoveModal
        isOpen={isQuickMoveOpen}
        onClose={() => {
          setIsQuickMoveOpen(false);
          setQuickMoveTarget(null);
        }}
        onConfirmMove={handleQuickMoveConfirm}
        targetPersonnel={quickMoveTarget}
        selectedCount={selectedIds.size}
        patentCategories={patentCategories}
        syncedPresets={syncedApelPresets}
      />

      <DuplicateResolverModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        duplicates={summary.duplicates}
        onResolveSingle={handleResolveDuplicateSingle}
        onResolveAllAutomatic={handleResolveDuplicateAll}
      />

      <ExportApelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        personnelList={personnelList}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyEntries={historyEntries}
        selectedPersonnel={historySelectedPersonnel}
        onClearFilterPersonnel={() => setHistorySelectedPersonnel(null)}
        onDeleteHistoryEntry={handleDeleteHistoryEntry}
        onClearAllHistory={handleClearAllHistory}
        isAdmin={isAdmin}
      />

      <AppearanceModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        settings={appearanceSettings}
        onUpdateSettings={handleUpdateAppearance}
        onOpenHeaderPhoto={() => setIsHeaderPhotoModalOpen(true)}
        headerSubtitle={headerSubtitle}
      />

      <HeaderPhotoModal
        isOpen={isHeaderPhotoModalOpen}
        onClose={() => setIsHeaderPhotoModalOpen(false)}
        photoUrl={headerPhotoUrl}
        headerSubtitle={headerSubtitle}
        onSavePhoto={handleSaveHeaderPhoto}
        onSaveSubtitle={handleSaveHeaderSubtitle}
      />

      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        googleUser={googleUser}
        googleToken={googleToken}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        personnelList={personnelList}
        onApplySheetData={handleApplySheetData}
        savedSheetUrl={savedSheetUrl}
        onSaveSheetUrl={handleSaveSheetUrl}
        savedSheetTab={savedSheetTab}
        onSaveSheetTab={handleSaveSheetTab}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={handleToggleAutoSync}
        lastSyncTime={lastSyncTime}
        isAdmin={isAdmin}
      />
    </div>
  );
}
