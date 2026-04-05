/** Shape matches PDFPane `Section` — kept here so mock papers stay editable in one place. */

import type { TreeNode } from "@/components/pdf-lens/ArchitectureTab";

export type PaperParagraph = {
  text: string;
  highlights?: { text: string; id: string }[];
};

export type PaperSection = {
  id: string;
  title: string;
  paragraphs: PaperParagraph[];
};

export type SamplePaperId = "meridian" | "facial-paralysis";

export type SamplePaper = {
  id: SamplePaperId;
  /** Short label for the switcher */
  label: string;
  fileName: string;
  pageCount: number;
  sections: PaperSection[];
  /** Shown when /api/v2/architecture has not returned a title yet (or offline fallback graph) */
  architectureFallbackTitle: string;
  /** Static structure map when API graph is unavailable */
  architectureFallbackNodes: TreeNode[];
  /** Chat empty-state line */
  chatWelcomeMessage: string;
  chatSuggestions: string[];
  /** Served from `v2/public`; left pane renders real PDF and extracts text for APIs. */
  pdfPublicUrl?: string;
};

/** Architecture fallback when the IEEE PDF is open (one node per page, `sectionId` = `page-N`). */
export function buildPageArchitectureNodes(numPages: number, rootLabel: string): TreeNode[] {
  if (numPages < 1) return FACIAL_PARALYSIS_ARCH_NODES;
  const childIds = Array.from({ length: numPages }, (_, i) => `arch-pg-${i + 1}`);
  const out: TreeNode[] = [
    {
      id: "root",
      label: rootLabel,
      sublabel: `${numPages} pages`,
      sectionId: "page-1",
      depth: 0,
      childrenIds: childIds,
    },
  ];
  for (let i = 1; i <= numPages; i++) {
    out.push({
      id: `arch-pg-${i}`,
      label: `Page ${i}`,
      sublabel: `PDF p. ${i}`,
      sectionId: `page-${i}`,
      depth: 1,
      childrenIds: [],
    });
  }
  return out;
}

/** Default architecture map for the Meridian demo (matches section ids in MERIDIAN_PAPER). */
export const MERIDIAN_ARCH_NODES: TreeNode[] = [
  {
    id: "root",
    label: "Meridian framework",
    sublabel: "Abstract · Intro",
    sectionId: "abstract",
    depth: 0,
    childrenIds: ["spec", "content"],
  },
  { id: "spec", label: "Specification language", sublabel: "§3", sectionId: "spec-lang", depth: 1, childrenIds: ["stake"] },
  { id: "content", label: "Content · layout · composition", sublabel: "§1–2", sectionId: "intro", depth: 1, childrenIds: ["stake"] },
  { id: "stake", label: "Three stakeholders", sublabel: "§4", sectionId: "stakeholders", depth: 2, childrenIds: ["malleable", "what", "tools"] },
  { id: "malleable", label: "Malleable overview-detail", sublabel: "§2", sectionId: "what-odi", depth: 3, childrenIds: ["impl"] },
  { id: "what", label: "What are ODIs?", sublabel: "§1–2", sectionId: "what-odi", depth: 3, childrenIds: [] },
  { id: "tools", label: "Open-source tools", sublabel: "§5", sectionId: "tools", depth: 3, childrenIds: ["eval"] },
  { id: "impl", label: "Implementation path", sublabel: "§6", sectionId: "tools", depth: 4, childrenIds: ["conclusion"] },
  { id: "eval", label: "Evaluation", sublabel: "§7", sectionId: "tools", depth: 4, childrenIds: ["conclusion"] },
  { id: "conclusion", label: "Takeaways", sublabel: "", sectionId: "tools", depth: 5, childrenIds: [] },
];

