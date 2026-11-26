import React from 'react';
import { MessageSquareText, PieChart, FolderPlus, Database } from 'lucide-react';

export type ActiveTab = 'apel' | 'ringkasan' | 'kelola' | 'database';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  totalCount: number;
  duplicateCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  totalCount,
  duplicateCount,
}) => {
  const tabs: {
    id: ActiveTab;
    label: string;
    ariaLabel?: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'apel',
      label: 'Apel',
      icon: <MessageSquareText className="w-5 h-5" />,
      badge: duplicateCount > 0 ? duplicateCount : undefined,
    },
    {
      id: 'ringkasan',
      label: 'Ringkasan',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      id: 'kelola',
      label: 'Kelola',
      ariaLabel: 'Kelola Paten dan Sub Keterangan',
      icon: <FolderPlus className="w-5 h-5" />,
    },
    {
      id: 'database',
      label: 'Database',
      icon: <Database className="w-5 h-5" />,
      badge: totalCount,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="shrink-0 z-40 bg-[var(--wa-card)] border-t border-[var(--wa-border)] pb-safe transition-colors"
    >
      <div className="grid grid-cols-4 h-[56px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              aria-label={tab.ariaLabel || tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[44px] px-1 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[var(--wa-accent)]'
                  : 'text-[var(--wa-muted)] hover:text-[var(--wa-text)]'
              }`}
            >
              <div
                className="relative px-3.5 py-1 rounded-full transition-colors"
                style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--wa-accent) 16%, transparent)' } : undefined}
              >
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && tab.id === 'apel' && (
                  <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-[#0b141a] text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] leading-none mt-1 whitespace-nowrap ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div
        data-testid="watermark-bottom"
        className="border-t border-[var(--wa-border)]/45 py-1 px-3 text-center select-none pointer-events-none"
      >
        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--wa-muted)]/85">
          Artalibas Core YTP 942
        </span>
      </div>
    </nav>
  );
};
