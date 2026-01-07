import { Fish } from "lucide-react";
import { useMemo } from "react";

interface Bubble {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
}

interface SwimmingFish {
  id: number;
  size: number;
  top: number;
  delay: number;
  duration: number;
  direction: 'left' | 'right';
}

interface UnderwaterEffectProps {
  bubbleCount?: number;
  fishCount?: number;
  className?: string;
}

export const UnderwaterEffect = ({ 
  bubbleCount = 12, 
  fishCount = 4,
  className = ""
}: UnderwaterEffectProps) => {
  // Generate random bubbles
  const bubbles: Bubble[] = useMemo(() => 
    [...Array(bubbleCount)].map((_, i) => ({
      id: i,
      size: Math.random() * 16 + 6,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 4,
    })), [bubbleCount]
  );

  // Generate swimming fish
  const fish: SwimmingFish[] = useMemo(() => 
    [...Array(fishCount)].map((_, i) => ({
      id: i,
      size: Math.random() * 14 + 14,
      top: Math.random() * 70 + 15,
      delay: Math.random() * 8,
      duration: Math.random() * 10 + 12,
      direction: i % 2 === 0 ? 'left' : 'right',
    })), [fishCount]
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Rising bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-gradient-to-br from-white/40 to-cyan-300/30 backdrop-blur-sm"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: '-30px',
            animation: `underwater-rise ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
            boxShadow: `inset -2px -2px 4px rgba(255,255,255,0.4), 0 0 ${bubble.size/2}px rgba(34,211,238,0.3)`,
          }}
        >
          {/* Bubble shine */}
          <div 
            className="absolute rounded-full bg-white/60"
            style={{
              width: `${bubble.size * 0.3}px`,
              height: `${bubble.size * 0.3}px`,
              top: `${bubble.size * 0.15}px`,
              left: `${bubble.size * 0.15}px`,
            }}
          />
        </div>
      ))}

      {/* Swimming fish */}
      {fish.map((f) => (
        <div
          key={f.id}
          className="absolute"
          style={{
            top: `${f.top}%`,
            animation: `underwater-swim-${f.direction} ${f.duration}s linear ${f.delay}s infinite`,
            left: f.direction === 'left' ? '-40px' : 'auto',
            right: f.direction === 'right' ? '-40px' : 'auto',
          }}
        >
          <Fish
            className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            style={{
              width: `${f.size}px`,
              height: `${f.size}px`,
              color: `hsla(${175 + Math.random() * 30}, 75%, 65%, 0.6)`,
              transform: f.direction === 'left' ? 'scaleX(1)' : 'scaleX(-1)',
            }}
          />
        </div>
      ))}

      {/* Custom animations */}
      <style>{`
        @keyframes underwater-rise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-120%) translateX(15px) scale(0.6);
            opacity: 0;
          }
        }

        @keyframes underwater-swim-left {
          0% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(25%) translateY(-10px);
          }
          50% {
            transform: translateX(50%) translateY(8px);
          }
          75% {
            transform: translateX(75%) translateY(-8px);
          }
          100% {
            transform: translateX(calc(100% + 80px)) translateY(0);
          }
        }

        @keyframes underwater-swim-right {
          0% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(-25%) translateY(8px);
          }
          50% {
            transform: translateX(-50%) translateY(-10px);
          }
          75% {
            transform: translateX(-75%) translateY(5px);
          }
          100% {
            transform: translateX(calc(-100% - 80px)) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
