import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Trash2,
  Inbox,
  UserPlus,
  Check,
  AlertTriangle,
  Lock,
  UserCog,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  Camera,
  Search,
  ImageOff,
} from 'lucide-react';
import { AppUser } from '../types/auth';
import {
  loadUsersFromStorage,
  approvePendingUser,
  rejectPendingUser,
  deleteUserAccount,
  registerNewUserRequest,
  updateOwnUserProfile,
  updateUserAvatar,
  updateAdmin2Credentials,
  deleteOwnUserAccount,
  checkUsernameAvailability,
  getRoleDisplayName,
} from '../utils/authManager';
import { compressProfilePhotoToDataUrl } from '../utils/imageUtils';
import { UserAvatar } from './UserAvatar';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onUsersUpdated?: () => void;
  onLogout?: () => void;
  onCurrentUserUpdated?: (user: AppUser) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
  onLogout,
  onCurrentUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'list' | 'inbox' | 'create'>('profile');
  const [usersList, setUsersList] = useState<AppUser[]>(() => loadUsersFromStorage());
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [listSearch, setListSearch] = useState<string>('');

  // Own Profile Editing State
  const [myUsername, setMyUsername] = useState<string>(currentUser.username);
  const [myPassword, setMyPassword] = useState<string>('');
  const [myNama, setMyNama] = useState<string>(currentUser.namaLengkap);
  const [myPangkat, setMyPangkat] = useState<string>(currentUser.pangkat || 'Prada');
  const [showMyPassword, setShowMyPassword] = useState<boolean>(false);
  const [showDeleteSelfConfirm, setShowDeleteSelfConfirm] = useState<boolean>(false);
  const [isUploadingMyPhoto, setIsUploadingMyPhoto] = useState<boolean>(false);

  // Lightbox photo preview
  const [previewUser, setPreviewUser] = useState<AppUser | null>(null);

  // Admin user deletion confirmation
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Bamin Credential Editing State (by Admin Utama)
  const [baminToEdit, setBaminToEdit] = useState<AppUser | null>(null);
  const [baminUsername, setBaminUsername] = useState<string>('');
  const [baminPassword, setBaminPassword] = useState<string>('');
  const [baminNama, setBaminNama] = useState<string>('');
  const [baminPangkat, setBaminPangkat] = useState<string>('');
  const [showBaminPassword, setShowBaminPassword] = useState<boolean>(false);

  // New user form state
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newNama, setNewNama] = useState<string>('');
  const [newPangkat, setNewPangkat] = useState<string>('Prada');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string>('');
  const [isUploadingNewPhoto, setIsUploadingNewPhoto] = useState<boolean>(false);

  const myPhotoInputRef = useRef<HTMLInputElement>(null);
  const newPhotoInputRef = useRef<HTMLInputElement>(null);

  // Sync latest usersList & profile fields whenever modal opens or currentUser changes
  useEffect(() => {
    if (!isOpen) return;
    setUsersList(loadUsersFromStorage());
    setMyUsername(currentUser.username);
    setMyNama(currentUser.namaLengkap);
    setMyPangkat(currentUser.pangkat || 'Prada');
    setMyPassword('');
    setShowDeleteSelfConfirm(false);
    setPreviewUser(null);
  }, [isOpen, currentUser]);

  // Live availability for profile username edit
  const myUsernameAvailability = useMemo(() => {
    if (!myUsername.trim()) return null;
    if (myUsername.trim().toLowerCase() === currentUser.username.toLowerCase()) {
      return { isAvailable: true, message: 'Username saat ini milik Anda' };
    }
    return checkUsernameAvailability(myUsername, currentUser.id);
  }, [myUsername, currentUser.id, currentUser.username]);

  // Live availability for new user creation
  const newUsernameAvailability = useMemo(() => {
    if (!newUsername.trim()) return null;
    return checkUsernameAvailability(newUsername);
  }, [newUsername]);

  // Live availability for Bamin editing by Admin Utama
  const baminUsernameAvailability = useMemo(() => {
    if (!baminToEdit || !baminUsername.trim()) return null;
    if (baminUsername.trim().toLowerCase() === baminToEdit.username.toLowerCase()) {
      return { isAvailable: true, message: 'Username saat ini milik Bamin' };
    }
    return checkUsernameAvailability(baminUsername, baminToEdit.id);
  }, [baminToEdit, baminUsername]);

  // Deduplicated users list
  const uniqueUsers = useMemo(() => {
    const seen = new Set<string>();
    return usersList.filter((u) => {
      if (!u || !u.id || seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [usersList]);

  const isAdmin = currentUser.role === 'admin';
  const isPrimaryAdmin =
    Boolean(currentUser.isPrimaryAdmin) || currentUser.username.toLowerCase() === 'zulfi';
  const pendingUsers = uniqueUsers.filter((u) => u.status === 'pending');
  const activeUsers = uniqueUsers.filter((u) => u.status !== 'pending');
  const adminUsersCount = uniqueUsers.filter((u) => u.role === 'admin').length;

  const filteredActiveUsers = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return activeUsers;
    return activeUsers.filter(
      (u) =>
        u.namaLengkap.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.pangkat || '').toLowerCase().includes(q) ||
        getRoleDisplayName(u).toLowerCase().includes(q)
    );
  }, [activeUsers, listSearch]);

  // Keep resolved latest currentUser object from usersList so avatarUrl updates immediately
  const liveCurrentUser = useMemo(() => {
    return uniqueUsers.find((u) => u.id === currentUser.id) || currentUser;
  }, [uniqueUsers, currentUser]);

  if (!isOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleMyPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingMyPhoto(true);
    try {
      const compressedDataUrl = await compressProfilePhotoToDataUrl(file, 256, 0.8);
      const res = updateUserAvatar(currentUser.id, compressedDataUrl);
      if (res.success && res.updatedUser) {
        if (res.updatedUsers) setUsersList(res.updatedUsers);
        onCurrentUserUpdated?.(res.updatedUser);
        onUsersUpdated?.();
        showNotification(res.message);
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Gagal memproses foto profil.',
        'error'
      );
    } finally {
      setIsUploadingMyPhoto(false);
    }
  };

  const handleRemoveMyPhoto = () => {
    const res = updateUserAvatar(currentUser.id, null);
    if (res.success && res.updatedUser) {
      if (res.updatedUsers) setUsersList(res.updatedUsers);
      onCurrentUserUpdated?.(res.updatedUser);
      onUsersUpdated?.();
      showNotification(res.message);
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleNewUserPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingNewPhoto(true);
    try {
      const compressedDataUrl = await compressProfilePhotoToDataUrl(file, 256, 0.8);
      setNewAvatarUrl(compressedDataUrl);
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Gagal memproses foto user baru.',
        'error'
      );
    } finally {
      setIsUploadingNewPhoto(false);
    }
  };

  const handleUpdateMyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (myUsernameAvailability && !myUsernameAvailability.isAvailable) {
      showNotification(myUsernameAvailability.message, 'error');
      return;
    }

    const res = updateOwnUserProfile(currentUser.id, {
      username: myUsername,
      password: myPassword.trim() || undefined,
      namaLengkap: myNama,
      pangkat: myPangkat,
    });

    if (res.success && res.updatedUser) {
      if (res.updatedUsers) setUsersList(res.updatedUsers);
      showNotification(res.message);
      setMyPassword('');
      onCurrentUserUpdated?.(res.updatedUser);
      onUsersUpdated?.();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleDeleteSelf = () => {
    if (isPrimaryAdmin) {
      showNotification(
        'Sebagai Administrator Utama, Anda tidak dapat menghapus akun Anda sendiri!',
        'error'
      );
      return;
    }

    const res = deleteOwnUserAccount(currentUser.id);
    if (res.success) {
      showNotification(res.message);
      setShowDeleteSelfConfirm(false);
      onClose();
      onLogout?.();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleOpenEditBamin = (user: AppUser) => {
    setBaminToEdit(user);
    setBaminUsername(user.username);
    setBaminPassword('');
    setBaminNama(user.namaLengkap);
    setBaminPangkat(user.pangkat || 'Serda');
    setShowBaminPassword(false);
  };

  const handleSaveBamin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baminToEdit) return;
    if (baminUsernameAvailability && !baminUsernameAvailability.isAvailable) {
      showNotification(baminUsernameAvailability.message, 'error');
      return;
    }

    const res = updateAdmin2Credentials(currentUser.id, baminToEdit.id, {
      username: baminUsername,
      password: baminPassword.trim() || undefined,
      namaLengkap: baminNama,
      pangkat: baminPangkat,
    });

    if (res.success) {
      showNotification(res.message, 'success');
      setBaminToEdit(null);
      if (res.updatedUsers) {
        setUsersList(res.updatedUsers);
      }
      onUsersUpdated?.();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleApprove = (userId: string) => {
    if (!isAdmin) return;
    const updated = approvePendingUser(userId);
    setUsersList(updated);
    showNotification('User berhasil disetujui dan kini dapat login!');
    onUsersUpdated?.();
  };

  const handleReject = (userId: string) => {
    if (!isAdmin) return;
    const updated = rejectPendingUser(userId);
    setUsersList(updated);
    showNotification('Permohonan user ditolak.', 'error');
    onUsersUpdated?.();
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete || !isAdmin) return;

    if (userToDelete.isPrimaryAdmin || userToDelete.username.toLowerCase() === 'zulfi') {
      showNotification('Administrator Utama tidak dapat dihapus oleh siapapun!', 'error');
      setUserToDelete(null);
      return;
    }

    if (userToDelete.role === 'admin' && !isPrimaryAdmin) {
      showNotification(
        'Hanya Administrator Utama yang berhak menghapus Admin 2 (Bamin)!',
        'error'
      );
      setUserToDelete(null);
      return;
    }

    const res = deleteUserAccount(currentUser.id, userToDelete.id);
    if (res.success) {
      setUsersList(res.updatedUsers);
      showNotification(res.message);
      setUserToDelete(null);
      onUsersUpdated?.();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsernameAvailability && !newUsernameAvailability.isAvailable) {
      showNotification(newUsernameAvailability.message, 'error');
      return;
    }

    const res = registerNewUserRequest({
      username: newUsername,
      password: newPassword,
      namaLengkap: newNama,
      pangkat: newPangkat,
      notes: newNotes,
      avatarUrl: newAvatarUrl || undefined,
    });

    if (res.success) {
      const reloaded = loadUsersFromStorage();
      setUsersList(reloaded);
      showNotification(
        'Permohonan user baru dikirim! Foto & data tersimpan di Kotak Masuk Admin.'
      );
      setNewUsername('');
      setNewPassword('');
      setNewNama('');
      setNewNotes('');
      setNewAvatarUrl('');
      if (isAdmin) {
        setActiveTab('inbox');
      } else {
        setActiveTab('list');
      }
      onUsersUpdated?.();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const getRoleColorClass = (user: AppUser) => {
    if (user.isPrimaryAdmin || user.username.toLowerCase() === 'zulfi') {
      return 'text-amber-400';
    }
    if (user.role === 'admin') {
      return 'text-sky-400';
    }
    return 'text-[#00a884]';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-user-mgmt-title"
    >
      <div className="relative w-full max-w-[440px] h-[100dvh] bg-[#111b21] md:border-x md:border-[#2a3942] shadow-2xl overflow-hidden flex flex-col pt-safe pb-safe">
        {/* WhatsApp Top App Bar */}
        <div className="h-14 px-2 sm:px-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Kembali"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#aebac1] hover:bg-[#2a3942] hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h3
                id="modal-user-mgmt-title"
                className="text-[16px] font-bold text-[#e9edef] leading-tight truncate"
              >
                Profil &amp; Tambah User
              </h3>
              <p className="text-[11.5px] text-[#8696a0] leading-tight truncate">
                {getRoleDisplayName(liveCurrentUser)} · {activeUsers.length} pengguna aktif
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Menu User"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#aebac1] hover:bg-[#2a3942] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Tab Bar */}
        <div
          role="tablist"
          aria-label="Menu Profil dan Pengguna"
          className={`bg-[#202c33] border-b border-[#2a3942] grid shrink-0 ${
            isAdmin ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`min-h-[48px] px-1.5 sm:px-3 py-2 text-[11px] sm:text-[13px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#00a884] text-[#00a884] bg-[#182229]/40'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <UserCog className="w-4 h-4 shrink-0" />
            <span>Profil</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
            className={`min-h-[48px] px-1.5 sm:px-3 py-2 text-[11px] sm:text-[13px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#00a884] text-[#00a884] bg-[#182229]/40'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Daftar ({activeUsers.length})</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inbox'}
              onClick={() => setActiveTab('inbox')}
              className={`min-h-[48px] px-1.5 sm:px-3 py-2 text-[11px] sm:text-[13px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'inbox'
                  ? 'border-[#00a884] text-[#00a884] bg-[#182229]/40'
                  : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <Inbox className="w-4 h-4 shrink-0" />
              <span>
                Masuk{pendingUsers.length > 0 ? ` (${pendingUsers.length})` : ''}
              </span>
            </button>
          )}

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            className={`min-h-[48px] px-1.5 sm:px-3 py-2 text-[11px] sm:text-[13px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#00a884] text-[#00a884] bg-[#182229]/40'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Tambah User</span>
          </button>
        </div>

        {/* Inline Toast Banner */}
        {toast && (
          <div
            role="status"
            className={`mx-4 mt-3 px-4 py-2.5 rounded-xl border text-[13px] font-medium flex items-center gap-2 shrink-0 ${
              toast.type === 'success'
                ? 'bg-[#00a884]/15 border-[#00a884]/40 text-[#00a884]'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1">{toast.text}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[#0b141a]">
          {/* TAB 1: PROFIL SAYA (WHATSAPP PROFILE SETTINGS) */}
          {activeTab === 'profile' && (
            <div className="max-w-lg mx-auto space-y-5">
              {/* WhatsApp Hero Circular Avatar + Camera Button */}
              <div className="flex flex-col items-center text-center pt-1 pb-2">
                <div className="relative">
                  <UserAvatar
                    user={liveCurrentUser}
                    size="xl"
                    onClick={() => setPreviewUser(liveCurrentUser)}
                    ariaLabel={`Lihat foto profil ${liveCurrentUser.namaLengkap}`}
                    className="shadow-xl"
                  />
                  <button
                    type="button"
                    onClick={() => myPhotoInputRef.current?.click()}
                    disabled={isUploadingMyPhoto}
                    aria-label="Ubah Foto Profil"
                    title="Ubah Foto Profil"
                    className="absolute bottom-0 right-0 w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#029474] text-[#111b21] shadow-lg flex items-center justify-center border-2 border-[#0b141a] transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={myPhotoInputRef}
                    id="input_my_profile_photo"
                    type="file"
                    accept="image/*"
                    aria-label="Unggah Foto Profil Saya"
                    onChange={handleMyPhotoChange}
                    className="sr-only"
                  />
                </div>

                <h4 className="mt-3 text-[18px] font-bold text-[#e9edef] leading-snug">
                  {liveCurrentUser.namaLengkap}
                </h4>
                <p className="text-[13px] text-[#8696a0] mt-0.5">
                  @{liveCurrentUser.username} · {liveCurrentUser.pangkat || 'Personel'} ·{' '}
                  <span className={`font-semibold ${getRoleColorClass(liveCurrentUser)}`}>
                    {getRoleDisplayName(liveCurrentUser)}
                  </span>
                </p>

                <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => myPhotoInputRef.current?.click()}
                    disabled={isUploadingMyPhoto}
                    className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[13px] font-medium text-[#00a884] flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isUploadingMyPhoto ? 'Memproses foto...' : 'Pilih Foto Profil'}</span>
                  </button>

                  {liveCurrentUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveMyPhoto}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#202c33] hover:bg-rose-950/50 border border-[#2a3942] text-[13px] font-medium text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ImageOff className="w-4 h-4" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Info Form Card */}
              <form
                onSubmit={handleUpdateMyProfile}
                className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div>
                  <p className="text-[12px] font-semibold text-[#00a884]">
                    Informasi Akun Anda
                  </p>
                  <p className="text-[12px] text-[#8696a0] mt-0.5">
                    Foto profil dan data di bawah otomatis tampil untuk seluruh pengguna di menu Daftar User.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="profile_username"
                    className="block text-[12px] font-medium text-[#8696a0] mb-1"
                  >
                    Username Login
                  </label>
                  <div className="relative">
                    <input
                      id="profile_username"
                      type="text"
                      required
                      value={myUsername}
                      onChange={(e) => setMyUsername(e.target.value)}
                      placeholder="Masukkan username..."
                      className={`w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border rounded-xl text-[14px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none transition-colors ${
                        myUsernameAvailability
                          ? myUsernameAvailability.isAvailable
                            ? 'border-[#00a884]/70 focus:border-[#00a884]'
                            : 'border-rose-500/80 focus:border-rose-500'
                          : 'border-[#2a3942] focus:border-[#00a884]'
                      }`}
                    />
                    {myUsernameAvailability && (
                      <div className="absolute right-3 top-3">
                        {myUsernameAvailability.isAvailable ? (
                          <Check className="w-4 h-4 text-[#00a884]" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {myUsernameAvailability && (
                    <p
                      className={`text-[11.5px] mt-1 ${
                        myUsernameAvailability.isAvailable ? 'text-[#00a884]' : 'text-rose-400'
                      }`}
                    >
                      {myUsernameAvailability.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="profile_nama"
                      className="block text-[12px] font-medium text-[#8696a0] mb-1"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      id="profile_nama"
                      type="text"
                      required
                      value={myNama}
                      onChange={(e) => setMyNama(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border border-[#2a3942] rounded-xl text-[14px] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile_pangkat"
                      className="block text-[12px] font-medium text-[#8696a0] mb-1"
                    >
                      Pangkat / Jabatan
                    </label>
                    <input
                      id="profile_pangkat"
                      type="text"
                      required
                      value={myPangkat}
                      onChange={(e) => setMyPangkat(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border border-[#2a3942] rounded-xl text-[14px] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile_password"
                    className="block text-[12px] font-medium text-[#8696a0] mb-1"
                  >
                    Password Baru (Kosongkan jika tidak diganti)
                  </label>
                  <div className="relative">
                    <input
                      id="profile_password"
                      type={showMyPassword ? 'text' : 'password'}
                      value={myPassword}
                      onChange={(e) => setMyPassword(e.target.value)}
                      placeholder="Masukkan password baru..."
                      className="w-full min-h-[44px] px-3.5 py-2 pr-11 bg-[#202c33] border border-[#2a3942] rounded-xl text-[14px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMyPassword((prev) => !prev)}
                      aria-label={showMyPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                      className="absolute right-1 top-0.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] cursor-pointer"
                    >
                      {showMyPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={Boolean(myUsernameAvailability && !myUsernameAvailability.isAvailable)}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-xl text-[14px] font-bold bg-[#00a884] hover:bg-[#029474] text-[#111b21] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan Perubahan Profil
                </button>
              </form>

              {/* Self-Deletion Zone (Hidden/blocked for Administrator Utama) */}
              {!isPrimaryAdmin && (
                <div className="bg-[#111b21] border border-rose-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[13.5px] font-bold text-rose-300">
                        Hapus Akun Saya Secara Permanen
                      </h5>
                      <p className="text-[12px] text-[#8696a0] mt-0.5">
                        {isAdmin
                          ? 'Anda login sebagai Admin 2 (Bamin). Menghapus akun akan langsung mengeluarkan Anda dari sesi ini.'
                          : 'Akun Anda akan dihapus dari daftar user dan otomatis logout.'}
                      </p>
                    </div>
                  </div>

                  {!showDeleteSelfConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteSelfConfirm(true)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Akun Saya</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2.5">
                      <p className="text-[12.5px] font-semibold text-rose-200">
                        Konfirmasi hapus akun @{currentUser.username}? Tindakan ini permanen.
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleDeleteSelf}
                          className="min-h-[40px] px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Ya, Hapus &amp; Logout</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteSelfConfirm(false)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] text-[12.5px] font-medium cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAFTAR USER (WHATSAPP CONTACTS / MEMBERS LIST — ALL ROLES CAN SEE PHOTOS!) */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* WhatsApp Search + Quiet Metadata Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder="Cari pengguna, pangkat, atau username..."
                    aria-label="Cari pengguna"
                    className="w-full min-h-[44px] pl-10 pr-9 py-2 bg-[#202c33] border border-[#2a3942] rounded-xl text-[13.5px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  />
                  {listSearch && (
                    <button
                      type="button"
                      onClick={() => setListSearch('')}
                      aria-label="Hapus pencarian user"
                      className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8696a0] hover:text-[#e9edef] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-[12px] text-[#8696a0] px-1 shrink-0 tabular-nums">
                  {filteredActiveUsers.length} pengguna · Admin {adminUsersCount}/2 · Ketuk foto untuk perbesar
                </div>
              </div>

              {/* Admin 2 (Bamin) Edit Modal Inline Sheet */}
              {baminToEdit && isPrimaryAdmin && (
                <div className="p-4 rounded-2xl bg-[#202c33] border border-sky-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-sky-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      <span>Edit Akun Admin 2 ({baminToEdit.namaLengkap})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setBaminToEdit(null)}
                      aria-label="Batal edit Admin 2"
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#8696a0] hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveBamin} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] text-[#8696a0] mb-1">
                        Username Admin 2
                      </label>
                      <input
                        type="text"
                        required
                        value={baminUsername}
                        onChange={(e) => setBaminUsername(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-1.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-[13.5px] text-[#e9edef] focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] text-[#8696a0] mb-1">
                        Password Baru (Opsional)
                      </label>
                      <div className="relative">
                        <input
                          type={showBaminPassword ? 'text' : 'password'}
                          value={baminPassword}
                          onChange={(e) => setBaminPassword(e.target.value)}
                          placeholder="Kosongkan jika tetap"
                          className="w-full min-h-[42px] px-3 py-1.5 pr-10 bg-[#111b21] border border-[#2a3942] rounded-xl text-[13.5px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-sky-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowBaminPassword((p) => !p)}
                          aria-label={showBaminPassword ? 'Sembunyikan Password Bamin' : 'Lihat Password Bamin'}
                          className="absolute right-1 top-0.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8696a0] cursor-pointer"
                        >
                          {showBaminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11.5px] text-[#8696a0] mb-1">Nama</label>
                      <input
                        type="text"
                        required
                        value={baminNama}
                        onChange={(e) => setBaminNama(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-1.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-[13.5px] text-[#e9edef] focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] text-[#8696a0] mb-1">Pangkat</label>
                      <input
                        type="text"
                        required
                        value={baminPangkat}
                        onChange={(e) => setBaminPangkat(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-1.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-[13.5px] text-[#e9edef] focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setBaminToEdit(null)}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#111b21] text-[#aebac1] text-[13px] font-medium cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={Boolean(baminUsernameAvailability && !baminUsernameAvailability.isAvailable)}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[13px] font-bold cursor-pointer"
                      >
                        Simpan Akun Bamin
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* User Deletion Confirm Box */}
              {userToDelete && (
                <div className="p-4 rounded-2xl bg-rose-950/35 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-[13px] text-rose-200">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      Hapus akun <strong>{userToDelete.namaLengkap}</strong> (@{userToDelete.username}) secara permanen?
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setUserToDelete(null)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#202c33] text-[#e9edef] text-[12.5px] font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteUser}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[12.5px] font-bold cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                  </div>
                </div>
              )}

              {/* WhatsApp Contacts Rows */}
              <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl divide-y divide-[#222e35] overflow-hidden">
                {filteredActiveUsers.length === 0 ? (
                  <div className="py-12 px-4 text-center text-[13.5px] text-[#8696a0]">
                    Tidak ada pengguna yang cocok dengan pencarian Anda.
                  </div>
                ) : (
                  filteredActiveUsers.map((user) => {
                    const isRowPrimary =
                      Boolean(user.isPrimaryAdmin) || user.username.toLowerCase() === 'zulfi';
                    const isSelf = user.id === currentUser.id;
                    const isRowAdmin2 = user.role === 'admin' && !isRowPrimary;

                    return (
                      <div
                        key={user.id}
                        className="px-3.5 sm:px-4 py-3 flex items-center gap-3.5 hover:bg-[#202c33]/60 transition-colors"
                      >
                        {/* Clickable WhatsApp Avatar */}
                        <UserAvatar
                          user={user}
                          size="md"
                          onClick={() => setPreviewUser(user)}
                          ariaLabel={`Lihat foto profil ${user.namaLengkap}`}
                        />

                        {/* Main User Identity */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-semibold text-[#e9edef] truncate">
                            {user.namaLengkap}
                            {isSelf && (
                              <span className="ml-1.5 text-[12px] font-medium text-[#00a884]">
                                (Anda)
                              </span>
                            )}
                          </p>

                          <p className="text-[12px] text-[#8696a0] truncate mt-0.5">
                            <span className={`font-semibold ${getRoleColorClass(user)}`}>
                              {getRoleDisplayName(user)}
                            </span>
                            {' · '}@{user.username}
                            {' · '}
                            {user.pangkat || 'Personel'}
                          </p>
                        </div>

                        {/* Contextual Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isSelf && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('profile')}
                              aria-label="Ubah profil dan foto saya"
                              title="Ubah Profil & Foto"
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#00a884] hover:bg-[#2a3942] transition-colors cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}

                          {isRowPrimary && !isSelf && (
                            <span
                              title="Akun Administrator Utama dilindungi"
                              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-amber-400/80"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}

                          {isAdmin && isRowAdmin2 && isPrimaryAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditBamin(user)}
                                aria-label={`Edit kredensial ${user.namaLengkap}`}
                                title="Edit Admin 2"
                                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-sky-400 hover:bg-[#2a3942] transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserToDelete(user)}
                                aria-label={`Hapus ${user.namaLengkap}`}
                                title="Hapus Admin 2"
                                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isAdmin && user.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              aria-label={`Hapus ${user.namaLengkap}`}
                              title={`Hapus ${user.namaLengkap}`}
                              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KOTAK MASUK PERSETUJUAN (ADMIN ONLY) */}
          {activeTab === 'inbox' && isAdmin && (
            <div className="space-y-4">
              <div className="text-[12.5px] text-[#8696a0] px-1">
                Permohonan pendaftaran akun baru yang menunggu persetujuan Admin.
              </div>

              {pendingUsers.length === 0 ? (
                <div className="py-14 text-center rounded-2xl bg-[#111b21] border border-[#2a3942]">
                  <Inbox className="w-10 h-10 text-[#8696a0]/50 mx-auto mb-2.5" />
                  <p className="text-[14px] font-semibold text-[#e9edef]">Kotak Masuk Kosong</p>
                  <p className="text-[12.5px] text-[#8696a0] mt-1">
                    Tidak ada pengajuan akun baru saat ini.
                  </p>
                </div>
              ) : (
                <div className="bg-[#111b21] border border-[#2a3942] rounded-2xl divide-y divide-[#222e35] overflow-hidden">
                  {pendingUsers.map((user, idx) => (
                    <div
                      key={`${user.id}-${idx}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <UserAvatar
                          user={user}
                          size="md"
                          onClick={() => setPreviewUser(user)}
                          ariaLabel={`Lihat foto calon user ${user.namaLengkap}`}
                        />
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-[14.5px] font-semibold text-[#e9edef] truncate">
                            {user.namaLengkap}
                          </p>
                          <p className="text-[12.5px] text-[#8696a0] truncate">
                            @{user.username} · {user.pangkat || 'Personel'}
                          </p>
                          <p className="text-[12px] text-[#aebac1]">
                            Catatan: {user.notes || '-'}
                          </p>
                          <p className="text-[11px] text-[#8696a0]">
                            Diajukan {user.createdAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApprove(user.id)}
                          className="min-h-[42px] px-4 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#029474] text-[#111b21] text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Setujui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(user.id)}
                          className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TAMBAH USER BARU (WHATSAPP "KONTAK BARU" STYLE) */}
          {activeTab === 'create' && (
            <div className="max-w-lg mx-auto space-y-5">
              <form
                onSubmit={handleCreateNewUser}
                className="bg-[#111b21] border border-[#2a3942] rounded-2xl p-4 sm:p-5 space-y-4"
              >
                {/* Optional Initial Photo Picker */}
                <div className="flex flex-col items-center text-center pb-2 border-b border-[#222e35]">
                  <div className="relative">
                    <UserAvatar
                      user={{
                        namaLengkap: newNama || newUsername || 'User Baru',
                        username: newUsername || 'user',
                        role: 'user',
                        avatarUrl: newAvatarUrl || undefined,
                      }}
                      size="lg"
                    />
                    <button
                      type="button"
                      onClick={() => newPhotoInputRef.current?.click()}
                      disabled={isUploadingNewPhoto}
                      aria-label="Pilih Foto User Baru"
                      className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#029474] text-[#111b21] flex items-center justify-center border-2 border-[#111b21] cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={newPhotoInputRef}
                      type="file"
                      accept="image/*"
                      aria-label="Unggah Foto User Baru"
                      onChange={handleNewUserPhotoChange}
                      className="sr-only"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => newPhotoInputRef.current?.click()}
                      className="text-[12.5px] font-medium text-[#00a884] hover:underline cursor-pointer"
                    >
                      {isUploadingNewPhoto
                        ? 'Memproses foto...'
                        : newAvatarUrl
                          ? 'Ganti Foto User'
                          : 'Tambah Foto User (Opsional)'}
                    </button>
                    {newAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setNewAvatarUrl('')}
                        className="text-[12px] text-rose-400 hover:underline cursor-pointer"
                      >
                        · Hapus
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-[#8696a0] mt-1">
                    {isAdmin
                      ? 'Ajukan akun operator baru. Permohonan akan masuk ke Kotak Masuk untuk disetujui.'
                      : 'Ajukan akun baru untuk rekan operator. Permohonan akan diverifikasi oleh Admin.'}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="new_user_username"
                    className="block text-[12px] font-medium text-[#8696a0] mb-1"
                  >
                    Username Baru
                  </label>
                  <div className="relative">
                    <input
                      id="new_user_username"
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Contoh: ton_ang942, provost_kima..."
                      className={`w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border rounded-xl text-[14px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none transition-colors ${
                        newUsernameAvailability
                          ? newUsernameAvailability.isAvailable
                            ? 'border-[#00a884]/70 focus:border-[#00a884]'
                            : 'border-rose-500/80 focus:border-rose-500'
                          : 'border-[#2a3942] focus:border-[#00a884]'
                      }`}
                    />
                    {newUsernameAvailability && (
                      <div className="absolute right-3 top-3">
                        {newUsernameAvailability.isAvailable ? (
                          <Check className="w-4 h-4 text-[#00a884]" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    )}
                  </div>
                  {newUsernameAvailability && (
                    <p
                      className={`text-[11.5px] mt-1 ${
                        newUsernameAvailability.isAvailable ? 'text-[#00a884]' : 'text-rose-400'
                      }`}
                    >
                      {newUsernameAvailability.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="new_user_password"
                    className="block text-[12px] font-medium text-[#8696a0] mb-1"
                  >
                    Password Akun
                  </label>
                  <input
                    id="new_user_password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter..."
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border border-[#2a3942] rounded-xl text-[14px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="new_user_nama"
                      className="block text-[12px] font-medium text-[#8696a0] mb-1"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      id="new_user_nama"
                      type="text"
                      required
                      value={newNama}
                      onChange={(e) => setNewNama(e.target.value)}
                      placeholder="Nama personel..."
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border border-[#2a3942] rounded-xl text-[14px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new_user_pangkat"
                      className="block text-[12px] font-medium text-[#8696a0] mb-1"
                    >
                      Pangkat
                    </label>
                    <input
                      id="new_user_pangkat"
                      type="text"
                      required
                      value={newPangkat}
                      onChange={(e) => setNewPangkat(e.target.value)}
                      placeholder="Serda, Prada..."
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border border-[#2a3942] rounded-xl text-[14px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new_user_notes"
                    className="block text-[12px] font-medium text-[#8696a0] mb-1"
                  >
                    Catatan Seksi Organik
                  </label>
                  <input
                    id="new_user_notes"
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Contoh: Piket Ton Hub, Bamin Kompi..."
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#202c33] border border-[#2a3942] rounded-xl text-[14px] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={Boolean(
                    newUsernameAvailability && !newUsernameAvailability.isAvailable
                  )}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-xl text-[14px] font-bold bg-[#00a884] hover:bg-[#029474] text-[#111b21] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kirim Permohonan User Baru
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Photo Lightbox Viewer */}
      {previewUser && (
        <div
          className="fixed inset-0 z-[60] bg-[#0b141a]/95 backdrop-blur-md flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`Pratinjau foto profil ${previewUser.namaLengkap}`}
        >
          <div className="h-14 px-3 sm:px-6 bg-[#111b21]/90 border-b border-[#2a3942] flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#e9edef] truncate">
                {previewUser.namaLengkap}
              </p>
              <p className="text-[12px] text-[#8696a0] truncate">
                @{previewUser.username} · {previewUser.pangkat || 'Personel'} ·{' '}
                {getRoleDisplayName(previewUser)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewUser(null)}
              aria-label="Tutup Pratinjau Foto"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#aebac1] hover:bg-[#202c33] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            {previewUser.avatarUrl ? (
              <img
                src={previewUser.avatarUrl}
                alt={`Foto profil ${previewUser.namaLengkap}`}
                className="w-72 h-72 sm:w-96 sm:h-96 rounded-2xl object-cover border border-[#2a3942] shadow-2xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <UserAvatar user={previewUser} size="xl" />
                <p className="text-[13px] text-[#8696a0]">
                  Pengguna ini belum mengunggah foto profil.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
