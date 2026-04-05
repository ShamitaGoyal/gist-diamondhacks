import { Sparkles, Network, MessageCircle } from "lucide-react";
import type { ExplainVisualPayload } from "@/lib/pdfLensApi";
import ExplainTab from "./ExplainTab";
import ArchitectureTab, { type TreeNode } from "./ArchitectureTab";
import ChatTab from "./ChatTab";

interface SidePanelProps {
  /** Passage text for Explain tab chrome (not highlight id) */
  selectionPreview: string | null;
  explanation: {
    quote: string;
    visual?: React.ReactNode;
    apiVisual?: ExplainVisualPayload | null;
    plain: string;
    followups: string[];
  } | null;
  isLoading: boolean;
  activeTab: "explain" | "architecture" | "chat";
  onTabChange: (tab: "explain" | "architecture" | "chat") => void;
  chatInitialMessage?: string | null;
  onClearChatInitial?: () => void;
  activeSectionId: string | null;
  onNodeClick: (sectionId: string) => void;
  archNodesFromApi?: TreeNode[] | null;
  archTitleFromApi?: string | null;
  archLoading?: boolean;
  archError?: string | null;
  paperContext: string;
  /** Stable key so Chat remounts when the document source changes (e.g. new upload). */
  chatTabKey: string;
  architectureFallbackNodes: TreeNode[];
  architectureFallbackTitle: string;
  chatWelcomeMessage: string;
  chatSuggestions: string[];
}

const tabs = [
  { id: "explain" as const, label: "Explain", icon: <Sparkles className="w-3 h-3" /> },
  { id: "architecture" as const, label: "Architecture", icon: <Network className="w-3 h-3" /> },
  { id: "chat" as const, label: "Chat", icon: <MessageCircle className="w-3 h-3" /> },
];

const SidePanel = ({
  selectionPreview,
  explanation,
  isLoading,
  activeTab,
  onTabChange,
  chatInitialMessage,
  onClearChatInitial,
  activeSectionId,
  onNodeClick,
  archNodesFromApi,
  archTitleFromApi,
  archLoading,
  archError,
  paperContext,
  chatTabKey,
  architectureFallbackNodes,
  architectureFallbackTitle,
  chatWelcomeMessage,
  chatSuggestions,
}: SidePanelProps) => {
  return (
    <div className="w-[348px] shrink-0 flex flex-col bg-surface">
      {/* Top bar */}
      <div className="h-[42px] bg-surface-2 border-b border-border flex items-center px-4 gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-accent-mid" />
        <span className="text-xs font-semibold text-foreground tracking-tight">PDF Lens</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide" style={{ background: 'hsl(142 70% 95%)', color: 'hsl(142 70% 18%)' }}>
          Gemini 2.0
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-surface-2 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2.5 px-1.5 text-[11.5px] font-medium text-center cursor-pointer border-b-2 transition-all select-none tracking-tight flex items-center justify-center gap-1 ${
              activeTab === tab.id
                ? "text-accent-dark border-accent-mid bg-surface"
                : "text-text-tertiary border-transparent hover:text-text-secondary hover:bg-accent-light/30"
            }`}
          >
            {tab.icon && tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "explain" && (
        <ExplainTab selectionPreview={selectionPreview} explanation={explanation} isLoading={isLoading} />
      )}
      {activeTab === "architecture" && (
        <ArchitectureTab
          activeSectionId={activeSectionId}
          onNodeClick={onNodeClick}
          fallbackNodes={architectureFallbackNodes}
          fallbackTitle={architectureFallbackTitle}
          archNodesFromApi={archNodesFromApi}
          archTitleFromApi={archTitleFromApi}
          archLoading={archLoading}
          archError={archError}
        />
      )}
      {activeTab === "chat" && (
        <ChatTab
          key={chatTabKey}
          initialMessage={chatInitialMessage}
          onClearInitial={onClearChatInitial}
          paperContext={paperContext}
          welcomeMessage={chatWelcomeMessage}
          suggestions={chatSuggestions}
        />
      )}
    </div>
  );
};

export default SidePanel;
