import React, { useEffect, useState } from 'react';
import { AppUser } from '../types/auth';
import {
  getAvatarRoleColors,
  getInitials,
  isValidAvatarDataUrl,
} from '../utils/imageUtils';

interface UserAvatarProps {
  user?: Pick<AppUser, 'namaLengkap' | 'username' | 'role' | 'isPrimaryAdmin' | 'avatarUrl'> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-28 h-28 text-3xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  onClick,
  ariaLabel,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.avatarUrl]);

  const hasPhoto = Boolean(
    user?.avatarUrl && isValidAvatarDataUrl(user.avatarUrl) && !imageError
  );
  const colors = getAvatarRoleColors(user);
  const initials = getInitials(user?.namaLengkap || user?.username);

  const innerContent = hasPhoto ? (
    <img
      src={user!.avatarUrl}
      alt={`Foto profil ${user?.namaLengkap || user?.username || 'pengguna'}`}
      onError={() => setImageError(true)}
      className="w-full h-full object-cover"
    />
  ) : (
    <span className={`font-bold tracking-tight select-none ${colors.text}`}>
      {initials}
    </span>
  );

  const baseClass = `relative rounded-full overflow-hidden flex items-center justify-center shrink-0 border ${
    hasPhoto ? 'border-[#2a3942] bg-[#111b21]' : `${colors.bg} ${colors.ring}`
  } ${SIZE_CLASSES[size]} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={
          ariaLabel ||
          `Lihat foto profil ${user?.namaLengkap || user?.username || 'pengguna'}`
        }
        className={`${baseClass} cursor-pointer hover:ring-2 hover:ring-[#00a884]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884] transition-transform active:scale-95`}
      >
        {innerContent}
      </button>
    );
  }

  return <div className={baseClass}>{innerContent}</div>;
};
