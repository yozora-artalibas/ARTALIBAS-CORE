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
      className="shrink-0 z-40 bg-[#111b21] border-t border-[#2a3942] pb-safe"
    >
      <div className="grid grid-cols-4 h-[62px]">
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
                isActive ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <div
                className={`relative px-3.5 py-1 rounded-full transition-colors ${
                  isActive ? 'bg-[#00a884]/15' : ''
                }`}
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
    </nav>
  );
};
