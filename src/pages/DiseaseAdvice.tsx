import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Stethoscope, Search, ChevronDown, ChevronUp, ShoppingCart, ExternalLink, AlertTriangle, Shield, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeoHead from '@/components/SeoHead';
import { Link } from 'react-router-dom';
import ShareButtons from '@/components/ShareButtons';
import RecommendedProductsSlider from '@/components/RecommendedProductsSlider';

interface Treatment {
  method: string;
  dosage: string;
  duration: string;
}

interface Disease {
  id: string;
  name: string;
  name_en: string;
  category: string;
  severity: string;
  symptoms: string[];
  causes: string[];
  prevention: string[];
  treatment: Treatment[];
  affected_fish: string[];
  season: string[];
  image_url: string | null;
  image_description: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
  external_link: string | null;
}

interface RecommendedProduct {
  product_id: string;
  products: Product;
}

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const severityLabels: Record<string, string> = {
  low: 'হালকা',
  medium: 'মাঝারি',
  high: 'গুরুতর',
  critical: 'মারাত্মক',
};

const categoryLabels: Record<string, string> = {
  bacterial: 'ব্যাক্টেরিয়াজনিত',
  fungal: 'ছত্রাকজনিত',
  parasitic: 'পরজীবীজনিত',
  viral: 'ভাইরাসজনিত',
  nutritional: 'পুষ্টিজনিত',
};

