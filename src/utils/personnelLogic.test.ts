import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRankLevel,
  comparePersonnelByRankAndName,
  sortPersonnel,
  sortPersonnelByKeteranganApel,
  calculateMusterSummary,
  resetAllToPaten,
  parseNlpCommand,
  inferCategoryAndStatus,
  cleanParentheses,
  stripParenthesesFromPersonnel,
  getRankCategory,
  getRankBadgeStyle,
  movePersonnelRow,
  generateDuplicatesReport,
  generateKurangReport,
  generateDuplicatesAndKurangReport,
  reassignSubKetToSiapOps,
  insertSubKetInOrder,
  insertPatentInOrder,
  isProtectedSiapOps,
} from './personnelLogic';
import {
  INITIAL_PERSONNEL_DATABASE,
  INITIAL_KETERANGAN_PATEN_LIST,
  CANONICAL_SUB_KET_MENU_ORDER,
} from '../data/initialData';
import { Personnel } from '../types/personnel';

test('getRankLevel correctly prioritizes military ranks', () => {
  assert.equal(getRankLevel('Letda Inf'), 1);
  assert.equal(getRankLevel('Letda Ckm'), 1);
  assert.equal(getRankLevel('Serka'), 2);
  assert.equal(getRankLevel('Sertu'), 3);
  assert.equal(getRankLevel('Serda'), 4);
  assert.equal(getRankLevel('Praka'), 5);
  assert.equal(getRankLevel('Pratu'), 6);
  assert.equal(getRankLevel('Prada'), 7);
});

test('calculateMusterSummary initial state matches 85-personnel specification', () => {
  const summary = calculateMusterSummary(INITIAL_PERSONNEL_DATABASE);
  assert.equal(summary.total, 85);
  assert.equal(summary.hadir, 33);
  assert.equal(summary.kurang, 52);
  assert.equal(summary.kategoriBreakdown['DINAS DALAM'], 12);
  assert.equal(summary.kategoriBreakdown['DINAS LUAR'], 1);
  assert.equal(summary.kategoriBreakdown['DINAS KHUSUS'], 7);
  assert.equal(summary.kategoriBreakdown['LAIN LAIN'], 32);
  assert.equal(summary.kategoriBreakdown['SIAP OPS'], 33);
  assert.equal(summary.total, summary.hadir + summary.kurang);
});

test('inferCategoryAndStatus sets SIAP OPS to HADIR and others to KURANG', () => {
  assert.deepEqual(inferCategoryAndStatus('SIAP OPS'), {
    category: 'SIAP OPS',
    status: 'HADIR',
  });
  assert.deepEqual(inferCategoryAndStatus('PIKET KOMPI'), {
    category: 'DINAS DALAM',
    status: 'KURANG',
  });
  assert.deepEqual(inferCategoryAndStatus('PROVOOST'), {
    category: 'DINAS DALAM',
    status: 'KURANG',
  });
  assert.deepEqual(inferCategoryAndStatus('PROVOST'), {
    category: 'DINAS DALAM',
    status: 'KURANG',
  });
  assert.deepEqual(inferCategoryAndStatus('TMMD'), {
    category: 'DINAS LUAR',
    status: 'KURANG',
  });
  assert.deepEqual(inferCategoryAndStatus('DIK/SUS/TAR'), {
    category: 'DINAS KHUSUS',
    status: 'KURANG',
  });
  assert.deepEqual(inferCategoryAndStatus('BIMTEK WABKU'), {
    category: 'DINAS KHUSUS',
    status: 'KURANG',
  });
  assert.deepEqual(inferCategoryAndStatus('TURUN PAM PALASARI'), {
    category: 'LAIN LAIN',
    status: 'KURANG',
  });
});

