import { useState, useCallback, useRef } from "react";
import PDFPane from "@/components/pdf-lens/PDFPane";
import SidePanel from "@/components/pdf-lens/SidePanel";

const sections = [
  {
    id: "abstract",
    title: "Abstract",
    paragraphs: [
      {
        text: "We present overview-detail interfaces (ODIs) as a foundational pattern in modern information systems. ODIs support a fundamental user behavior: scanning a broad collection to identify items of interest, then examining them in depth. They appear in email clients, calendars, shopping websites, and food delivery applications.",
        highlights: [{ text: "overview-detail interfaces (ODIs)", id: "hl-odi" }],
      },
    ],
  },
  {
    id: "intro",
    title: "1. Introduction",
    paragraphs: [
      {
        text: "Information systems increasingly demand interfaces that balance breadth with depth. ODIs serve this need by pairing a scannable overview pane with a coordinated detail view. The challenge lies in designing these interfaces to be both expressive and adaptable across contexts.",
        highlights: [],
      },
      {
        text: "The Meridian Framework proposes a specification language that separates content, composition, and layout into distinct, composable concerns — enabling a new class of malleable, stakeholder-aware interfaces.",
        highlights: [{ text: "The Meridian Framework proposes a specification language", id: "hl-meridian" }],
      },
    ],
  },
  {
    id: "what-odi",
    title: "2. What are ODIs?",
    paragraphs: [
      {
        text: "An overview-detail interface presents two coordinated views: a compact overview of a collection, and a detailed view of a selected item. The overview enables rapid scanning; the detail enables deep inspection. Selection in the overview drives the detail.",
        highlights: [],
      },
      {
        text: "Malleable ODIs allow reconfiguration by multiple stakeholders without modifying the underlying data model. This separates concerns cleanly: data owners control structure, designers control presentation, users control layout preferences.",
        highlights: [{ text: "Malleable ODIs allow reconfiguration", id: "hl-malleable" }],
      },
    ],
  },
  {
    id: "spec-lang",
    title: "3. The Specification Language",
    paragraphs: [
      {
        text: "Meridian's specification language describes interfaces declaratively. A Meridian spec defines: (1) the data bindings connecting content to interface elements, (2) the compositional rules governing how overview and detail are assembled, and (3) the layout constraints that determine spatial arrangement.",
        highlights: [],
      },
      {
        text: "Developers define data bindings. Designers specify visual composition. End users adjust layout preferences. Each operates independently within Meridian's layered model.",
        highlights: [],
      },
    ],
  },
  {
    id: "stakeholders",
    title: "4. Three Stakeholders",
    paragraphs: [
      {
        text: "Meridian identifies three stakeholders with distinct, non-overlapping roles. The developer owns data and logic. The designer owns visual structure and composition. The end user owns personal layout preferences and display density.",
        highlights: [],
      },
      {
        text: "The model ensures changes by one party do not break work done by others. This is Meridian's central contribution to malleable interface design.",
        highlights: [],
      },
    ],
  },
  {
    id: "tools",
    title: "5. Open-Source Tools",
    paragraphs: [
      {
        text: "We release Meridian as open-source. The release includes a CLI compiler that transforms Meridian specs into runtime components, a visual editor for designers, and a browser runtime library. All tools are available at the project repository.",
        highlights: [],
      },
      {
        text: "Adoption in both research prototypes and production deployments demonstrates Meridian's practical viability across scales.",
        highlights: [],
      },
    ],
  },
];

// Visual diagrams as React nodes
const ODIVisual = () => (
  <svg viewBox="0 0 280 180" className="w-full max-w-[260px]">
    {/* Lines */}
    <line x1="140" y1="50" x2="50" y2="90" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="50" x2="140" y2="90" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="50" x2="230" y2="90" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="120" x2="140" y2="140" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    {/* Big list node */}
    <rect x="75" y="12" width="130" height="42" rx="8" fill="hsl(var(--accent-light))" stroke="hsl(var(--accent-mid))" strokeWidth="1.5" />
    <text x="140" y="30" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(var(--accent-dark))">Big list (overview)</text>
    <text x="140" y="44" textAnchor="middle" fontSize="8" fill="hsl(var(--text-tertiary))">scan quickly</text>
    {/* Item 1 */}
    <rect x="15" y="90" width="70" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="50" y="109" textAnchor="middle" fontSize="9" fill="hsl(var(--text-secondary))">Item 1</text>
    {/* Selected */}
    <rect x="105" y="90" width="70" height="30" rx="6" fill="hsl(var(--accent-mid))" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" />
    <text x="140" y="109" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--primary-foreground))">Selected!</text>
    {/* Item 3 */}
    <rect x="195" y="90" width="70" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="230" y="109" textAnchor="middle" fontSize="9" fill="hsl(var(--text-secondary))">Item 3</text>
    {/* Full detail */}
    <rect x="85" y="140" width="110" height="30" rx="6" fill="hsl(var(--green-light))" stroke="hsl(var(--green))" strokeWidth="1.5" />
    <text x="140" y="159" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--green))">Full detail view</text>
  </svg>
);

