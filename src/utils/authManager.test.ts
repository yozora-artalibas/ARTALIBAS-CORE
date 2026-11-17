import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeAndDeduplicateUsers,
  deleteUserAccount,
  deleteOwnUserAccount,
  updateAdmin2Credentials,
  updateUserAvatar,
  updateOwnUserProfile,
  registerNewUserRequest,
  loadUsersFromStorage,
  saveActiveSession,
  loadActiveSession,
  getRoleDisplayName,
  DEFAULT_USERS,
} from './authManager';
import {
  getInitials,
  computeSquareCrop,
  validateImageFileMeta,
  isValidAvatarDataUrl,
} from './imageUtils';
import { AppUser } from '../types/auth';

test('getRoleDisplayName returns exact Indonesian Hak Akses titles', () => {
  const zulfiUser: AppUser = {
    id: 'user_admin_01',
    username: 'zulfi',
    password: 'artalibas942',
    namaLengkap: 'Zulfi Nur F',
    pangkat: 'Komandan KIMA',
    role: 'admin',
    isPrimaryAdmin: true,
    status: 'active',
    createdAt: 'Senin, 02 November 2026',
  };

  const baminUser: AppUser = {
    id: 'user_admin_02',
    username: 'bamin',
    password: 'bamin942',
    namaLengkap: 'Bamin Kompi Markas',
    pangkat: 'Serka',
    role: 'admin',
    isPrimaryAdmin: false,
    status: 'active',
    createdAt: 'Senin, 02 November 2026',
  };

  const regularUser: AppUser = {
    id: 'user_operator_02',
    username: 'user',
    password: 'user942',
    namaLengkap: 'Operator KIMA',
    role: 'user',
    isPrimaryAdmin: false,
    status: 'active',
    createdAt: 'Senin, 02 November 2026',
  };

  assert.equal(getRoleDisplayName(zulfiUser), 'Administrator Utama');
  assert.equal(getRoleDisplayName(baminUser), 'Admin');
  assert.equal(getRoleDisplayName(regularUser), 'User');
});

test('DEFAULT_USERS has correct credentials, ranks, names, and roles', () => {
  const zulfi = DEFAULT_USERS.find((u) => u.username === 'zulfi');
  assert.ok(zulfi);
  assert.equal(zulfi.password, 'artalibas942');
  assert.equal(zulfi.pangkat, 'Serda');
  assert.equal(zulfi.role, 'admin');
  assert.equal(zulfi.isPrimaryAdmin, true);
  assert.equal(getRoleDisplayName(zulfi), 'Administrator Utama');

  const bamin = DEFAULT_USERS.find((u) => u.username === 'bamin');
  assert.ok(bamin);
  assert.equal(bamin.password, 'bamin942');
  assert.equal(bamin.pangkat, 'Serda');
  assert.equal(bamin.role, 'admin');
  assert.equal(bamin.isPrimaryAdmin, false);
  assert.equal(getRoleDisplayName(bamin), 'Admin');

  const user = DEFAULT_USERS.find((u) => u.username === 'user');
  assert.ok(user);
  assert.equal(user.password, 'user942');
  assert.equal(user.pangkat, 'Prada');
  assert.equal(user.namaLengkap, 'User');
  assert.equal(user.role, 'user');
  assert.equal(getRoleDisplayName(user), 'User');
});

test('sanitizeAndDeduplicateUsers enforces max 2 admins (Zulfi & Bamin)', () => {
  const usersWithTooManyAdmins: AppUser[] = [
    {
      id: 'user_admin_01',
      username: 'zulfi',
      password: 'artalibas942',
      namaLengkap: 'Zulfi Nur F',
      pangkat: 'Komandan KIMA',
      role: 'admin',
      isPrimaryAdmin: true,
      status: 'active',
      createdAt: 'Senin, 02 November 2026',
    },
    {
      id: 'user_admin_02',
      username: 'bamin',
      password: 'bamin942',
      namaLengkap: 'Bamin Kompi Markas',
      pangkat: 'Serka',
      role: 'admin',
      isPrimaryAdmin: false,
      status: 'active',
      createdAt: 'Senin, 02 November 2026',
    },
    {
      id: 'user_admin_03',
      username: 'third_admin',
      password: 'pwd',
      namaLengkap: 'Third Imposter Admin',
      pangkat: 'Serda',
      role: 'admin',
      isPrimaryAdmin: false,
      status: 'active',
      createdAt: 'Senin, 02 November 2026',
    },
  ];

  const result = sanitizeAndDeduplicateUsers(usersWithTooManyAdmins);
  const admins = result.filter((u) => u.role === 'admin');
  assert.equal(admins.length, 2, 'Total admins must strictly not exceed 2');
  assert.equal(admins[0].username, 'zulfi');
  assert.equal(admins[1].username, 'bamin');
  assert.equal(result.find((u) => u.username === 'third_admin')?.role, 'user', 'Third admin downgraded to user');
});