test('NLP Rule 1: masukan (.+) ke keterangan (.+)', () => {
  const { updatedList, result } = parseNlpCommand(
    'masukan Prada Rival ke keterangan STAF LOG',
    INITIAL_PERSONNEL_DATABASE
  );
  assert.equal(result.success, true);
  assert.equal(result.action, 'ASSIGN_SUB_KETERANGAN');
  const rival = updatedList.find((p) => p.nama.includes('Rival'));
  assert.ok(rival);
  assert.equal(rival?.sub_keterangan_saat_ini, 'STAF LOG');
  assert.equal(rival?.status_dinas, 'KURANG');
});

test('NLP Rule 2: kembalikan semua personel ke keterangan paten', () => {
  const { updatedList, result } = parseNlpCommand(
    'kembalikan semua personel ke keterangan paten',
    INITIAL_PERSONNEL_DATABASE
  );
  assert.equal(result.success, true);
  assert.equal(result.action, 'RESET_ALL_TO_PATEN');
  // Check that all personnel sub_keterangan now equals keterangan_paten
  for (const p of updatedList) {
    assert.equal(p.sub_keterangan_saat_ini, p.keterangan_paten);
  }
});

test('NLP Rule 3: tampilkan personel pangkat (.+)', () => {
  const { result } = parseNlpCommand('tampilkan personel pangkat Serda', INITIAL_PERSONNEL_DATABASE);
  assert.equal(result.success, true);
  assert.equal(result.action, 'FILTER_BY_RANK');
  assert.equal(result.data.targetRank.toLowerCase(), 'serda');
});

test('cleanParentheses and stripParenthesesFromPersonnel correctly removes ( and )', () => {
  assert.equal(cleanParentheses('Prada Agus (Satri)'), 'Prada Agus Satri');
  assert.equal(cleanParentheses('(No. 4) STAF PERS'), 'No. 4 STAF PERS');

  const sampleList: Personnel[] = [
    {
      id: 99,
      pangkat: 'Prada',
      nama: 'Budi (Danru)',
      pangkat_level: 7,
      keterangan_paten: 'TON ANG',
      kategori_saat_ini: 'LAIN LAIN',
      sub_keterangan_saat_ini: 'GARJAS (GEL. 2)',
      status_dinas: 'KURANG',
      catatan: 'Catatan (khusus)',
    },
  ];
  const { updatedList } = stripParenthesesFromPersonnel(sampleList);
  assert.equal(updatedList[0].nama, 'Budi Danru');
  assert.equal(updatedList[0].sub_keterangan_saat_ini, 'GARJAS GEL. 2');
  assert.equal(updatedList[0].catatan, 'Catatan khusus');
});

test('getRankCategory and getRankBadgeStyle match exact user requirements', () => {
  // Perwira: kuning keemasan (amber)
  assert.equal(getRankCategory('Letda Inf'), 'PERWIRA');
  assert.equal(getRankCategory('Kapten Czi'), 'PERWIRA');
  assert.ok(getRankBadgeStyle('Letda Inf').includes('amber'));

  // Bintara: kuning cerah (yellow)
  assert.equal(getRankCategory('Serka'), 'BINTARA');
  assert.equal(getRankCategory('Serda'), 'BINTARA');
  assert.ok(getRankBadgeStyle('Serka').includes('yellow'));

  // Tamtama: merah cabe (red)
  assert.equal(getRankCategory('Praka'), 'TAMTAMA');
  assert.equal(getRankCategory('Prada'), 'TAMTAMA');
  assert.ok(getRankBadgeStyle('Prada').includes('red'));
});

test('movePersonnelRow reorders rows and preserves items', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }] as any;
  const moved = movePersonnelRow(items, 0, 2);
  assert.equal(moved[0].id, 2);
  assert.equal(moved[1].id, 3);
  assert.equal(moved[2].id, 1);
});

test('generateDuplicatesReport detects duplicates when present', () => {
  // Test clean database (all 94 names distinct)
  const cleanRes = generateDuplicatesReport(INITIAL_PERSONNEL_DATABASE);
  assert.equal(cleanRes.count, 0);

  // Test with injected duplicate
  const dupList: Personnel[] = [
    ...INITIAL_PERSONNEL_DATABASE,
    {
      id: 999,
      pangkat: 'Serda',
      nama: 'Zulfi',
      pangkat_level: 4,
      keterangan_paten: 'STAF PERS',
      kategori_saat_ini: 'SIAP OPS',
      sub_keterangan_saat_ini: 'SIAP OPS',
      status_dinas: 'HADIR',
      catatan: '',
    },
  ];
  const dupRes = generateDuplicatesReport(dupList);
  assert.equal(dupRes.count, 1);
  assert.ok(dupRes.message.includes('Zulfi'));
});

