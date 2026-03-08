import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDivisions, getDistrictsByDivision, getUpazilasByDistrict } from "@/data/bangladeshLocationData";
import { Phone, MapPin } from "lucide-react";

export interface AddressFieldsProps {
  mobile: string;
  division: string;
  district: string;
  upazila: string;
  village: string;
  onMobileChange: (value: string) => void;
  onDivisionChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onUpazilaChange: (value: string) => void;
  onVillageChange: (value: string) => void;
  errors?: Record<string, string>;
  variant?: "profile" | "auth";
  hideMobile?: boolean;
}

export function AddressFields({
  mobile,
  division,
  district,
  upazila,
  village,
  onMobileChange,
  onDivisionChange,
  onDistrictChange,
  onUpazilaChange,
  onVillageChange,
  errors = {},
  variant = "profile",
  hideMobile = false,
}: AddressFieldsProps) {
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);
  const divisions = getDivisions();

  useEffect(() => {
    if (division) {
      setDistricts(getDistrictsByDivision(division));
    } else {
      setDistricts([]);
    }
  }, [division]);

  useEffect(() => {
    if (district) {
      setUpazilas(getUpazilasByDistrict(district));
    } else {
      setUpazilas([]);
    }
  }, [district]);

  const handleDivisionChange = (value: string) => {
    onDivisionChange(value);
    onDistrictChange("");
    onUpazilaChange("");
  };

  const handleDistrictChange = (value: string) => {
    onDistrictChange(value);
    onUpazilaChange("");
  };

  const isAuthVariant = variant === "auth";
  const labelClass = isAuthVariant ? "text-white" : "";
  const inputClass = isAuthVariant
    ? "bg-white/10 border-white/20 text-white placeholder:text-slate-400"
    : "";

  return (
    <div className="space-y-4">
      {/* Mobile Number */}
      {!hideMobile && (
        <div className="space-y-2">
          <Label htmlFor="mobile" className={`flex items-center gap-2 ${labelClass}`}>
            <Phone className="h-4 w-4" />
            মোবাইল নম্বর <span className="text-red-400">*</span>
          </Label>
          <Input
            id="mobile"
            type="tel"
            value={mobile}
            onChange={(e) => onMobileChange(e.target.value)}
            placeholder="01XXXXXXXXX"
            className={inputClass}
          />
          {errors.mobile && <p className="text-sm text-red-400">{errors.mobile}</p>}
        </div>
      )}

      {/* Address Section Header */}
      <div className={`flex items-center gap-2 pt-2 ${isAuthVariant ? "text-white" : "text-foreground"}`}>
        <MapPin className="h-4 w-4" />
        <span className="font-medium">ঠিকানা</span>
      </div>

      {/* Division */}
      <div className="space-y-2">
        <Label htmlFor="division" className={labelClass}>
          বিভাগ
        </Label>
        <Select value={division} onValueChange={handleDivisionChange}>
          <SelectTrigger className={`w-full ${inputClass}`}>
            <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            {divisions.map((div) => (
              <SelectItem key={div} value={div}>
                {div}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.division && <p className="text-sm text-red-400">{errors.division}</p>}
      </div>

      {/* District */}
      <div className="space-y-2">
        <Label htmlFor="district" className={labelClass}>
          জেলা
        </Label>
        <Select value={district} onValueChange={handleDistrictChange} disabled={!division}>
          <SelectTrigger className={`w-full ${inputClass}`}>
            <SelectValue placeholder={division ? "জেলা নির্বাচন করুন" : "প্রথমে বিভাগ নির্বাচন করুন"} />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50 max-h-60">
            {districts.map((dist) => (
              <SelectItem key={dist} value={dist}>
                {dist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.district && <p className="text-sm text-red-400">{errors.district}</p>}
      </div>

      {/* Upazila */}
      <div className="space-y-2">
        <Label htmlFor="upazila" className={labelClass}>
          উপজেলা
        </Label>
        <Select value={upazila} onValueChange={onUpazilaChange} disabled={!district}>
          <SelectTrigger className={`w-full ${inputClass}`}>
            <SelectValue placeholder={district ? "উপজেলা নির্বাচন করুন" : "প্রথমে জেলা নির্বাচন করুন"} />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50 max-h-60">
            {upazilas.map((upa) => (
              <SelectItem key={upa} value={upa}>
                {upa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.upazila && <p className="text-sm text-red-400">{errors.upazila}</p>}
      </div>

      {/* Village/Union */}
      <div className="space-y-2">
        <Label htmlFor="village" className={labelClass}>
          গ্রাম / ইউনিয়ন / ওয়ার্ড
        </Label>
        <Input
          id="village"
          type="text"
          value={village}
          onChange={(e) => onVillageChange(e.target.value)}
          placeholder="গ্রাম বা ইউনিয়নের নাম লিখুন"
          className={inputClass}
        />
        {errors.village && <p className="text-sm text-red-400">{errors.village}</p>}
      </div>
    </div>
  );
}