test('deleteUserAccount allows Administrator Utama to delete Admin (Bamin) or any other user, but not self', () => {
  // Administrator Utama tries to delete Bamin -> allowed
  const resDelBamin = deleteUserAccount('user_admin_01', 'user_admin_02');
  assert.equal(resDelBamin.success, true);
  assert.ok(resDelBamin.message.includes('berhasil dihapus'));

  // Administrator Utama tries to delete self -> blocked
  const resDelSelf = deleteUserAccount('user_admin_01', 'user_admin_01');
  assert.equal(resDelSelf.success, false);

  // Bamin tries to delete Administrator Utama -> blocked
  const resBaminDelUtama = deleteUserAccount('user_admin_02', 'user_admin_01');
  assert.equal(resBaminDelUtama.success, false);
  assert.ok(resBaminDelUtama.message.includes('Administrator Utama'));
});

test('deleteOwnUserAccount prevents Administrator Utama from deleting self, but allows Admin 2 Bamin and regular user', () => {
  const resAdminUtama = deleteOwnUserAccount('user_admin_01');
  assert.equal(resAdminUtama.success, false);
  assert.ok(resAdminUtama.message.includes('Administrator Utama'));

  const resBamin = deleteOwnUserAccount('user_admin_02');
  assert.equal(resBamin.success, true);

  const resUser = deleteOwnUserAccount('user_operator_02');
  assert.equal(resUser.success, true);
});

test('updateUserAvatar and updateOwnUserProfile persist profile photos and sync active session across roles', () => {
  const mockStorage = new Map<string, string>();
  const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, val: string) => {
      mockStorage.set(key, val);
    },
    removeItem: (key: string) => {
      mockStorage.delete(key);
    },
  };

  try {
    const initialUsers = loadUsersFromStorage();
    const regularUser = initialUsers.find((u) => u.username === 'user')!;
    saveActiveSession(regularUser);

    const samplePhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const resSet = updateUserAvatar(regularUser.id, samplePhoto);
    assert.equal(resSet.success, true);
    assert.equal(resSet.updatedUser?.avatarUrl, samplePhoto);

    // Verify stored users list & active session both retain avatarUrl
    const storedUsers = loadUsersFromStorage();
    assert.equal(storedUsers.find((u) => u.id === regularUser.id)?.avatarUrl, samplePhoto);
    assert.equal(loadActiveSession()?.avatarUrl, samplePhoto);

    // Updating own profile text without clearing avatar keeps avatarUrl intact
    const resProfile = updateOwnUserProfile(regularUser.id, {
      username: 'user',
      namaLengkap: 'Operator Piket',
      pangkat: 'Pratu',
    });
    assert.equal(resProfile.success, true);
    assert.equal(resProfile.updatedUser?.avatarUrl, samplePhoto);

    // Removing avatar clears it cleanly from DB and session
    const resClear = updateUserAvatar(regularUser.id, null);
    assert.equal(resClear.success, true);
    assert.equal(resClear.updatedUser?.avatarUrl, undefined);
    assert.equal(loadUsersFromStorage().find((u) => u.id === regularUser.id)?.avatarUrl, undefined);
    assert.equal(loadActiveSession()?.avatarUrl, undefined);

    // Registering a new user can attach an optional profile photo visible to admins
    const regRes = registerNewUserRequest({
      username: 'operator_baru',
      password: 'password123',
      namaLengkap: 'Prada Baru',
      pangkat: 'Prada',
      notes: 'Anggota Kompi',
      avatarUrl: samplePhoto,
    });
    assert.equal(regRes.success, true);
    const pendingNew = loadUsersFromStorage().find((u) => u.username === 'operator_baru');
    assert.equal(pendingNew?.avatarUrl, samplePhoto);
  } finally {
    if (originalLocalStorage === undefined) {
      delete (globalThis as Record<string, unknown>).localStorage;
    } else {
      (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
    }
  }
});