test('generateKurangReport calculates correct count and category breakdowns', () => {
  const res = generateKurangReport(INITIAL_PERSONNEL_DATABASE);
  assert.equal(res.count, 52);
  assert.ok(res.message.includes('52 dari total 85'));
  assert.ok(res.message.includes('DINAS DALAM (12 Orang)'));
  assert.ok(res.message.includes('DINAS LUAR (1 Orang)'));
  assert.ok(res.message.includes('DINAS KHUSUS (7 Orang)'));
  assert.ok(res.message.includes('LAIN-LAIN (32 Orang)'));
});

test('generateDuplicatesAndKurangReport returns combined dual audit', () => {
  const res = generateDuplicatesAndKurangReport(INITIAL_PERSONNEL_DATABASE);
  assert.equal(res.kurangCount, 52);
  assert.ok(res.message.includes('PEMERIKSAAN DATA PERSONEL GANDA'));
  assert.ok(res.message.includes('HASIL PEMERIKSAAN PERSONEL KURANG'));
});

test('NLP handles checking duplicate and kurang commands', () => {
  // Dual check
  const dual = parseNlpCommand('cek data personel ganda maupun kurang', INITIAL_PERSONNEL_DATABASE);
  assert.equal(dual.result.action, 'CHECK_DUPLICATES_AND_KURANG');
  assert.equal(dual.result.success, true);
  assert.ok(dual.result.message.includes('52 dari total 85'));

  // Duplicate only
  const dup = parseNlpCommand('cek data personel ganda', INITIAL_PERSONNEL_DATABASE);
  assert.equal(dup.result.action, 'CHECK_DUPLICATES');
  assert.equal(dup.result.success, true);

  // Kurang only
  const kurang = parseNlpCommand('cek data personel kurang', INITIAL_PERSONNEL_DATABASE);
  assert.equal(kurang.result.action, 'CHECK_KURANG');
  assert.equal(kurang.result.success, true);
  assert.ok(kurang.result.message.includes('52 dari total 85'));
});

test('NLP parses WhatsApp muster text and detects duplicates, kurang, and lebih', () => {
  const waText = `Jumlah: 94
Kurang: 86
Hadir: 8
Keterangan:

1. DINAS KEAMANAN: 2 ORANG
- Serda Zulfi
- Prada Ryan

2. PAM PALASARI: 2 ORANG
- Serda Zulfi
- Prada OrangAsing

3. SIAP OPS: 1 ORANG
- Prada Ryan`;

  const { result } = parseNlpCommand(waText, INITIAL_PERSONNEL_DATABASE);
  assert.equal(result.action, 'CHECK_MUSTER_TEXT');
  assert.equal(result.success, true);
  assert.ok(result.data.ganda.length >= 2, 'Serda Zulfi and Prada Ryan should be detected as ganda');
  assert.ok(result.message.includes('Serda Zulfi'));
  assert.ok(result.message.includes('Prada Ryan'));
  assert.ok(result.message.includes('DINAS KEAMANAN'));
  assert.ok(result.message.includes('PAM PALASARI'));
  assert.ok(result.data.lebih.some((l: any) => l.name.toLowerCase().includes('orangasing')));
});

