interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

interface StructuralTreeProps {
  nodes: TreeNode[];
  onNodeClick?: (nodeId: string) => void;
}

export function StructuralTree({ nodes, onNodeClick }: StructuralTreeProps) {
  const renderNode = (node: TreeNode, depth: number = 0) => (
    <div key={node.id} className="relative">
      {/* Node */}
      <button
        onClick={() => onNodeClick?.(node.id)}
        className="flex items-center gap-2 py-2 px-3 hover:bg-[#F8FAFC] rounded-[6px] transition-colors group"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {depth > 0 && (
          <div className="absolute left-0 top-1/2 w-2 h-[0.5px] bg-[#E2E8F0]" />
        )}

        <div className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-full group-hover:border-[#6366F1] transition-colors">
          <span
            className="text-[12px] text-[#334155] group-hover:text-[#6366F1]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {node.label}
          </span>
        </div>
      </button>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="relative">
          {depth > 0 && (
            <div
              className="absolute left-0 top-0 w-[0.5px] bg-[#E2E8F0]"
              style={{
                height: '100%',
                marginLeft: `${depth * 20}px`
              }}
            />
          )}
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4">
      <div className="space-y-1">
        {nodes.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
