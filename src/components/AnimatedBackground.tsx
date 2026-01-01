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

export const AnimatedBackground = () => {
  // Generate random bubbles
  const bubbles: Bubble[] = useMemo(() => 
    [...Array(20)].map((_, i) => ({
      id: i,
      size: Math.random() * 20 + 8,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 4,
    })), []
  );

  // Generate swimming fish
  const fish: SwimmingFish[] = useMemo(() => 
    [...Array(6)].map((_, i) => ({
      id: i,
      size: Math.random() * 16 + 16,
      top: Math.random() * 80 + 10,
      delay: Math.random() * 8,
      duration: Math.random() * 10 + 12,
      direction: i % 2 === 0 ? 'left' : 'right',
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/50 via-transparent to-cyan-900/30" />
      
      {/* Water surface light effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-400/10 to-transparent animate-pulse" />
      
      {/* Rising bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-gradient-to-br from-white/30 to-cyan-300/20 backdrop-blur-sm"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            bottom: '-50px',
            animation: `rise ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
            boxShadow: `inset -2px -2px 4px rgba(255,255,255,0.3), 0 0 ${bubble.size/2}px rgba(34,211,238,0.2)`,
          }}
        >
          {/* Bubble shine */}
          <div 
            className="absolute rounded-full bg-white/50"
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
            animation: `swim-${f.direction} ${f.duration}s linear ${f.delay}s infinite`,
            left: f.direction === 'left' ? '-50px' : 'auto',
            right: f.direction === 'right' ? '-50px' : 'auto',
          }}
        >
          <Fish
            className="drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]"
            style={{
              width: `${f.size}px`,
              height: `${f.size}px`,
              color: `hsla(${180 + Math.random() * 40}, 70%, 70%, 0.5)`,
              transform: f.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            }}
          />
        </div>
      ))}

      {/* Floating seaweed/plants effect on sides */}
      <div className="absolute bottom-0 left-0 w-20 h-40 opacity-20">
        <div className="w-2 h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full mx-auto animate-[sway_3s_ease-in-out_infinite]" />
      </div>
      <div className="absolute bottom-0 left-8 w-20 h-32 opacity-15">
        <div className="w-2 h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full mx-auto animate-[sway_2.5s_ease-in-out_infinite_0.5s]" />
      </div>
      <div className="absolute bottom-0 right-0 w-20 h-36 opacity-20">
        <div className="w-2 h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full mx-auto animate-[sway_3.5s_ease-in-out_infinite_0.3s]" />
      </div>
      <div className="absolute bottom-0 right-10 w-20 h-28 opacity-15">
        <div className="w-2 h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full mx-auto animate-[sway_2.8s_ease-in-out_infinite_0.8s]" />
      </div>

      {/* Light rays from top */}
      <div className="absolute top-0 left-1/4 w-1 h-64 bg-gradient-to-b from-cyan-300/20 to-transparent rotate-12 blur-sm" />
      <div className="absolute top-0 left-1/2 w-1 h-80 bg-gradient-to-b from-cyan-300/15 to-transparent -rotate-6 blur-sm" />
      <div className="absolute top-0 right-1/4 w-1 h-72 bg-gradient-to-b from-cyan-300/20 to-transparent rotate-6 blur-sm" />

      {/* Custom animations */}
      <style>{`
        @keyframes rise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(20px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes swim-left {
          0% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(25vw) translateY(-15px);
          }
          50% {
            transform: translateX(50vw) translateY(10px);
          }
          75% {
            transform: translateX(75vw) translateY(-10px);
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(0);
          }
        }

        @keyframes swim-right {
          0% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(-25vw) translateY(10px);
          }
          50% {
            transform: translateX(-50vw) translateY(-15px);
          }
          75% {
            transform: translateX(-75vw) translateY(5px);
          }
          100% {
            transform: translateX(calc(-100vw - 100px)) translateY(0);
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: rotate(-5deg) translateX(0);
          }
          50% {
            transform: rotate(5deg) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
};