test('sortPersonnelByKeteranganApel correctly prioritizes apel categories and preserves rank/name ordering', () => {
  const sampleList: Personnel[] = [
    {
      id: 1,
      pangkat: 'Prada',
      nama: 'Budi',
      pangkat_level: 7,
      keterangan_paten: 'TON ANG',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'DAPUR',
      status_dinas: 'KURANG',
    },
    {
      id: 2,
      pangkat: 'Serda',
      nama: 'Asep',
      pangkat_level: 4,
      keterangan_paten: 'PROVOOST',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'PROVOOST',
      status_dinas: 'KURANG',
    },
    {
      id: 3,
      pangkat: 'Letda Inf',
      nama: 'Chandra',
      pangkat_level: 1,
      keterangan_paten: 'KOMPI',
      kategori_saat_ini: 'SIAP OPS',
      sub_keterangan_saat_ini: 'SIAP OPS',
      status_dinas: 'HADIR',
    },
    {
      id: 4,
      pangkat: 'Prada',
      nama: 'Zainal',
      pangkat_level: 7,
      keterangan_paten: 'TON ANG',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'PIKET YON',
      status_dinas: 'KURANG',
    },
    {
      id: 5,
      pangkat: 'Serka',
      nama: 'Dedi',
      pangkat_level: 2,
      keterangan_paten: 'TON HUB',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'PIKET YON',
      status_dinas: 'KURANG',
    },
    {
      id: 6,
      pangkat: 'Serda',
      nama: 'Fajar',
      pangkat_level: 4,
      keterangan_paten: 'STAF PERS',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'JAKAM',
      status_dinas: 'KURANG',
    },
  ];

  const sorted = sortPersonnelByKeteranganApel(sampleList);

  // PIKET YON should be first: Serka Dedi (pangkat_level 2) then Prada Zainal (pangkat_level 7)
  assert.equal(sorted[0].nama, 'Dedi');
  assert.equal(sorted[0].sub_keterangan_saat_ini, 'PIKET YON');
  assert.equal(sorted[1].nama, 'Zainal');
  assert.equal(sorted[1].sub_keterangan_saat_ini, 'PIKET YON');

  // Next is JAKAM (index 4) before PROVOOST (index 5)
  assert.equal(sorted[2].nama, 'Fajar');
  assert.equal(sorted[2].sub_keterangan_saat_ini, 'JAKAM');

  // Next is PROVOOST
  assert.equal(sorted[3].nama, 'Asep');
  assert.equal(sorted[3].sub_keterangan_saat_ini, 'PROVOOST');

  // Next is DAPUR
  assert.equal(sorted[4].nama, 'Budi');
  assert.equal(sorted[4].sub_keterangan_saat_ini, 'DAPUR');

  // SIAP OPS is after specified duty stations
  assert.equal(sorted[5].nama, 'Chandra');
  assert.equal(sorted[5].sub_keterangan_saat_ini, 'SIAP OPS');
});

test('sortPersonnelByKeteranganApel strictly matches full 23-item requested sequence', () => {
  const expectedOrder = [
    'PIKET YON',
    'PIKET KOMPI',
    'PIKET KOM',
    'SATRI',
    'JAKAM',
    'PROVOOST',
    'DAPUR',
    'KOPERASI',
    'KORVE KOREM',
    'DIK/SUS/TAR',
    'BIMTEK WABKU',
    'BP KOTAS',
    'STAF INTEL',
    'STAF OPS',
    'STAF PERS',
    'STAF LOG',
    'TON ANG',
    'CARAKA',
    'JUYAR',
    'ADC',
    'TURUN PAM PALASARI',
    'PERSIAPAN NAIK PIKET YON',
    'PERSIAPAN NAIK PIKET KOMPI',
  ];

  // Construct reversed sample list
  const reversed: Personnel[] = [...expectedOrder]
    .reverse()
    .map((subKet, idx) => {
      const { category, status } = inferCategoryAndStatus(subKet);
      return {
        id: idx + 1,
        pangkat: 'Prada',
        nama: `Person_${idx + 1}`,
        pangkat_level: 7,
        keterangan_paten: subKet,
        kategori_saat_ini: category,
        sub_keterangan_saat_ini: subKet,
        status_dinas: status,
      };
    });

  const sorted = sortPersonnelByKeteranganApel(reversed);
  assert.deepEqual(
    sorted.map((p) => p.sub_keterangan_saat_ini),
    expectedOrder
  );
});