test('imageUtils pure helpers compute initials, square crop, and validate image metadata cleanly', () => {
  assert.equal(getInitials('Zulfi Nur F'), 'ZF');
  assert.equal(getInitials('Bamin'), 'BA');
  assert.equal(getInitials(''), 'US');

  assert.deepEqual(computeSquareCrop(1200, 800, 256), {
    sx: 200,
    sy: 0,
    sSize: 800,
    targetSize: 256,
  });
  assert.deepEqual(computeSquareCrop(100, 200, 256), {
    sx: 0,
    sy: 50,
    sSize: 100,
    targetSize: 100,
  });

  assert.equal(validateImageFileMeta('image/jpeg', 50000).valid, true);
  assert.equal(validateImageFileMeta('application/pdf', 50000).valid, false);
  assert.equal(validateImageFileMeta('image/png', 15 * 1024 * 1024).valid, false);

  assert.equal(isValidAvatarDataUrl('data:image/jpeg;base64,abc'), true);
  assert.equal(isValidAvatarDataUrl('javascript:alert(1)'), false);
});

test('legacy user ranks, User display name, and seeded history migrate cleanly once', async () => {
  const { INITIAL_CHANGE_HISTORY } = await import('./historyManager');
  const { loadHistoryFromStorage } = await import('./storageManager');

  assert.equal(INITIAL_CHANGE_HISTORY.length, 0);

  const mockStorage = new Map<string, string>();
  mockStorage.set(
    'KIMA_USERS_DATABASE_V1',
    JSON.stringify([
      {
        id: 'user_admin_01',
        username: 'zulfi',
        password: 'artalibas942',
        namaLengkap: 'Zulfi Nur F',
        pangkat: 'Komandan KIMA',
        role: 'admin',
        isPrimaryAdmin: true,
        status: 'active',
        createdAt: 'Senin',
      },
      {
        id: 'user_admin_02',
        username: 'bamin',
        password: 'bamin942',
        namaLengkap: 'Bamin Kompi Markas',
        pangkat: 'Serka',
        role: 'admin',
        isPrimaryAdmin: false,
        status: 'active',
        createdAt: 'Senin',
      },
      {
        id: 'user_operator_02',
        username: 'user',
        password: 'user942',
        namaLengkap: 'Operator Apel Kompi Markas',
        pangkat: 'Piket KIMA',
        role: 'user',
        isPrimaryAdmin: false,
        status: 'active',
        createdAt: 'Senin',
      },
    ])
  );
  mockStorage.set(
    'KIMA_ACTIVE_SESSION_V1',
    JSON.stringify({
      id: 'user_operator_02',
      username: 'user',
      password: 'user942',
      namaLengkap: 'Operator Apel Kompi Markas',
      pangkat: 'Piket KIMA',
      role: 'user',
      status: 'active',
      createdAt: 'Senin',
    })
  );
  mockStorage.set(
    'KIMA_CHANGE_HISTORY_V3',
    JSON.stringify([{ id: 'hist_init_1', personnelNama: 'Pajar Maulana' }])
  );

  const originalLocalStorage = (globalThis as Record<string, unknown>).localStorage;
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, val: string) => {
      mockStorage.set(key, val);
    },
    removeItem: (key: string) => {
      mockStorage.delete(key);
    },
  };

  try {
    const migratedUsers = loadUsersFromStorage();
    assert.equal(migratedUsers.find((u) => u.username === 'zulfi')?.pangkat, 'Serda');
    assert.equal(migratedUsers.find((u) => u.username === 'bamin')?.pangkat, 'Serda');
    const regularUser = migratedUsers.find((u) => u.username === 'user');
    assert.equal(regularUser?.pangkat, 'Prada');
    assert.equal(regularUser?.namaLengkap, 'User');

    const migratedSession = loadActiveSession();
    assert.equal(migratedSession?.pangkat, 'Prada');
    assert.equal(migratedSession?.namaLengkap, 'User');

    const migratedHistory = loadHistoryFromStorage();
    assert.equal(migratedHistory.length, 0);
  } finally {
    if (originalLocalStorage === undefined) {
      delete (globalThis as Record<string, unknown>).localStorage;
    } else {
      (globalThis as Record<string, unknown>).localStorage = originalLocalStorage;
    }
  }
});



