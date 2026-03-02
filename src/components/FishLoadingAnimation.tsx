import { Fish, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FishLoadingAnimationProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

interface LoadingConfig {
  type: string;
  text: string;
  color: string;
  bg: string;
  fullscreen: boolean;
  customImage: string;
}

const defaultConfig: LoadingConfig = {
  type: "fish",
  text: "লোড হচ্ছে...",
  color: "#22D3EE",
  bg: "#0C1929",
  fullscreen: true,
  customImage: "",
};

export const FishLoadingAnimation = ({ 
  message, 
  size = "md",
  fullScreen 
}: FishLoadingAnimationProps) => {
  const [config, setConfig] = useState<LoadingConfig>(defaultConfig);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_key, setting_value")
          .like("setting_key", "loading_animation_%");

        if (data && data.length > 0) {
          const c = { ...defaultConfig };
          data.forEach((d) => {
            if (!d.setting_value) return;
            if (d.setting_key === "loading_animation_type") c.type = d.setting_value;
            if (d.setting_key === "loading_animation_text") c.text = d.setting_value;
            if (d.setting_key === "loading_animation_color") c.color = d.setting_value;
            if (d.setting_key === "loading_animation_bg") c.bg = d.setting_value;
            if (d.setting_key === "loading_animation_fullscreen") c.fullscreen = d.setting_value === "true";
            if (d.setting_key === "loading_animation_custom_image") c.customImage = d.setting_value;
          });
          setConfig(c);
        }
      } catch (err) {
        // use defaults
      }
    };
    load();
  }, []);

  const displayText = message || config.text;
  const isFullScreen = fullScreen !== undefined ? fullScreen : config.fullscreen;

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14"
  };

  const containerClasses = isFullScreen 
    ? "min-h-screen flex items-center justify-center"
    : "flex items-center justify-center py-8";

  const renderAnimation = () => {
    switch (config.type) {
      case "spinner":
        return (
          <div
            className={`${sizeClasses[size]} rounded-full border-4 border-t-transparent animate-spin`}
            style={{ borderColor: `${config.color}33`, borderTopColor: config.color }}
          />
        );

      case "dots":
        return (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full animate-bounce shadow-lg"
                style={{ backgroundColor: config.color, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        );

      case "wave":
        return (
          <div className="flex items-end gap-1 h-12">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 rounded-full animate-pulse"
                style={{
                  backgroundColor: config.color,
                  height: `${20 + Math.sin(i * 1.2) * 15}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        );

      case "pulse":
        return (
          <div className="relative flex items-center justify-center">
            <div
              className="h-12 w-12 rounded-full animate-ping absolute opacity-30"
              style={{ backgroundColor: config.color }}
            />
            <div
              className="h-12 w-12 rounded-full"
              style={{ backgroundColor: config.color }}
            />
          </div>
        );

      case "custom_image":
        return config.customImage ? (
          <img 
            src={config.customImage} 
            alt="Loading" 
            className={`${sizeClasses[size]} object-contain`}
            style={{ filter: `drop-shadow(0 0 10px ${config.color}80)` }}
          />
        ) : (
          <Loader2 className={`${sizeClasses[size]} animate-spin`} style={{ color: config.color }} />
        );

      case "fish":
      default:
        return (
          <div className="relative w-48 h-24">
            <div className="absolute animate-[swim_2s_ease-in-out_infinite]" style={{ left: 0 }}>
              <div className="relative">
                <Fish 
                  className={`${sizeClasses[size]} drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]`}
                  style={{ color: config.color, transform: 'scaleX(-1)' }}
                />
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: `${config.color}4D` }} />
              </div>
            </div>
            <div 
              className="absolute animate-[swim_2.5s_ease-in-out_infinite]"
              style={{ left: '-10%', top: '60%', animationDelay: '0.3s' }}
            >
              <Fish className="h-6 w-6 opacity-70" style={{ color: config.color, transform: 'scaleX(-1)' }} />
            </div>
            <div 
              className="absolute animate-[swim_3s_ease-in-out_infinite]"
              style={{ left: '-5%', top: '20%', animationDelay: '0.6s' }}
            >
              <Fish className="h-4 w-4 opacity-60" style={{ color: config.color, transform: 'scaleX(-1)' }} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={containerClasses} style={{ backgroundColor: isFullScreen ? config.bg : undefined }}>
      <div className="relative flex flex-col items-center gap-6">
        {/* Bubbles */}
        {isFullScreen && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-bounce"
                style={{
                  backgroundColor: `${config.color}33`,
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
        )}

        {renderAnimation()}

        {/* Loading text */}
        <div className="flex items-center gap-1 font-medium text-lg" style={{ color: config.color }}>
          {displayText.split('').map((char, i) => (
            <span
              key={i}
              className="animate-bounce inline-block"
              style={{ animationDelay: `${i * 0.05}s`, animationDuration: '1s' }}
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
              className="w-2.5 h-2.5 rounded-full animate-bounce shadow-lg"
              style={{ backgroundColor: config.color, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes swim {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          25% { transform: translateX(40px) translateY(-8px) rotate(-5deg); }
          50% { transform: translateX(80px) translateY(0) rotate(0deg); }
          75% { transform: translateX(120px) translateY(8px) rotate(5deg); }
          100% { transform: translateX(160px) translateY(0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
