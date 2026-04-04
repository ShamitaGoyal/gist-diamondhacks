import { Sparkles } from 'lucide-react';

interface LensTriggerProps {
  position: { x: number; y: number };
  onExplain: () => void;
  onClose: () => void;
}

export function LensTrigger({ position, onExplain, onClose }: LensTriggerProps) {
  return (
    <div
      className="absolute z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`
      }}
    >
      <button
        onClick={() => {
          onExplain();
          onClose();
        }}
        className="px-3 py-2 bg-[#1E293B] text-white rounded-full text-[12px] flex items-center gap-2 hover:bg-[#334155] transition-colors shadow-lg border border-[#475569]"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
      >
        <Sparkles className="w-3 h-3" />
        <span>Explain</span>
      </button>
    </div>
  );
}
