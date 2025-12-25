import { useState } from "react";
import { ArrowLeft, Phone, Mail, Globe, MapPin, Search, Building2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  departmentHeadquarters, 
  getDivisions, 
  getDistrictsByDivision, 
  getUpazilasByDistrict,
  searchOffices,
  UpazilaFisheriesOffice
} from "@/data/fisheriesContactData";

const FisheriesContact = () => {
  const navigate = useNavigate();
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<UpazilaFisheriesOffice[]>([]);

  const divisions = getDivisions();
  const districts = selectedDivision ? getDistrictsByDivision(selectedDivision) : [];
  const upazilas = selectedDistrict ? getUpazilasByDistrict(selectedDistrict) : [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchOffices(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleDivisionChange = (value: string) => {
    setSelectedDivision(value);
    setSelectedDistrict("");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSearchQuery("");
    setSearchResults([]);
  };

  const displayOffices = searchQuery.length >= 2 ? searchResults : upazilas;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">মৎস্য অধিদপ্তর যোগাযোগ</h1>
              <p className="text-sm text-teal-100">আপনার নিকটস্থ উপজেলা মৎস্য কর্মকর্তার সাথে যোগাযোগ করুন</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Headquarters Contact */}
        <Card className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              {departmentHeadquarters.name} - প্রধান কার্যালয়
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
              <span className="text-sm">{departmentHeadquarters.address}</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href={`tel:${departmentHeadquarters.phone}`} className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm hover:bg-white/30 transition-colors">
                <Phone className="h-4 w-4" />
                {departmentHeadquarters.phone}
              </a>
              <a href={`mailto:${departmentHeadquarters.email}`} className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm hover:bg-white/30 transition-colors">
                <Mail className="h-4 w-4" />
                {departmentHeadquarters.email}
              </a>
              <a href={departmentHeadquarters.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm hover:bg-white/30 transition-colors">
                <Globe className="h-4 w-4" />
                ওয়েবসাইট
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-teal-700">আপনার উপজেলা মৎস্য অফিস খুঁজুন</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="উপজেলা, জেলা বা বিভাগের নাম লিখুন..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="text-center text-sm text-muted-foreground">অথবা</div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">বিভাগ নির্বাচন করুন</label>
                <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division} value={division}>
                        {division} বিভাগ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">জেলা নির্বাচন করুন</label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={handleDistrictChange}
                  disabled={!selectedDivision}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedDivision ? "জেলা নির্বাচন করুন" : "প্রথমে বিভাগ নির্বাচন করুন"} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {displayOffices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-teal-700">
                {searchQuery.length >= 2 
                  ? `"${searchQuery}" এর জন্য ${displayOffices.length}টি ফলাফল পাওয়া গেছে`
                  : `${selectedDistrict} জেলার উপজেলা মৎস্য অফিস (${displayOffices.length}টি)`
                }
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {displayOffices.map((office) => (
                <Card key={office.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-teal-700">{office.upazila}</h4>
                        <p className="text-sm text-muted-foreground">{office.officeName}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {office.division}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{office.district} জেলা</span>
                    </div>

                    {office.website && (
                      <a 
                        href={office.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        অফিসের ওয়েবসাইট দেখুন
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchQuery.length >= 2 && searchResults.length === 0 && (
          <Card className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">কোন ফলাফল পাওয়া যায়নি</h3>
            <p className="text-muted-foreground mt-2">
              "{searchQuery}" এর জন্য কোন মৎস্য অফিস পাওয়া যায়নি। অনুগ্রহ করে অন্য কিছু অনুসন্ধান করুন।
            </p>
          </Card>
        )}

        {/* Initial State */}
        {displayOffices.length === 0 && searchQuery.length < 2 && (
          <Card className="p-8 text-center bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <Building2 className="h-12 w-12 mx-auto text-teal-500 mb-4" />
            <h3 className="text-lg font-semibold text-teal-700">আপনার উপজেলা মৎস্য অফিস খুঁজুন</h3>
            <p className="text-muted-foreground mt-2">
              উপরে অনুসন্ধান বক্সে আপনার উপজেলা/জেলার নাম লিখুন অথবা বিভাগ ও জেলা নির্বাচন করুন।
            </p>
          </Card>
        )}

        {/* Info Section */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-amber-800 mb-2">📞 যোগাযোগের টিপস</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• অফিসের ওয়েবসাইটে বিস্তারিত যোগাযোগ তথ্য পাওয়া যাবে</li>
              <li>• সাধারণত অফিস সময় সকাল ৯টা থেকে বিকাল ৫টা পর্যন্ত</li>
              <li>• জরুরি প্রয়োজনে জেলা মৎস্য অফিসে যোগাযোগ করুন</li>
              <li>• মৎস্য সংক্রান্ত অভিযোগের জন্য হটলাইন: ৩৩৩ (কল করুন)</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FisheriesContact;
