import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Link to={path} className="group">
      <Card className={`h-full transition-all duration-300 hover:shadow-medium ${
        isActive 
          ? "border-primary bg-gradient-card" 
          : "hover:border-primary/50"
      }`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 transition-colors ${
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted group-hover:bg-primary group-hover:text-primary-foreground"
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};
