import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  isActive?: boolean;
}

export const ModuleCard = ({ title, description, icon: Icon, path, isActive = false }: ModuleCardProps) => {
  return (
    <Link to={path} className="group block">
      <div className={`
        h-full p-6 rounded-xl
        bg-gradient-to-b from-card to-card/80
        border-b-4 border-primary/60
        shadow-[0_4px_0_0_hsl(var(--primary)/0.3),0_8px_16px_-4px_hsl(var(--primary)/0.2)]
        transition-all duration-150 ease-out
        hover:brightness-105 hover:-translate-y-1
        active:translate-y-1 active:border-b-1 active:shadow-[0_0_0_0_hsl(var(--primary)/0.3),0_2px_8px_-2px_hsl(var(--primary)/0.1)]
        ${isActive ? "border-primary bg-gradient-to-b from-primary/10 to-primary/5" : ""}
      `}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`
            rounded-xl p-3 transition-all duration-200
            border-b-4
            ${isActive 
              ? "bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-800 text-white shadow-[0_4px_0_0_rgb(6,95,70)]" 
              : "bg-gradient-to-b from-blue-400 to-blue-600 border-blue-800 text-white shadow-[0_4px_0_0_rgb(30,64,175)] group-hover:from-blue-300 group-hover:to-blue-500"
            }
          `}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
};