export const FACIAL_PARALYSIS_ARCH_NODES: TreeNode[] = [
  {
    id: "root",
    label: "BP facial expression modeling",
    sublabel: "Abstract · UCSD",
    sectionId: "fp-abstract",
    depth: 0,
    childrenIds: ["fp-clinical", "fp-prior", "fp-methodology"],
  },
  {
    id: "fp-clinical",
    label: "Clinical need & simulators",
    sublabel: "§ I Introduction",
    sectionId: "fp-intro",
    depth: 1,
    childrenIds: [],
  },
  {
    id: "fp-prior",
    label: "Background: asymmetry & synthesis",
    sublabel: "§ II",
    sectionId: "fp-background",
    depth: 1,
    childrenIds: [],
  },
  {
    id: "fp-methodology",
    label: "Masked synthesis methodology",
    sublabel: "§ III",
    sectionId: "fp-method",
    depth: 1,
    childrenIds: [],
  },
];

export const MERIDIAN_PAPER: SamplePaper = {
  id: "meridian",
  label: "Meridian (ODI)",
  fileName: "meridian_framework_paper.pdf",
  pageCount: 12,
  architectureFallbackTitle: "Meridian: malleable overview-detail interfaces",
  architectureFallbackNodes: MERIDIAN_ARCH_NODES,
  chatWelcomeMessage:
    "Hi! Ask anything about this Meridian / overview-detail paper — I'll answer from the text on the left.",
  chatSuggestions: [
    "Summarize the paper",
    "What is the main contribution?",
    "Explain overview-detail interfaces simply",
    "What should I read next?",
  ],
  sections: [
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
  ],
};

