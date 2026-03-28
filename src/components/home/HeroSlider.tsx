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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<any>(null);
  
  // Autoplay plugin with 5 second delay
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
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
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
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => {
            const IconComponent = iconMap[slide.tagline_icon || "Sparkles"] || Sparkles;
            
            return (
              <CarouselItem key={slide.id}>
                <div
                  className="py-12 sm:py-20 relative min-h-[300px] sm:min-h-[400px] flex items-center"
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
                  {/* Dark overlay for image backgrounds */}
                  {slide.background_type === 'image' && (
                    <div
                      className="absolute inset-0 bg-black pointer-events-none"
                      style={{ opacity: 1 - ((slide as any).bg_opacity ?? 1) }}
                    />
                  )}
                  <div className="container relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="flex-1 text-center space-y-6 animate-fade-in">
                        {slide.tagline && (
                          <div className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur-sm">
                            <IconComponent className="inline h-4 w-4 mr-1" />
                            {slide.tagline}
                          </div>
                        )}
                        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
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
                      {/* Desktop featured product */}
                      {slide.featured_product_id && (
                        <div className="hidden md:block flex-shrink-0">
                          <HeroFeaturedProduct productId={slide.featured_product_id} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Mobile featured product */}
                  {slide.featured_product_id && (
                    <div className="md:hidden flex justify-center mt-4 relative z-10">
                      <HeroFeaturedProduct productId={slide.featured_product_id} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          <CarouselPrevious className="static translate-y-0 bg-white/20 hover:bg-white/40 border-white/30 text-white" />
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <CarouselNext className="static translate-y-0 bg-white/20 hover:bg-white/40 border-white/30 text-white" />
        </div>
      </Carousel>
    </section>
  );
}