const DiseaseAdvice = () => {
  const { language } = useLanguage();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: diseasesData } = await supabase
      .from('fish_diseases')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const typedDiseases = (diseasesData || []) as unknown as Disease[];
    setDiseases(typedDiseases);

    // Fetch recommended products for all diseases
    const { data: recData } = await supabase
      .from('disease_recommended_products')
      .select('disease_id, product_id, products(id, name, price, discount_percentage, image_url, external_link)')
      .order('display_order', { ascending: true });

    const productMap: Record<string, Product[]> = {};
    if (recData) {
      for (const item of recData as any[]) {
        if (!productMap[item.disease_id]) productMap[item.disease_id] = [];
        if (item.products) productMap[item.disease_id].push(item.products);
      }
    }
    setRecommendedProducts(productMap);
    setLoading(false);
  };

  const filtered = diseases.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.name_en.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const categories = ['all', ...new Set(diseases.map(d => d.category))];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead
        title={language === 'bn' ? 'রোগ ও পরামর্শ | মাছের রোগ নির্ণয় ও চিকিৎসা' : 'Disease & Advice | Fish Disease Diagnosis'}
        description={language === 'bn' ? 'মাছের রোগ চিহ্নিতকরণ, চিকিৎসা ও প্রতিরোধ সম্পর্কে বিস্তারিত তথ্য পান' : 'Fish disease identification, treatment and prevention guide'}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 py-12">
          <div className="container text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              <Stethoscope className="h-5 w-5" />
              <span className="font-bold">{language === 'bn' ? 'ফিশ ডক্টর' : 'Fish Doctor'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {language === 'bn' ? 'রোগ ও পরামর্শ' : 'Disease & Advice'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {language === 'bn'
                ? 'মাছের রোগ শনাক্ত করুন, চিকিৎসা জানুন এবং প্রয়োজনীয় ঔষধ খুঁজে নিন'
                : 'Identify fish diseases, learn treatments and find recommended medicines'}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="container py-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'bn' ? 'রোগের নাম দিয়ে খুঁজুন...' : 'Search diseases...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? (language === 'bn' ? 'সকল' : 'All') : categoryLabels[cat] || cat}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === 'bn' ? 'কোনো রোগ পাওয়া যায়নি' : 'No diseases found'}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(disease => {
                const isExpanded = expandedId === disease.id;
                const products = recommendedProducts[disease.id] || [];

                return (
                  <Card key={disease.id} className="overflow-hidden">
                    {/* Collapsed header */}
                    <button
                      className="w-full text-left p-4 sm:p-6 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : disease.id)}
                    >
                      {disease.image_url && (
                        <img
                          src={disease.image_url}
                          alt={disease.image_description || disease.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-bold text-foreground">{disease.name}</h2>
                            <p className="text-sm text-muted-foreground">{disease.name_en}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />}
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="outline">{categoryLabels[disease.category] || disease.category}</Badge>
                          <Badge className={severityColors[disease.severity]}>{severityLabels[disease.severity] || disease.severity}</Badge>
                          {products.length > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Pill className="h-3 w-3" />
                              {products.length}টি ঔষধ
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <CardContent className="pt-0 px-4 sm:px-6 pb-6 space-y-6 border-t animate-fade-in">
                        {/* Symptoms */}
                        {disease.symptoms.length > 0 && (
                          <div>
                            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              {language === 'bn' ? 'লক্ষণসমূহ' : 'Symptoms'}
                            </h3>
                            <ul className="space-y-1.5">
                              {disease.symptoms.map((s, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-amber-500 mt-0.5">•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Causes */}
                        {disease.causes.length > 0 && (
                          <div>
                            <h3 className="font-bold text-foreground mb-2">
                              {language === 'bn' ? 'কারণসমূহ' : 'Causes'}
                            </h3>
                            <ul className="space-y-1.5">
                              {disease.causes.map((c, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5">•</span> {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Treatment */}
                        {disease.treatment.length > 0 && (
                          <div>
                            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-emerald-500" />
                              {language === 'bn' ? 'চিকিৎসা' : 'Treatment'}
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {disease.treatment.map((t, i) => (
                                <div key={i} className="p-3 rounded-xl bg-muted/50 space-y-1">
                                  <p className="font-medium text-sm text-foreground">{t.method}</p>
                                  {t.dosage && <p className="text-xs text-muted-foreground">মাত্রা: {t.dosage}</p>}
                                  {t.duration && <p className="text-xs text-muted-foreground">সময়কাল: {t.duration}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Prevention */}
                        {disease.prevention.length > 0 && (
                          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              {language === 'bn' ? 'প্রতিরোধ' : 'Prevention'}
                            </h3>
                            <ul className="space-y-1.5">
                              {disease.prevention.map((p, i) => (
                                <li key={i} className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                                  <span className="text-emerald-500 mt-0.5">✓</span> {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Affected fish & season */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {disease.affected_fish.length > 0 && (
                            <div>
                              <span className="font-medium text-foreground">{language === 'bn' ? 'আক্রান্ত মাছ:' : 'Affected fish:'} </span>
                              <span className="text-muted-foreground">{disease.affected_fish.join(', ')}</span>
                            </div>
                          )}
                          {disease.season.length > 0 && (
                            <div>
                              <span className="font-medium text-foreground">{language === 'bn' ? 'প্রাদুর্ভাবের সময়:' : 'Season:'} </span>
                              <span className="text-muted-foreground">{disease.season.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Recommended Products */}
                        {products.length > 0 && (
                          <div>
                            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                              <Pill className="h-4 w-4 text-primary" />
                              {language === 'bn' ? 'প্রস্তাবিত ঔষধ ও পণ্য' : 'Recommended Medicines & Products'}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {products.map(product => {
                                const discountedPrice = product.discount_percentage
                                  ? product.price * (1 - product.discount_percentage / 100)
                                  : product.price;

                                return (
                                  <Link
                                    key={product.id}
                                    to={`/product/${product.id}`}
                                    className="group block rounded-xl border bg-card p-3 hover:shadow-md transition-all hover:border-primary/30"
                                  >
                                    {product.image_url && (
                                      <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2"
                                      />
                                    )}
                                    <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                      {product.name}
                                    </h4>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-sm font-bold text-primary">৳{Math.round(discountedPrice)}</span>
                                      {product.discount_percentage && product.discount_percentage > 0 && (
                                        <span className="text-xs line-through text-muted-foreground">৳{product.price}</span>
                                      )}
                                    </div>
                                    <Button size="sm" variant="outline" className="w-full mt-2 gap-1 text-xs h-7">
                                      <ShoppingCart className="h-3 w-3" />
                                      {language === 'bn' ? 'বিস্তারিত' : 'Details'}
                                    </Button>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <RecommendedProductsSlider category="calculator_related" titleBn="রোগ চিকিৎসার জন্য প্রস্তাবিত পণ্য" title="Recommended Products" />
      <Footer />
      <ShareButtons
        title={language === 'bn' ? 'রোগ ও পরামর্শ | মাছের রোগ নির্ণয় ও চিকিৎসা' : 'Disease & Advice'}
        url="/disease-advice"
      />
    </div>
  );
};

export default DiseaseAdvice;