const MeridianVisual = () => (
  <svg viewBox="0 0 280 140" className="w-full max-w-[260px]">
    {/* Lines from Meridian to three */}
    <line x1="140" y1="45" x2="50" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="140" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="230" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    {/* Meridian */}
    <rect x="70" y="10" width="140" height="38" rx="8" fill="hsl(var(--accent-light))" stroke="hsl(var(--accent-mid))" strokeWidth="1.5" />
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(var(--accent-dark))">Meridian Spec</text>
    <text x="140" y="42" textAnchor="middle" fontSize="8" fill="hsl(var(--text-tertiary))">declarative language</text>
    {/* Content */}
    <rect x="5" y="85" width="90" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="50" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">Content</text>
    {/* Composition */}
    <rect x="105" y="85" width="90" height="30" rx="6" fill="hsl(var(--accent-mid))" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" />
    <text x="150" y="104" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--primary-foreground))">Composition</text>
    {/* Layout */}
    <rect x="205" y="85" width="70" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="240" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">Layout</text>
  </svg>
);

const MalleableVisual = () => (
  <svg viewBox="0 0 280 160" className="w-full max-w-[260px]">
    {/* Lines */}
    <line x1="140" y1="45" x2="50" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="140" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="230" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="115" x2="140" y2="130" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    {/* Malleable ODI */}
    <rect x="65" y="10" width="150" height="38" rx="8" fill="hsl(var(--accent-light))" stroke="hsl(var(--accent-mid))" strokeWidth="1.5" />
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(var(--accent-dark))">Malleable ODI</text>
    <text x="140" y="42" textAnchor="middle" fontSize="8" fill="hsl(var(--text-tertiary))">reconfigurable</text>
    {/* Developer */}
    <rect x="5" y="85" width="90" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="50" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">Developer</text>
    {/* Designer */}
    <rect x="105" y="85" width="70" height="30" rx="6" fill="hsl(var(--accent-mid))" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" />
    <text x="140" y="104" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--primary-foreground))">Designer</text>
    {/* End User */}
    <rect x="185" y="85" width="90" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="230" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">End User</text>
    {/* Data model */}
    <rect x="85" y="130" width="110" height="24" rx="6" fill="hsl(var(--green-light))" stroke="hsl(var(--green))" strokeWidth="1" />
    <text x="140" y="146" textAnchor="middle" fontSize="8" fontWeight="500" fill="hsl(var(--green))">Data model unchanged</text>
  </svg>
);

const explanations: Record<string, { quote: string; visual?: React.ReactNode; plain: string; followups: string[] }> = {
  "hl-odi": {
    quote: '"Overview-detail interfaces (ODIs) are among the most ubiquitous interface patterns..."',
    visual: <ODIVisual />,
    plain: 'Think of it like a YouTube homepage. You see a grid of thumbnails first — that\'s the overview. You scroll, scan, find one that looks interesting, and click it. Now you\'re watching the full video — that\'s the detail.\n\nODIs work the same way everywhere: email inboxes, shopping sites, your calendar. You never have to read everything — you browse first, then go deep on what matters.',
    followups: ['What makes an ODI "malleable"?', "Show me a real example in an app"],
  },
  "hl-meridian": {
    quote: '"The Meridian Framework proposes a specification language that separates..."',
    visual: <MeridianVisual />,
    plain: "Meridian is a system that lets you describe an interface in layers — what data to show, how it looks, and how it's arranged. Each layer is independent, so a designer can change visuals without breaking the developer's data logic.",
    followups: ["How does the spec language work?", "What are the three layers?"],
  },
  "hl-malleable": {
    quote: '"Malleable ODIs allow reconfiguration by multiple stakeholders..."',
    visual: <MalleableVisual />,
    plain: "A malleable ODI can be reshaped by different people — developers, designers, and end users — without them stepping on each other's toes. Each person controls their own layer, and the underlying data model stays untouched.",
    followups: ["Who are the three stakeholders?", "How is this different from regular customization?"],
  },
};

