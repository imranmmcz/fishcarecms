import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, Minus, RefreshCw, Fish, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { getDivisions, getDistrictsByDivision, getUpazilasByDistrict } from "@/data/bangladeshLocationData";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

interface MarketPrice {
  id: string;
  fish_name: string;
  fish_name_bn: string;
  price_per_kg: number;
  min_price: number | null;
  max_price: number | null;
  division: string;
  district: string;
  upazila: string;
  market_name: string | null;
  price_date: string;
  updated_at: string;
}

const MarketPrice = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const divisions = getDivisions();

  // Fetch market prices
  const fetchPrices = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("market_prices")
        .select("*")
        .order("fish_name_bn", { ascending: true });

      if (division) {
        query = query.eq("division", division);
      }
      if (district) {
        query = query.eq("district", district);
      }
      if (upazila) {
        query = query.eq("upazila", upazila);
      }
      if (searchQuery) {
        query = query.or(`fish_name.ilike.%${searchQuery}%,fish_name_bn.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPrices(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching prices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update districts when division changes
  useEffect(() => {
    if (division) {
      setDistricts(getDistrictsByDivision(division));
      setDistrict("");
      setUpazila("");
    } else {
      setDistricts([]);
    }
  }, [division]);

  // Update upazilas when district changes
  useEffect(() => {
    if (district) {
      setUpazilas(getUpazilasByDistrict(district));
      setUpazila("");
    } else {
      setUpazilas([]);
    }
  }, [district]);

  // Fetch prices when filters change
  useEffect(() => {
    fetchPrices();
  }, [division, district, upazila]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("market_prices_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "market_prices",
        },
        () => {
          fetchPrices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [division, district, upazila]);

  const handleSearch = () => {
    fetchPrices();
  };

  const getPriceStatus = (current: number, min: number | null, max: number | null) => {
    if (!min || !max) return "stable";
    const avg = (min + max) / 2;
    if (current > avg * 1.05) return "high";
    if (current < avg * 0.95) return "low";
    return "stable";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("bn-BD").format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Fish className="h-6 w-6" />
              {language === "bn" ? "বাজার দর" : "Market Price"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "bn"
                ? "অবস্থান অনুযায়ী মাছের বাজার দর দেখুন"
                : "View fish market prices by location"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {language === "bn" ? "অবস্থান নির্বাচন করুন" : "Select Location"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Division */}
              <div className="space-y-2">
                <Label>{language === "bn" ? "বিভাগ" : "Division"}</Label>
                <Select value={division} onValueChange={setDivision}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "bn" ? "বিভাগ নির্বাচন করুন" : "Select Division"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "bn" ? "সকল বিভাগ" : "All Divisions"}
                    </SelectItem>
                    {divisions.map((div) => (
                      <SelectItem key={div} value={div}>
                        {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District */}
              <div className="space-y-2">
                <Label>{language === "bn" ? "জেলা" : "District"}</Label>
                <Select
                  value={district}
                  onValueChange={setDistrict}
                  disabled={!division || division === "all"}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "bn" ? "জেলা নির্বাচন করুন" : "Select District"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "bn" ? "সকল জেলা" : "All Districts"}
                    </SelectItem>
                    {districts.map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upazila */}
              <div className="space-y-2">
                <Label>{language === "bn" ? "উপজেলা" : "Upazila"}</Label>
                <Select
                  value={upazila}
                  onValueChange={setUpazila}
                  disabled={!district || district === "all"}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={language === "bn" ? "উপজেলা নির্বাচন করুন" : "Select Upazila"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "bn" ? "সকল উপজেলা" : "All Upazilas"}
                    </SelectItem>
                    {upazilas.map((upz) => (
                      <SelectItem key={upz} value={upz}>
                        {upz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label>{language === "bn" ? "মাছ খুঁজুন" : "Search Fish"}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={language === "bn" ? "মাছের নাম..." : "Fish name..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button size="icon" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              {language === "bn" ? "লাইভ আপডেট চালু" : "Live updates enabled"}
            </span>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                ({language === "bn" ? "সর্বশেষ: " : "Last: "}
                {format(lastUpdated, "hh:mm:ss a", { locale: language === "bn" ? bn : undefined })})
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchPrices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {language === "bn" ? "রিফ্রেশ" : "Refresh"}
          </Button>
        </div>

        {/* Price Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : prices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "bn" ? "মাছের নাম" : "Fish Name"}</TableHead>
                      <TableHead className="text-right">
                        {language === "bn" ? "দাম (৳/কেজি)" : "Price (৳/kg)"}
                      </TableHead>
                      <TableHead className="text-center">
                        {language === "bn" ? "পরিসীমা" : "Range"}
                      </TableHead>
                      <TableHead className="text-center">
                        {language === "bn" ? "প্রবণতা" : "Trend"}
                      </TableHead>
                      <TableHead>{language === "bn" ? "বাজার" : "Market"}</TableHead>
                      <TableHead>{language === "bn" ? "অবস্থান" : "Location"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map((item) => {
                      const status = getPriceStatus(item.price_per_kg, item.min_price, item.max_price);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Fish className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium">{item.fish_name_bn}</div>
                                <div className="text-xs text-muted-foreground">{item.fish_name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-lg font-bold text-primary">
                              ৳{formatPrice(item.price_per_kg)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.min_price && item.max_price ? (
                              <span className="text-sm text-muted-foreground">
                                ৳{formatPrice(item.min_price)} - ৳{formatPrice(item.max_price)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {status === "high" && (
                              <Badge variant="destructive" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {language === "bn" ? "বেশি" : "High"}
                              </Badge>
                            )}
                            {status === "low" && (
                              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                                <TrendingDown className="h-3 w-3" />
                                {language === "bn" ? "কম" : "Low"}
                              </Badge>
                            )}
                            {status === "stable" && (
                              <Badge variant="outline" className="gap-1">
                                <Minus className="h-3 w-3" />
                                {language === "bn" ? "স্থিতিশীল" : "Stable"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.market_name || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{item.upazila}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.district}, {item.division}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Fish className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">
                  {language === "bn" ? "কোনো তথ্য পাওয়া যায়নি" : "No data found"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "bn"
                    ? "অনুগ্রহ করে অন্য অবস্থান নির্বাচন করুন বা পরে আবার চেষ্টা করুন"
                    : "Please select a different location or try again later"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  {language === "bn" ? "বাজার দর সম্পর্কে" : "About Market Prices"}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {language === "bn"
                    ? "এই দামগুলো স্থানীয় বাজার থেকে সংগৃহীত এবং প্রতিদিন আপডেট করা হয়। প্রকৃত দাম বাজার ও মৌসুম অনুযায়ী ভিন্ন হতে পারে।"
                    : "These prices are collected from local markets and updated daily. Actual prices may vary based on market and season."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default MarketPrice;
