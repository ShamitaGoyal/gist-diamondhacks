import { ArrowRight } from 'lucide-react';

interface LogicNode {
  label: string;
  type: 'variable' | 'result';
}

interface LogicCompilerCardProps {
  nodes: LogicNode[];
  connector?: '+' | '-' | '→';
  summary: string;
  category?: 'method' | 'result' | 'theory';
}

export function LogicCompilerCard({ nodes, connector = '→', summary, category = 'theory' }: LogicCompilerCardProps) {
  const getBorderColor = () => {
    switch (category) {
      case 'method':
        return '#0D9488'; // Teal
      case 'result':
        return '#EA580C'; // Amber/Orange
      case 'theory':
        return '#6366F1'; // Indigo
      default:
        return '#E2E8F0';
    }
  };

  const getBackgroundColor = () => {
    switch (category) {
      case 'method':
        return '#F0FDFA';
      case 'result':
        return '#FFF7ED';
      case 'theory':
        return '#EEF2FF';
      default:
        return '#F8FAFC';
    }
  };

  return (
    <div
      className="bg-white rounded-[4px] overflow-hidden"
      style={{ border: `1px solid ${getBorderColor()}` }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b"
        style={{
          borderBottomColor: getBorderColor(),
          backgroundColor: getBackgroundColor()
        }}
      >
        <span
          className="text-[10px]"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            color: getBorderColor()
          }}
        >
          // LOGIC_DEBUG.{category.toUpperCase()}
        </span>
      </div>

      {/* Circuit Sketch / Node Tree */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {nodes.map((node, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="px-3 py-1.5 rounded-[4px] border"
                style={{
                  borderColor: node.type === 'variable' ? '#0D9488' : getBorderColor(),
                  backgroundColor: node.type === 'variable' ? '#F0FDFA' : getBackgroundColor()
                }}
              >
                <span
                  className="text-[12px]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {node.label}
                </span>
              </div>

              {index < nodes.length - 1 && (
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-[#64748B]" />
                  <span
                    className="text-[10px] text-[#64748B]"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {connector}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-[#E2E8F0]">
          <p
            className="text-[12px] text-[#334155] leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
