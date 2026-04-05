import { useRef, useEffect } from 'react';

interface PDFViewerProps {
  onTextSelect: (text: string, position: { x: number; y: number }) => void;
  highlightedSections: string[];
  /** Scroll PDF to `#section-{id}` when set (e.g. map node → section) */
  scrollToSectionId?: string | null;
}

export function PDFViewer({ onTextSelect, highlightedSections, scrollToSectionId }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToSectionId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`#section-${CSS.escape(scrollToSectionId)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollToSectionId]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 10 && containerRef.current) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          const containerRect = containerRef.current.getBoundingClientRect();
          onTextSelect(text, {
            x: rect.right - containerRect.left,
            y: rect.bottom - containerRect.top
          });
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [onTextSelect]);

  // Mock research paper content
  const mockPaperSections = [
    {
      id: '1',
      title: 'Abstract',
      content: `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU.`
    },
    {
      id: '2',
      title: '1. Introduction',
      content: `Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation. Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures.

Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states ht, as a function of the previous hidden state ht−1 and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.`
    },
    {
      id: '2.1',
      title: '2. Background',
      content: `The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, ByteNet and ConvS2S, all of which use convolutional neural networks as basic building block, computing hidden representations in parallel for all input and output positions. In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet. This makes it more difficult to learn dependencies between distant positions. In the Transformer this is reduced to a constant number of operations, albeit at the cost of reduced effective resolution due to averaging attention-weighted positions, an effect we counteract with Multi-Head Attention.`
    },
    {
      id: '2.2',
      title: '2.1 Related Work',
      content: `Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence. Self-attention has been used successfully in a variety of tasks including reading comprehension, abstractive summarization, textual entailment and learning task-independent sentence representations.

End-to-end memory networks are based on a recurrent attention mechanism instead of sequence-aligned recurrence and have been shown to perform well on simple-language question answering and language modeling tasks.`
    },
    {
      id: '3',
      title: '3. Model Architecture',
      content: `Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations (x1, ..., xn) to a sequence of continuous representations z = (z1, ..., zn). Given z, the decoder then generates an output sequence (y1, ..., ym) of symbols one element at a time. At each step the model is auto-regressive, consuming the previously generated symbols as additional input when generating the next.

The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder, shown in the left and right halves of Figure 1, respectively.`
    },
    {
      id: '3.1',
      title: '3.1 Encoder and Decoder Stacks',
      content: `Encoder: The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is LayerNorm(x + Sublayer(x)), where Sublayer(x) is the function implemented by the sub-layer itself. To facilitate these residual connections, all sub-layers in the model, as well as the embedding layers, produce outputs of dimension dmodel = 512.`
    }
  ];

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 overflow-y-auto border-r border-[#E2E8F0] bg-white"
    >
      <div className="max-w-4xl mx-auto p-12">
        {/* Paper Header */}
        <div className="mb-8 pb-6 border-b-2 border-[#E2E8F0]">
          <h1 className="text-[28px] font-bold text-[#1E293B] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Attention Is All You Need
          </h1>
          <div className="text-[14px] text-[#64748B] space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            <p>Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones</p>
            <p>Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin</p>
            <p className="text-[12px] mt-2">Google Brain • Google Research • University of Toronto</p>
            <p className="text-[12px] text-[#6366F1] mt-2">arXiv:1706.03762v5 [cs.CL] 6 Dec 2017</p>
          </div>
        </div>

        {/* Paper Content */}
        {mockPaperSections.map((section) => (
          <div
            key={section.id}
            id={`section-${section.id}`}
            className={`mb-8 relative ${
              highlightedSections.includes(section.id) ? 'bg-[#818CF8]/10 border-l-4 border-[#6366F1] pl-6 -ml-6 py-2' : ''
            }`}
          >
            <h2 className="text-[18px] font-semibold text-[#1E293B] mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              {section.title}
            </h2>
            <p
              className="text-[14px] text-[#334155] leading-relaxed whitespace-pre-line"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {section.content}
            </p>
          </div>
        ))}

        {/* Mock Figures */}
        <div className="mt-12 p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px]">
          <div className="text-center mb-4">
            <div className="text-[12px] font-semibold text-[#64748B]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Figure 1: The Transformer - model architecture
            </div>
          </div>
          <div className="bg-white border border-[#E2E8F0] h-96 flex items-center justify-center">
            <div className="text-[12px] text-[#94A3B8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              [Architectural Diagram]
            </div>
          </div>
        </div>

        {/* References Section */}
        <div className="mt-12 pt-6 border-t-2 border-[#E2E8F0]">
          <h2 className="text-[18px] font-semibold text-[#1E293B] mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            References
          </h2>
          <div className="text-[12px] text-[#64748B] space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <p>[1] Bahdanau, D., Cho, K., & Bengio, Y. (2014). Neural machine translation by jointly learning to align and translate.</p>
            <p>[2] Sutskever, I., Vinyals, O., & Le, Q. V. (2014). Sequence to sequence learning with neural networks.</p>
            <p>[3] Vaswani, A., et al. (2017). Attention is all you need. In Advances in neural information processing systems.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
