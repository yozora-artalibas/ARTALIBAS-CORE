import { Personnel, ChangeHistoryEntry, ActionChangeType } from '../types/personnel';

export function getFormattedTimestamp(): string {
  const now = new Date();
  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${dayName}, ${dateStr} - ${timeStr} WIB`;
}

export function createHistoryEntry(
  person: Personnel,
  actionType: ActionChangeType,
  fieldChanged: string,
  oldValue: string,
  newValue: string,
  perubah: string = 'Bamin Kompi',
  keteranganTambahan?: string
): ChangeHistoryEntry {
  return {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    personnelId: person.id,
    personnelNama: person.nama,
    personnelPangkat: person.pangkat,
    actionType,
    fieldChanged,
    oldValue,
    newValue,
    perubah,
    timestamp: getFormattedTimestamp(),
    keteranganTambahan,
  };
}

/**
 * Compares an updated personnel with an old personnel and generates history logs.
 */
export function generateDiffHistory(
  oldPerson: Personnel,
  newPerson: Personnel,
  perubah: string = 'Bamin Kompi',
  actionTypeOverride?: ActionChangeType
): ChangeHistoryEntry[] {
  const entries: ChangeHistoryEntry[] = [];

  if (oldPerson.sub_keterangan_saat_ini !== newPerson.sub_keterangan_saat_ini) {
    entries.push(
      createHistoryEntry(
        newPerson,
        actionTypeOverride || 'UBAH_SUB_KETERANGAN',
        'Sub Keterangan',
        oldPerson.sub_keterangan_saat_ini,
        newPerson.sub_keterangan_saat_ini,
        perubah
      )
    );
  }

  if (oldPerson.kategori_saat_ini !== newPerson.kategori_saat_ini) {
    entries.push(
      createHistoryEntry(
        newPerson,
        actionTypeOverride || 'UBAH_KATEGORI',
        'Kategori Utama',
        oldPerson.kategori_saat_ini,
        newPerson.kategori_saat_ini,
        perubah
      )
    );
  }

  if (oldPerson.status_dinas !== newPerson.status_dinas) {
    entries.push(
      createHistoryEntry(
        newPerson,
        actionTypeOverride || 'UBAH_STATUS',
        'Status Dinas',
        oldPerson.status_dinas,
        newPerson.status_dinas,
        perubah
      )
    );
  }

  if (oldPerson.nama !== newPerson.nama) {
    entries.push(
      createHistoryEntry(
        newPerson,
        actionTypeOverride || (oldPerson.nama.includes('(') ? 'HAPUS_KURUNG' : 'EDIT_LENGKAP'),
        'Nama Personel',
        oldPerson.nama,
        newPerson.nama,
        perubah
      )
    );
  }

  if ((oldPerson.catatan || '') !== (newPerson.catatan || '')) {
    entries.push(
      createHistoryEntry(
        newPerson,
        actionTypeOverride || 'UBAH_CATATAN',
        'Keterangan Khusus / Catatan',
        oldPerson.catatan || '(kosong)',
        newPerson.catatan || '(kosong)',
        perubah
      )
    );
  }

  return entries;
}

export const INITIAL_CHANGE_HISTORY: ChangeHistoryEntry[] = [];

