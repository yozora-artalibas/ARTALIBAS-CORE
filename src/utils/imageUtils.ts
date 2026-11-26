import { AppUser } from '../types/auth';

export interface SquareCropRect {
  sx: number;
  sy: number;
  sSize: number;
  targetSize: number;
}

export function getInitials(name?: string | null): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return 'US';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function computeSquareCrop(
  width: number,
  height: number,
  maxTargetSize = 256
): SquareCropRect {
  const safeW = Math.max(1, Math.floor(width));
  const safeH = Math.max(1, Math.floor(height));
  const sSize = Math.min(safeW, safeH);
  const sx = Math.floor((safeW - sSize) / 2);
  const sy = Math.floor((safeH - sSize) / 2);
  const targetSize = Math.max(32, Math.min(maxTargetSize, sSize));
  return { sx, sy, sSize, targetSize };
}

export function validateImageFileMeta(
  mimeType: string,
  byteSize: number,
  maxBytes = 10 * 1024 * 1024
): { valid: boolean; message?: string } {
  if (!mimeType || !mimeType.toLowerCase().startsWith('image/')) {
    return {
      valid: false,
      message: 'File harus berupa gambar (JPG, PNG, WEBP, dll).',
    };
  }
  if (byteSize <= 0) {
    return { valid: false, message: 'File gambar kosong atau rusak.' };
  }
  if (byteSize > maxBytes) {
    return {
      valid: false,
      message: 'Ukuran file foto terlalu besar (maksimal 10 MB).',
    };
  }
  return { valid: true };
}

export function isValidAvatarDataUrl(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/')
  );
}

export function getAvatarRoleColors(
  user?: Pick<AppUser, 'role' | 'isPrimaryAdmin' | 'username'> | null
): { bg: string; text: string; ring: string } {
  if (!user) {
    return {
      bg: 'bg-[#2a3942]',
      text: 'text-[#e9edef]',
      ring: 'border-[#3b4a54]',
    };
  }
  const isPrimary =
    user.isPrimaryAdmin || user.username.toLowerCase() === 'zulfi';
  if (isPrimary) {
    return {
      bg: 'bg-amber-600/30',
      text: 'text-amber-300',
      ring: 'border-amber-500/40',
    };
  }
  if (user.role === 'admin') {
    return {
      bg: 'bg-sky-600/30',
      text: 'text-sky-300',
      ring: 'border-sky-500/40',
    };
  }
  return {
    bg: 'bg-[#00a884]/25',
    text: 'text-[#00a884]',
    ring: 'border-[#00a884]/40',
  };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar yang dipilih.'));
    img.src = src;
  });
}

/**
 * Compresses and center-crops any uploaded image into a compact 256x256 JPEG data URL
 * so multiple user avatars fit safely inside browser localStorage.
 */
export async function compressProfilePhotoToDataUrl(
  file: File,
  maxTargetSize = 256,
  quality = 0.8
): Promise<string> {
  const check = validateImageFileMeta(file.type, file.size);
  if (!check.valid) {
    throw new Error(check.message || 'File foto tidak valid.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const { sx, sy, sSize, targetSize } = computeSquareCrop(
      width,
      height,
      maxTargetSize
    );

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung pemrosesan gambar.');
    }

    // Fill crisp neutral background in case source PNG has transparency
    ctx.fillStyle = '#111b21';
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, targetSize, targetSize);

    const jpegUrl = canvas.toDataURL('image/jpeg', quality);
    if (jpegUrl && jpegUrl.startsWith('data:image/')) {
      return jpegUrl;
    }
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function computeScaledDimensions(
  width: number,
  height: number,
  maxWidth = 720,
  maxHeight = 1280
): { width: number; height: number } {
  const safeW = Math.max(1, Math.floor(width));
  const safeH = Math.max(1, Math.floor(height));
  const ratio = Math.min(maxWidth / safeW, maxHeight / safeH, 1);
  return {
    width: Math.max(1, Math.round(safeW * ratio)),
    height: Math.max(1, Math.round(safeH * ratio)),
  };
}

/**
 * Compresses any phone wallpaper photo preserving aspect ratio so it renders sharply
 * inside the mobile viewport while fitting comfortably inside localStorage.
 */
export async function compressWallpaperToDataUrl(
  file: File,
  maxWidth = 720,
  maxHeight = 1280,
  quality = 0.78
): Promise<string> {
  const check = validateImageFileMeta(file.type, file.size);
  if (!check.valid) {
    throw new Error(check.message || 'File gambar tidak valid.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const { width, height } = computeScaledDimensions(naturalW, naturalH, maxWidth, maxHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung pemrosesan gambar.');
    }

    ctx.drawImage(img, 0, 0, width, height);
    const jpegUrl = canvas.toDataURL('image/jpeg', quality);
    if (jpegUrl && jpegUrl.startsWith('data:image/')) {
      return jpegUrl;
    }
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

