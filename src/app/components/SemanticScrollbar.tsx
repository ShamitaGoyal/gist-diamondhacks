interface Marker {
  position: number; // 0-100 percentage
  type: 'evidence' | 'claim' | 'definition';
}

interface SemanticScrollbarProps {
  markers: Marker[];
}

export function SemanticScrollbar({ markers }: SemanticScrollbarProps) {
  const getMarkerColor = (type: Marker['type']) => {
    switch (type) {
      case 'evidence':
        return '#0D9488'; // Teal
      case 'claim':
        return '#EA580C'; // Orange
      case 'definition':
        return '#6366F1'; // Indigo
    }
  };

  return (
    <div className="fixed right-0 top-14 bottom-0 w-3 bg-[#F8FAFC] border-l border-[#E2E8F0]">
      <div className="relative h-full">
        {markers.map((marker, index) => (
          <div
            key={index}
            className="absolute w-1 h-1 rounded-sm left-1"
            style={{
              top: `${marker.position}%`,
              backgroundColor: getMarkerColor(marker.type)
            }}
          />
        ))}
      </div>
    </div>
  );
}