export const FACIAL_PARALYSIS_PAPER: SamplePaper = {
  id: "facial-paralysis",
  label: "Facial paralysis (IEEE)",
  fileName: "Moosaei-Pourebadi-Riek-FG19.pdf",
  pageCount: 8,
  pdfPublicUrl: "/papers/Moosaei-Pourebadi-Riek-FG19.pdf",
  architectureFallbackTitle: "Modeling asymmetric expressions for Bell's palsy simulators",
  architectureFallbackNodes: FACIAL_PARALYSIS_ARCH_NODES,
  chatWelcomeMessage:
    "Hi! Ask about facial paralysis, patient simulators, or masked synthesis — I'll stay grounded in the article on the left.",
  chatSuggestions: [
    "Summarize the paper",
    "What is masked synthesis?",
    "How could this help clinical training?",
    "What is Bell's palsy here?",
  ],
  sections: [
    {
      id: "fp-abstract",
      title: "Abstract",
      paragraphs: [
        {
          text: "Over 22 million people worldwide are affected by Parkinson's disease, stroke, and Bell's palsy (BP), which can cause facial paralysis (FP). People with FP have trouble having their expressions understood: both laypersons and clinicians have difficulty understanding them and often misinterpret them, which can result in poor social interactions and poor care delivery. One way to address this problem is through better education and training, of which computational tools may prove invaluable. Thus, in this paper, we explore how to build systems that can recognize and synthesize asymmetrical facial expressions. We introduce a novel computational model of asymmetric facial expressions for BP, which we can synthesize on either virtual and robotic patient simulators. We explore this within the context of clinical education, and built a patient simulator with synthesized FP in order to help clinicians perceive facial paralysis in patients. We conducted both computational and human-focused evaluations of the model, including the feedback from clinical experts. Our results suggest that our BP model is realistic, and comparable to the expressions of people with BP. Thus, this work has the potential to provide a practical training tool for clinical learners to better understand the expressions of people with BP. Our work can also help researchers in the facial recognition community to explore new methods for asymmetric facial expression analysis and synthesis.",
          highlights: [
            { text: "novel computational model of asymmetric facial expressions for BP", id: "fp-hl-model" },
          ],
        },
      ],
    },
    {
      id: "fp-intro",
      title: "I. Introduction",
      paragraphs: [
        {
          text: "Every year, 22 million people experience stroke, Parkinson's disease, Moebius syndrome, and Bell's Palsy (BP) [1], [23], [39], which can cause facial paralysis (FP). FP is the inability to move one's facial muscles on the affected side of the face, leading to asymmetric facial expressions [7]. The quality of social interaction that people with asymmetric facial expressions experience can be poor due to others who have difficulty understanding their emotions [10]. Studies show observers perceive the emotions of a person with FP differently from their actual emotional states [36]. For example, people with severe FP are perceived as less happy than people with mild FP [11]. For people with Parkinson's disease, observers may mistake expressions of happiness, as signifying depression or deception [3], [37].",
          highlights: [],
        },
        {
          text: "In clinical contexts, these misperceptions can lead to poor care delivery. Healthcare providers frequently have negatively biased impressions of patients with facial nerve paralysis [38], which may adversely affect the quality of care they receive [34], [35]. If a patient and a healthcare provider do not communicate effectively, there is a higher chance that their treatment will be unsuccessful [3], [36]. Therefore, new training tools which enable clinical learners to practice their interaction with FP patients may result in improved care for people with FP, and also improve how clinicians calibrate their perception of asymmetric expressions.",
          highlights: [{ text: "new training tools which enable clinical learners", id: "fp-hl-training" }],
        },
        {
          text: "Virtual and robotic patient simulators are one of the most commonly used training tools in clinical education. They provide clinical learners with a low-risk, high-fidelity learning environment to practice their procedural and communication skills [30]. Robotic patient simulators (RPS), in particular, can convey realistic, immersive training experiences for learners. They are lifelike, patient-sized humanoid robots that can simulate human physiological responses.",
          highlights: [],
        },
        {
          text: "Research suggests that using these simulators may reduce preventable medical errors, which cause approximately 400,000 deaths per year in the US hospitals alone [20], [2]. However, current commercial simulators suffer from a major design flaw: they completely lack facial expressions (see Figure 1). Our team has created expressive virtual and robot patient simulators, which show promise as an important clinical education tool [33], [2], [28], [27]. The development of these simulators was based on the assumption that human faces are structurally symmetric. However, due to the large number of people affected by FP, it is also important to explore the synthesis of asymmetric facial expressions in these contexts. To our knowledge, FP patient simulators have not been explored in this way. Employing simulators in this way may help providers avoid forming biased impressions, improve clinical communication, and, therefore, improve care delivery for people with FP.",
          highlights: [{ text: "current commercial simulators suffer from a major design flaw", id: "fp-hl-simulators" }],
        },
        {
          text: "In this paper, we introduce the concept of using masked synthesis on patient simulators in order to model asymmetric facial expressions, situated within a clinical education context. Masks are computational models derived from recognized expressions of real people with FP. Masked synthesis is a process of using pre-built masks based on the face of a person with FP, and overlaying it on the stream of standard performance driven synthesis to recreate the asymmetric facial expressions [27]. The longitudinal goal of our research is to build accurate models of people with asymmetric facial expressions, and to help support clinical engagement with people who have FP.",
          highlights: [],
        },
        {
          text: "The contributions of this paper are twofold. First, we present a novel algorithm to build accurate computational models (masks) of people with BP that are constructible in real time (See Section III). Second, we applied the algorithm to synthesize BP on virtual patients, and found that clinicians perceive it to be realistic and comparable to humans with BP (See Sections IV and V).",
          highlights: [],
        },
        {
          text: "This work is important for the greater affective computing and patient simulation communities because it allows researchers to explore new methods for synthesizing facial expressions. Moreover, by leveraging the BP patient simulator approach presented in this paper, clinical learners may have the potential to more accurately diagnose people with BP, and to be better able to interact with them. We discuss the implications of these findings in Section VI.",
          highlights: [],
        },
        {
          text: "Fig. 1. Left: The simulation center setup where a team of clinical learners treat a non-expressive HPS, which is controlled by simulation operators in a control room. Center: a commonly used inexpressive mannequin head. Right: An example of an expressive RPS system our team built, synthesizing pain.",
          highlights: [],
        },
      ],
    },
    {
      id: "fp-background",
      title: "II. Background",
      paragraphs: [
        {
          text: "Recognizing and synthesizing facial expressions is desirable for a variety of different applications including: human face and head modeling [12], [15], illofacial surgery [9], and rendering robot faces [21]. While there is a significant body of literature exploring symmetric expressions [15], [9], it is also important to study asymmetric facial expressions.",
          highlights: [],
        },
        {
          text: "Researchers have had success in identifying the salient features of asymmetric and restricted facial expressions. For example, Tickle-Degnen et al. [41] designed a study to identify reliable emotional cues from expressive behavior in women and men with Parkinson's disease. Other researchers proposed different quantitative analysis methods to measure the facial asymmetry of facial images [6], [22], [31], [32]. While previous work has laid the foundation for exploring asymmetry, it is critical to study synthesizing asymmetry, especially in clinical education settings. People with asymmetric facial expressions have limited facial expressivity, which makes it difficult for others to form a reliable understanding of their emotions. Moreover, in clinical settings, if a patient and provider cannot communicate effectively, it can adversely affect rapport with the patient and their care decisions [3], [36].",
          highlights: [],
        },
        {
          text: "Building models to synthesize asymmetric facial expressions on virtual or physical simulator faces may help to improve the social and procedural skills of clinicians and help promote the quality of care they give to patients with BP. Many researchers have worked on both facially expressive virtual simulators [12] and expressive physical robots [33], [26], [2], [29], [27]. Still, there is a lack of work done on developing patient simulators capable of expressing asymmetric facial expressions.",
          highlights: [],
        },
        {
          text: "One of the most commonly used modalities in clinical simulation centers are virtual and robotic patient simulators. Patient simulators help improve clinicians' procedural and communication skills and enable them to provide effective treatment to patients [28]. These systems provide caregivers and clinical learners with a low-risk, high-fidelity, clinically-similar learning environment to practice their skills [30]. Although using simulators may reduce preventable medical errors [20], the absence of facial expressions on these simulators may adversely affect patient outcomes [2], [24].",
          highlights: [],
        },
        {
          text: "To address this issue, we have built both virtual and robotic patient simulators able to express a range of pathologies, including pain and stroke [33], [2]. We also introduced a generalized automatic framework that can accurately map facial expressions from a performer's face to both simulated and robotic faces in real-time [27], [28]. The method is based on performance-driven synthesis, which maps motions from video of an operator/educator onto the face of an embodiment (e.g., virtual avatar or robot). In our current work, we build on this to explore a new avenue: the recognition and synthesis of asymmetric facial expressions.",
          highlights: [{ text: "performance-driven synthesis", id: "fp-hl-pds" }],
        },
      ],
    },
    {
      id: "fp-method",
      title: "III. Methodology",
      paragraphs: [
        {
          text: "In our work, we are interested in a particular type of FP, Bell's Palsy (BP). We explore two main research questions in this work. First, how can we computationally model the facial characteristics of BP and synthesize them on a simulator? This is an important question because answering it would enable the development simulators capable of expressing asymmetric facial expressions. Second, how realistically does our mask model convey signs of BP when synthesized on a virtual patient? Addressing this question will help inform the potential clinical efficacy of such an approach using FP simulators as clinical educational tools.",
          highlights: [],
        },
        {
          text: "We developed a new masked synthesis method for asymmetric facial expressions, and addressed the aforementioned research questions by engaging in the following activities. First, we acquired videos of people with BP and extracted facial features using a CLM-based approach (See Section III-A). Next, we built computational models (masks) representing the facial characteristics of BP. We then overlaid these prebuilt masks onto a stream of facial expressions generated by standard performance-driven synthesis (See Fig. 2). Next, we transferred the generated asymmetric expressions to the face of a virtual patient simulator (See Section III-B). Finally, we ran an expert-based study to evaluate the realism of the synthesized expressions. (Demo excerpt — full paper continues.)",
          highlights: [],
        },
      ],
    },
  ],
};

export const SAMPLE_PAPERS: SamplePaper[] = [MERIDIAN_PAPER, FACIAL_PARALYSIS_PAPER];

export function getPaperById(id: SamplePaperId): SamplePaper {
  const p = SAMPLE_PAPERS.find((x) => x.id === id);
  return p ?? MERIDIAN_PAPER;
}
