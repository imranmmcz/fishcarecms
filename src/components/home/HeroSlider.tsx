import { useRef } from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { Button3D } from "@/components/ui/button-3d";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useHeroSlides, type HeroSlide } from "@/hooks/useHeroSlides";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Calculator,
  Droplets,
  Fish,
  Package,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Heart,
  Star,
  Zap,
  Shield,
  Award,
  Target,
  Users,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Calculator,
  Droplets,
  Fish,
  Package,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Heart,
  Star,
  Zap,
  Shield,
  Award,
  Target,
  Users,
  LayoutDashboard,
};

const getButtonVariant = (variant: string | null): "primary" | "success" | "warning" | "purple" | "danger" | "pink" => {
  switch (variant) {
    case "primary":
      return "primary";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "purple":
      return "purple";
    case "danger":
      return "danger";
    case "pink":
      return "pink";
    default:
      return "primary";
  }
};

export function HeroSlider() {
  const { slides, loading } = useHeroSlides();
  const { t } = useLanguage();
  
  // Autoplay plugin with 5 second delay
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-hero text-white py-20">
        <div className="container flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }

  // Fallback if no slides
  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="py-20">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
              <div className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur-sm">
                {t.heroTagline}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                {t.heroDescription}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/pond-calculator">
                  <Button3D size="lg" variant="success">
                    <Calculator className="mr-2 h-5 w-5" />
                    {t.startNow}
                  </Button3D>
                </Link>
                <Link to="/dashboard">
                  <Button3D size="lg" variant="purple">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    {t.dashboard}
                  </Button3D>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden text-white">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[autoplayPlugin.current]}
        onMouseEnter={() => autoplayPlugin.current.stop()}
        onMouseLeave={() => autoplayPlugin.current.play()}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => {
            const IconComponent = iconMap[slide.tagline_icon || "Sparkles"] || Sparkles;
            
            return (
              <CarouselItem key={slide.id}>
                <div
                  className="py-20 relative"
                  style={{ background: slide.background_value || undefined }}
                >
                  <div className="container relative z-10">
                    <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
                      {slide.tagline && (
                        <div className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur-sm">
                          <IconComponent className="inline h-4 w-4 mr-1" />
                          {slide.tagline}
                        </div>
                      )}
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        {slide.title}
                      </h1>
                      {slide.subtitle && (
                        <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.button_text && slide.button_link && (
                        <div className="flex gap-4 justify-center flex-wrap">
                          <Link to={slide.button_link}>
                            <Button3D size="lg" variant={getButtonVariant(slide.button_variant)}>
                              <IconComponent className="mr-2 h-5 w-5" />
                              {slide.button_text}
                            </Button3D>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <CarouselPrevious className="static translate-y-0 bg-white/20 hover:bg-white/40 border-white/30 text-white" />
          <CarouselNext className="static translate-y-0 bg-white/20 hover:bg-white/40 border-white/30 text-white" />
        </div>
      </Carousel>
    </section>
  );
}