interface UserHighlight {
  id: string;
  text: string;
  sectionId: string;
  paragraphIndex: number;
}

const Index = () => {
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<typeof explanations[string] | null>(null);
  const [activeTab, setActiveTab] = useState<"explain" | "architecture" | "chat">("explain");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [userSelection, setUserSelection] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [userHighlights, setUserHighlights] = useState<UserHighlight[]>([]);
  const highlightCounter = useRef(0);
  const pdfScrollRef = useRef<HTMLDivElement>(null);

  const handleHighlightClick = useCallback((id: string, _text: string) => {
    setActiveHighlight(id);
    setSelectedText(id);
    setIsLoading(true);
    setExplanation(null);
    setActiveTab("explain");

    setTimeout(() => {
      setIsLoading(false);
      setExplanation(explanations[id] || null);
    }, 1200);
  }, []);

  const addUserHighlight = useCallback((text: string, sectionId: string, paragraphIndex: number): string => {
    const id = `user-hl-${++highlightCounter.current}`;
    setUserHighlights(prev => [...prev, { id, text, sectionId, paragraphIndex }]);
    return id;
  }, []);

  const handleRemoveHighlight = useCallback((hlId: string) => {
    setUserHighlights(prev => prev.filter(h => h.id !== hlId));
    if (activeHighlight === hlId) {
      setActiveHighlight(null);
      setSelectedText(null);
      setExplanation(null);
    }
  }, [activeHighlight]);

  const handleUserExplain = useCallback((text: string, sectionId?: string, paragraphIndex?: number) => {
    setUserSelection(null);
    // Persist highlight
    let hlId = "user-selection";
    if (sectionId !== undefined && paragraphIndex !== undefined) {
      hlId = addUserHighlight(text, sectionId, paragraphIndex);
    }
    setActiveHighlight(hlId);
    setSelectedText(hlId);
    setIsLoading(true);
    setExplanation(null);
    setActiveTab("explain");

    setTimeout(() => {
      setIsLoading(false);
      setExplanation({
        quote: `"${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
        plain: `This passage discusses a key concept from the paper. The text refers to: "${text.slice(0, 120)}${text.length > 120 ? '...' : ''}" — which is central to understanding how the Meridian framework approaches interface design.`,
        followups: ["Tell me more about this", "How does this relate to other sections?"],
      });
    }, 1200);
  }, [addUserHighlight]);

  const handleUserChat = useCallback((text: string, sectionId?: string, paragraphIndex?: number) => {
    setUserSelection(null);
    // Persist highlight
    if (sectionId !== undefined && paragraphIndex !== undefined) {
      addUserHighlight(text, sectionId, paragraphIndex);
    }
    setChatInitialMessage(text);
    setActiveTab("chat");
  }, [addUserHighlight]);

  const handleTextSelection = useCallback((text: string, rect: DOMRect, sectionId: string, paragraphIndex: number) => {
    if (text.trim().length > 3) {
      setUserSelection({ text: text.trim(), rect, sectionId, paragraphIndex } as any);
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setUserSelection(null);
  }, []);

  const handleNodeClick = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    // Scroll to section in PDF pane
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleScrollSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
  }, []);

  const activeSection = activeSectionId || (activeHighlight
    ? sections.find((s) => s.paragraphs.some((p) => p.highlights?.some((h) => h.id === activeHighlight)))?.id || null
    : null);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="flex w-full max-w-[1100px] h-[82vh] min-h-[580px] max-h-[800px] rounded-lg overflow-hidden border border-border-strong shadow-md">
        <PDFPane
          sections={sections}
          activeSection={activeSection}
          activeHighlight={activeHighlight}
          onHighlightClick={handleHighlightClick}
          onTextSelection={handleTextSelection}
          userSelection={userSelection}
          onExplainSelection={handleUserExplain}
          onChatSelection={handleUserChat}
          onClearSelection={handleClearSelection}
          onScrollSection={handleScrollSection}
          scrollRef={pdfScrollRef}
          userHighlights={userHighlights}
          onRemoveHighlight={handleRemoveHighlight}
        />
        <SidePanel
          selectedText={selectedText}
          explanation={explanation}
          isLoading={isLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatInitialMessage={chatInitialMessage}
          onClearChatInitial={() => setChatInitialMessage(null)}
          activeSectionId={activeSectionId}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
};

export default Index;