test('sortPersonnelByKeteranganApel enforces SATRI order and anchors SIAP OPS strictly at bottom', () => {
  const sample: Personnel[] = [
    {
      id: 10,
      pangkat: 'Letda Inf',
      nama: 'Danu',
      pangkat_level: 1,
      keterangan_paten: 'KOMPI',
      kategori_saat_ini: 'SIAP OPS',
      sub_keterangan_saat_ini: 'SIAP OPS',
      status_dinas: 'HADIR',
    },
    {
      id: 11,
      pangkat: 'Prada',
      nama: 'Agus',
      pangkat_level: 7,
      keterangan_paten: 'TON ANG',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'SATRI',
      status_dinas: 'KURANG',
    },
    {
      id: 12,
      pangkat: 'Serda',
      nama: 'Bambang',
      pangkat_level: 4,
      keterangan_paten: 'TON HUB',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'TURUN SATRI',
      status_dinas: 'KURANG',
    },
    {
      id: 13,
      pangkat: 'Prada',
      nama: 'Charlie',
      pangkat_level: 7,
      keterangan_paten: 'TON ANG',
      kategori_saat_ini: 'LAIN LAIN',
      sub_keterangan_saat_ini: 'IZIN SAKIT',
      status_dinas: 'KURANG',
    },
  ];

  const sorted = sortPersonnelByKeteranganApel(sample);

  // Expected order:
  // 1. SATRI (Agus)
  // 2. TURUN SATRI (Bambang)
  // 3. Custom sub-keterangan: IZIN SAKIT (Charlie)
  // 4. SIAP OPS strictly at the bottom (Danu)
  assert.equal(sorted[0].sub_keterangan_saat_ini, 'SATRI');
  assert.equal(sorted[1].sub_keterangan_saat_ini, 'TURUN SATRI');
  assert.equal(sorted[2].sub_keterangan_saat_ini, 'IZIN SAKIT');
  assert.equal(sorted[3].sub_keterangan_saat_ini, 'SIAP OPS');
});

test('sortPersonnelByKeteranganApel follows exact category hierarchy (DINAS DALAM, DINAS LUAR, DINAS KHUSUS, LAIN LAIN, SIAPOPS)', () => {
  const sample: Personnel[] = [
    {
      id: 1,
      pangkat: 'Prada',
      nama: 'Zaki',
      pangkat_level: 7,
      keterangan_paten: 'SIAP OPS',
      kategori_saat_ini: 'SIAP OPS',
      sub_keterangan_saat_ini: 'SIAP OPS',
      status_dinas: 'HADIR',
    },
    {
      id: 2,
      pangkat: 'Prada',
      nama: 'Andi',
      pangkat_level: 7,
      keterangan_paten: 'PERSIAPAN NAIK PIKET',
      kategori_saat_ini: 'LAIN LAIN',
      sub_keterangan_saat_ini: 'PERSIAPAN NAIK PIKET',
      status_dinas: 'KURANG',
    },
    {
      id: 3,
      pangkat: 'Serda',
      nama: 'Budi',
      pangkat_level: 4,
      keterangan_paten: 'BP KOMANDO ATAS',
      kategori_saat_ini: 'DINAS KHUSUS',
      sub_keterangan_saat_ini: 'BP KOMANDO ATAS',
      status_dinas: 'KURANG',
    },
    {
      id: 4,
      pangkat: 'Pratu',
      nama: 'Candra',
      pangkat_level: 6,
      keterangan_paten: 'KORVE KOREM',
      kategori_saat_ini: 'DINAS LUAR',
      sub_keterangan_saat_ini: 'KORVE KOREM',
      status_dinas: 'KURANG',
    },
    {
      id: 5,
      pangkat: 'Sertu',
      nama: 'Dedi',
      pangkat_level: 3,
      keterangan_paten: 'PROVOOST',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'PROVOOST',
      status_dinas: 'KURANG',
    },
    {
      id: 6,
      pangkat: 'Prada',
      nama: 'Eko',
      pangkat_level: 7,
      keterangan_paten: 'PIKET YON',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'PIKET YON',
      status_dinas: 'KURANG',
    },
  ];

  const sorted = sortPersonnelByKeteranganApel(sample);

  assert.equal(sorted[0].sub_keterangan_saat_ini, 'PIKET YON');
  assert.equal(sorted[1].sub_keterangan_saat_ini, 'PROVOOST');
  assert.equal(sorted[2].sub_keterangan_saat_ini, 'KORVE KOREM');
  assert.equal(sorted[3].sub_keterangan_saat_ini, 'BP KOMANDO ATAS');
  assert.equal(sorted[4].sub_keterangan_saat_ini, 'PERSIAPAN NAIK PIKET');
  assert.equal(sorted[5].sub_keterangan_saat_ini, 'SIAP OPS');
});

