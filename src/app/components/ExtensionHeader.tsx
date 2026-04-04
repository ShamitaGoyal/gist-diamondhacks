import { Settings, ChevronRight } from 'lucide-react';

interface ExtensionHeaderProps {
  activeTab: 'explain' | 'map' | 'critique' | 'chat';
  onTabChange: (tab: 'explain' | 'map' | 'critique' | 'chat') => void;
}

export function ExtensionHeader({ activeTab, onTabChange }: ExtensionHeaderProps) {
  const tabs = [
    { id: 'explain', label: 'Explain' },
    { id: 'map', label: 'Map' },
    { id: 'critique', label: 'Critique' },
    { id: 'chat', label: 'Chat' }
  ] as const;

  return (
    <div className="flex flex-col border-b" style={{ backgroundColor: 'var(--lens-surface)', borderColor: 'var(--lens-border)' }}>
      <div
        className="flex h-8 items-center justify-between border-b px-4"
        style={{ borderColor: 'var(--lens-border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--lens-accent)' }}
          >
            <div className="h-3 w-3 rounded-full border-2 border-white" />
          </div>

          <div className="flex items-center gap-1 text-[10px]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
            <span style={{ color: 'var(--lens-muted)' }}>Intro</span>
            <ChevronRight className="h-3 w-3" style={{ color: 'var(--lens-muted)' }} />
            <span style={{ color: 'var(--lens-fg)' }}>Section 2.1</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded transition-opacity hover:opacity-80"
            style={{ color: 'var(--lens-muted)' }}
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded transition-opacity hover:opacity-80"
            style={{ color: 'var(--lens-muted)' }}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </div>

      <div className="relative flex h-8 items-end gap-6 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="relative pb-1 text-[12px] transition-opacity hover:opacity-90"
            style={{
              fontFamily: 'var(--lens-font-body)',
              fontWeight: 500,
              color: activeTab === tab.id ? 'var(--lens-accent)' : 'var(--lens-muted)'
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: 'var(--lens-accent)' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
