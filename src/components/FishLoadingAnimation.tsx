import { Fish } from "lucide-react";

interface FishLoadingAnimationProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export const FishLoadingAnimation = ({ 
  message = "লোড হচ্ছে...", 
  size = "md",
  fullScreen = true 
}: FishLoadingAnimationProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14"
  };

  const containerClasses = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated water bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-400/20 animate-bounce"
              style={{
                width: `${Math.random() * 12 + 6}px`,
                height: `${Math.random() * 12 + 6}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            />
          ))}
        </div>

        {/* Swimming fish container */}
        <div className="relative w-48 h-24">
          {/* Main swimming fish */}
          <div 
            className="absolute animate-[swim_2s_ease-in-out_infinite]"
            style={{
              left: '0%',
            }}
          >
            <div className="relative">
              <Fish 
                className={`${sizeClasses[size]} text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]`}
                style={{ transform: 'scaleX(-1)' }}
              />
              {/* Tail wave effect */}
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400/30 rounded-full animate-ping" />
            </div>
          </div>

          {/* Secondary smaller fish */}
          <div 
            className="absolute animate-[swim_2.5s_ease-in-out_infinite]"
            style={{
              left: '-10%',
              top: '60%',
              animationDelay: '0.3s',
            }}
          >
            <Fish 
              className="h-6 w-6 text-blue-300/70 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>

          {/* Third tiny fish */}
          <div 
            className="absolute animate-[swim_3s_ease-in-out_infinite]"
            style={{
              left: '-5%',
              top: '20%',
              animationDelay: '0.6s',
            }}
          >
            <Fish 
              className="h-4 w-4 text-teal-300/60 drop-shadow-[0_0_6px_rgba(94,234,212,0.3)]"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>

          {/* Water ripple effects */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 rounded-full border border-cyan-400/20 animate-[ripple_2s_ease-out_infinite]" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border border-cyan-400/20 animate-[ripple_2s_ease-out_infinite_0.5s]" />
          </div>
        </div>

        {/* Loading text with wave animation */}
        <div className="flex items-center gap-1 text-white font-medium text-lg">
          {message.split('').map((char, i) => (
            <span
              key={i}
              className="animate-bounce inline-block"
              style={{ 
                animationDelay: `${i * 0.05}s`,
                animationDuration: '1s'
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-bounce shadow-lg shadow-cyan-500/50"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes swim {
          0%, 100% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
          25% {
            transform: translateX(40px) translateY(-8px) rotate(-5deg);
          }
          50% {
            transform: translateX(80px) translateY(0) rotate(0deg);
          }
          75% {
            transform: translateX(120px) translateY(8px) rotate(5deg);
          }
          100% {
            transform: translateX(160px) translateY(0) rotate(0deg);
          }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
