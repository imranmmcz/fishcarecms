import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { HeroFeaturedProduct } from "@/components/home/HeroFeaturedProduct";
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
    case "primary": return "primary";
    case "success": return "success";
    case "warning": return "warning";
    case "purple": return "purple";
    case "danger": return "danger";
    case "pink": return "pink";
    default: return "primary";
  }
};

export function HeroSlider() {
  const { slides, loading } = useHeroSlides();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<any>(null);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentSlide(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, onSelect]);

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-hero text-white py-12 sm:py-20">
        <div className="container flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="py-12 sm:py-20">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6 animate-fade-in px-2">
              <div className="inline-block rounded-full bg-white/20 px-3 py-0.5 sm:px-4 sm:py-1 text-xs sm:text-sm backdrop-blur-sm">
                {t.heroTagline}
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed">
                {t.heroDescription}
              </p>
              <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                <Link to="/pond-calculator">
                  <Button3D size="sm" variant="success" className="sm:!px-5 sm:!py-2.5 text-xs sm:text-sm">
                    <Calculator className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {t.startNow}
                  </Button3D>
                </Link>
                <Link to="/dashboard">
                  <Button3D size="sm" variant="purple" className="sm:!px-5 sm:!py-2.5 text-xs sm:text-sm">
                    <LayoutDashboard className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
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
    <section className="relative overflow-hidden text-white" aria-roledescription="carousel" aria-label="Hero highlights">
      <h1 className="sr-only">{slides[0]?.title || "FishCare BD"}</h1>
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[autoplayPlugin.current]}
        onMouseEnter={() => autoplayPlugin.current.stop()}
        onMouseLeave={() => autoplayPlugin.current.play()}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => {
            const IconComponent = iconMap[slide.tagline_icon || "Sparkles"] || Sparkles;
            
            return (
              <CarouselItem key={slide.id}>
                <div
                  className="py-8 sm:py-12 md:py-20 relative min-h-[240px] sm:min-h-[300px] md:min-h-[400px] flex items-center"
                  style={
                    slide.background_type === 'image' && slide.background_value
                      ? {
                          backgroundImage: `url(${slide.background_value})`,
                          backgroundSize: (slide as any).bg_size || 'cover',
                          backgroundPosition: (slide as any).bg_position || 'center',
                          backgroundRepeat: 'no-repeat',
                        }
                      : { background: slide.background_value || undefined }
                  }
                >
                  {slide.background_type === 'image' && (
                    <div
                      className="absolute inset-0 bg-black pointer-events-none"
                      style={{ opacity: 1 - ((slide as any).bg_opacity ?? 1) }}
                    />
                  )}
                  <div className="container relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      <div className="flex-1 text-center space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in px-1 sm:px-0">
                        {slide.tagline && (
                          <div className="inline-block rounded-full bg-white/20 px-3 py-0.5 sm:px-4 sm:py-1 text-[11px] sm:text-sm backdrop-blur-sm">
                            <IconComponent className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {slide.tagline}
                          </div>
                        )}
                        <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className="text-xs sm:text-sm md:text-lg lg:text-xl text-white/90 leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.button_text && slide.button_link && (
                          <div className="flex gap-3 justify-center flex-wrap">
                            <Link to={slide.button_link}>
                              <Button3D size="sm" variant={getButtonVariant(slide.button_variant)} className="text-xs sm:text-sm sm:!px-5 sm:!py-2.5">
                                <IconComponent className="mr-1.5 h-3.5 w-3.5 sm:h-5 sm:w-5" />
                                {slide.button_text}
                              </Button3D>
                            </Link>
                          </div>
                        )}
                      </div>
                      {slide.featured_product_id && (
                        <div className="flex-shrink-0 mt-2 md:mt-0">
                          <HeroFeaturedProduct productId={slide.featured_product_id} />
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
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 z-10">
          <CarouselPrevious className="static translate-y-0 bg-white/20 hover:bg-white/40 border-white/30 text-white h-7 w-7 sm:h-8 sm:w-8" />
          <div className="flex gap-1 sm:gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-5 sm:w-6 bg-white"
                    : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <CarouselNext className="static translate-y-0 bg-white/20 hover:bg-white/40 border-white/30 text-white h-7 w-7 sm:h-8 sm:w-8" />
        </div>
      </Carousel>
    </section>
  );
}