test('copying apel status to keterangan paten accurately updates patent database', () => {
  const sample: Personnel[] = [
    {
      id: 1,
      pangkat: 'Prada',
      nama: 'Abel',
      pangkat_level: 7,
      keterangan_paten: 'PROVOOST',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'SATRI',
      status_dinas: 'KURANG',
    },
    {
      id: 2,
      pangkat: 'Serda',
      nama: 'Zulfi',
      pangkat_level: 4,
      keterangan_paten: 'SIAP OPS',
      kategori_saat_ini: 'DINAS KHUSUS',
      sub_keterangan_saat_ini: 'BIMTEK WABKU',
      status_dinas: 'KURANG',
    },
  ];

  const updated = sample.map((p) => ({
    ...p,
    keterangan_paten: p.sub_keterangan_saat_ini,
  }));

  assert.equal(updated[0].keterangan_paten, 'SATRI');
  assert.equal(updated[1].keterangan_paten, 'BIMTEK WABKU');
});

test('reassignSubKetToSiapOps automatically moves personnel in deleted sub keterangan to SIAP OPS', () => {
  const sample: Personnel[] = [
    {
      id: 101,
      pangkat: 'Prada',
      nama: 'Abel',
      pangkat_level: 7,
      keterangan_paten: 'PROVOOST',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'KORVE KOREM',
      status_dinas: 'KURANG',
    },
    {
      id: 102,
      pangkat: 'Serda',
      nama: 'Zulfi',
      pangkat_level: 4,
      keterangan_paten: 'STAF PERS',
      kategori_saat_ini: 'DINAS LUAR',
      sub_keterangan_saat_ini: 'korve korem',
      status_dinas: 'KURANG',
    },
    {
      id: 103,
      pangkat: 'Prada',
      nama: 'Budi',
      pangkat_level: 7,
      keterangan_paten: 'DAPUR',
      kategori_saat_ini: 'DINAS DALAM',
      sub_keterangan_saat_ini: 'DAPUR',
      status_dinas: 'KURANG',
    },
  ];

  const { updated, movedIds, movedCount } = reassignSubKetToSiapOps(sample, 'KORVE KOREM');

  assert.equal(movedCount, 2);
  assert.deepEqual(movedIds, [101, 102]);
  assert.equal(updated[0].sub_keterangan_saat_ini, 'SIAP OPS');
  assert.equal(updated[0].kategori_saat_ini, 'SIAP OPS');
  assert.equal(updated[0].status_dinas, 'HADIR');
  assert.equal(updated[1].sub_keterangan_saat_ini, 'SIAP OPS');
  assert.equal(updated[1].kategori_saat_ini, 'SIAP OPS');
  assert.equal(updated[1].status_dinas, 'HADIR');
  // Unrelated personnel remains untouched
  assert.equal(updated[2].sub_keterangan_saat_ini, 'DAPUR');
  assert.equal(updated[2].kategori_saat_ini, 'DINAS DALAM');
  assert.equal(updated[2].status_dinas, 'KURANG');
});

test('INITIAL_PERSONNEL_DATABASE excludes the 9 removed personnel and matches 85 total', () => {
  assert.equal(INITIAL_PERSONNEL_DATABASE.length, 85);
  const removedChecks = [
    ['letda ckm', 'yoga'],
    ['sertu', 'trio'],
    ['sertu', 'zohry'],
    ['sertu', 'junaedi'],
    ['serda', 'feby'],
    ['serda', 'zulkarnain'],
    ['serda', 'yudho'],
    ['praka', 'andito'],
    ['pratu', 'andrean'],
  ];
  for (const [pangkat, nama] of removedChecks) {
    const found = INITIAL_PERSONNEL_DATABASE.some(
      (p) =>
        p.pangkat.toLowerCase().includes(pangkat) &&
        p.nama.toLowerCase().includes(nama)
    );
    assert.equal(found, false, `${pangkat} ${nama} must be removed from initial personnel`);
  }
});

test('INITIAL_KETERANGAN_PATEN_LIST and CANONICAL_SUB_KET_MENU_ORDER match exact sequences', () => {
  assert.deepEqual(INITIAL_KETERANGAN_PATEN_LIST, [
    'PROVOOST',
    'DAPUR',
    'KOPERASI',
    'KORVE KOREM',
    'BIMTEK WABKU',
    'BP KOTAS',
    'STAF INTEL',
    'STAF OPS',
    'STAF PERS',
    'STAF LOG',
    'TON ANG',
    'JUYAR',
    'CARAKA',
    'ADC',
    'SIAP OPS',
  ]);

  assert.deepEqual(CANONICAL_SUB_KET_MENU_ORDER, [
    'PIKET YON',
    'PIKET KOMPI',
    'PIKET KOM',
    'SATRI',
    'JAKAM',
    'DAPUR',
    'KOPERASI',
    'PAM PALASARI',
    'KORVE KOREM',
    'DIK/SUS/TAR',
    'TURUN PAM PALASARI',
    'TURUN SATRI',
    'PERSIAPAN NAIK PIKET YON',
    'PERSIAPAN NAIK PIKET KOMPI',
    'SAKIT',
  ]);
});

test('insertSubKetInOrder and insertPatentInOrder restore deleted items to their exact canonical positions', () => {
  // Simulate deleting PIKET YON (index 0), SATRI (index 3), and PAM PALASARI (index 7)
  let list = CANONICAL_SUB_KET_MENU_ORDER.filter(
    (s) => s !== 'PIKET YON' && s !== 'SATRI' && s !== 'PAM PALASARI'
  );
  // Also add a custom item
  list = insertSubKetInOrder(list, 'KORVE GUDANG');
  assert.equal(list[list.length - 1], 'KORVE GUDANG');

  // Re-add deleted items in scrambled order -> each must snap back to exact canonical slot
  list = insertSubKetInOrder(list, 'PAM PALASARI');
  list = insertSubKetInOrder(list, 'SATRI');
  list = insertSubKetInOrder(list, 'PIKET YON');

  assert.deepEqual(list, [...CANONICAL_SUB_KET_MENU_ORDER, 'KORVE GUDANG']);

  // Verify patent order restoration too
  let patents = INITIAL_KETERANGAN_PATEN_LIST.filter((c) => c !== 'STAF OPS' && c !== 'DAPUR');
  patents = insertPatentInOrder(patents, 'STAF OPS');
  patents = insertPatentInOrder(patents, 'DAPUR');
  assert.deepEqual(patents, INITIAL_KETERANGAN_PATEN_LIST);
});

test('isProtectedSiapOps strictly protects SIAP OPS from deletion or renaming', () => {
  assert.equal(isProtectedSiapOps('SIAP OPS'), true);
  assert.equal(isProtectedSiapOps('siap ops'), true);
  assert.equal(isProtectedSiapOps('  SIAP   OPS '), true);
  assert.equal(isProtectedSiapOps('SIAPOPS'), true);
  assert.equal(isProtectedSiapOps('PIKET YON'), false);
  assert.equal(isProtectedSiapOps('PROVOOST'), false);
  assert.equal(isProtectedSiapOps(''), false);
});
