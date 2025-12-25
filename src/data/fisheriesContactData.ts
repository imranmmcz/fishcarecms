// Data collected from https://fisheries.portal.gov.bd/site/page/51b20add-af50-4471-b557-7b8dabdecc77/-

export interface UpazilaFisheriesOffice {
  id: number;
  upazila: string;
  district: string;
  division: string;
  officeName: string;
  website: string;
  phone?: string;
  email?: string;
}

export interface DepartmentContact {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

// মৎস্য অধিদপ্তর প্রধান কার্যালয়ের যোগাযোগ তথ্য
export const departmentHeadquarters: DepartmentContact = {
  name: "মৎস্য অধিদপ্তর",
  address: "১৩, শহীদ ক্যাপ্টেন মনসুর আলী সরণি, মৎস্য ভবন, রমনা, ঢাকা-১০০০",
  phone: "০২-৯৫৬২৪৩৮",
  email: "dg@fisheries.gov.bd",
  website: "https://fisheries.gov.bd"
};

// বিভাগভিত্তিক জেলা তালিকা
export const divisionDistricts: Record<string, string[]> = {
  "ঢাকা": ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নরসিংদী", "টাঙ্গাইল", "কিশোরগঞ্জ", "মাদারীপুর", "শরীয়তপুর", "রাজবাড়ী", "গোপালগঞ্জ", "ফরিদপুর"],
  "চট্টগ্রাম": ["চট্টগ্রাম", "কক্সবাজার", "রাঙ্গামাটি", "খাগড়াছড়ি", "বান্দরবান", "কুমিল্লা", "চাঁদপুর", "ব্রাহ্মণবাড়িয়া", "ফেনী", "লক্ষ্মীপুর", "নোয়াখালী"],
  "রাজশাহী": ["রাজশাহী", "নাটোর", "নওগাঁ", "চাঁপাইনবাবগঞ্জ", "পাবনা", "সিরাজগঞ্জ", "বগুড়া", "জয়পুরহাট"],
  "খুলনা": ["খুলনা", "বাগেরহাট", "সাতক্ষীরা", "যশোর", "নড়াইল", "মাগুরা", "ঝিনাইদহ", "কুষ্টিয়া", "মেহেরপুর", "চুয়াডাঙ্গা"],
  "বরিশাল": ["বরিশাল", "পটুয়াখালী", "ভোলা", "পিরোজপুর", "ঝালকাঠি", "বরগুনা"],
  "সিলেট": ["সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ"],
  "রংপুর": ["রংপুর", "দিনাজপুর", "ঠাকুরগাঁও", "পঞ্চগড়", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী"],
  "ময়মনসিংহ": ["ময়মনসিংহ", "জামালপুর", "শেরপুর", "নেত্রকোনা"]
};

// সরকারী উপজেলা মৎস্য কার্যালয় তালিকা (সংক্ষিপ্ত নমুনা - পোর্টাল থেকে সংগৃহীত)
export const upazilaFisheriesOffices: UpazilaFisheriesOffice[] = [
  // ঢাকা বিভাগ
  { id: 1, upazila: "সাভার", district: "ঢাকা", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সাভার, ঢাকা", website: "http://fisheries.savar.dhaka.gov.bd" },
  { id: 2, upazila: "ধামরাই", district: "ঢাকা", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ধামরাই, ঢাকা", website: "http://fisheries.dhamrai.dhaka.gov.bd" },
  { id: 3, upazila: "কেরানীগঞ্জ", district: "ঢাকা", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কেরানীগঞ্জ, ঢাকা", website: "http://fisheries.keraniganj.dhaka.gov.bd" },
  { id: 4, upazila: "গাজীপুর সদর", district: "গাজীপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গাজীপুর সদর, গাজীপুর", website: "http://fisheries.sadar.gazipur.gov.bd" },
  { id: 5, upazila: "শ্রীপুর", district: "গাজীপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, শ্রীপুর, গাজীপুর", website: "http://fisheries.sreepur.gazipur.gov.bd" },
  { id: 6, upazila: "কাপাসিয়া", district: "গাজীপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কাপাসিয়া, গাজীপুর", website: "http://fisheries.kapasia.gazipur.gov.bd" },
  { id: 7, upazila: "সোনারগাঁ", district: "নারায়ণগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, সোনারগাঁ, নারায়ণগঞ্জ", website: "http://fisheries.sonargaon.narayanganj.gov.bd" },
  { id: 8, upazila: "নারায়ণগঞ্জ সদর", district: "নারায়ণগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নারায়ণগঞ্জ সদর, নারায়ণগঞ্জ", website: "http://fisheries.narayanganjsadar.narayanganj.gov.bd" },
  { id: 9, upazila: "আড়াইহাজার", district: "নারায়ণগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, আড়াইহাজার, নারায়ণগঞ্জ", website: "http://fisheries.araihazar.narayanganj.gov.bd" },
  { id: 10, upazila: "রূপগঞ্জ", district: "নারায়ণগঞ্জ", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, রূপগঞ্জ, নারায়ণগঞ্জ", website: "http://fisheries.rupganj.narayanganj.gov.bd" },
  { id: 11, upazila: "মানিকগঞ্জ সদর", district: "মানিকগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মানিকগঞ্জ সদর, মানিকগঞ্জ", website: "http://fisheries.sadar.manikganj.gov.bd" },
  { id: 12, upazila: "সিংগাইর", district: "মানিকগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সিংগাইর, মানিকগঞ্জ", website: "http://fisheries.singiar.manikganj.gov.bd" },
  { id: 13, upazila: "শিবালয়", district: "মানিকগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শিবালয়, মানিকগঞ্জ", website: "http://fisheries.shibaloy.manikganj.gov.bd" },
  { id: 14, upazila: "হরিরামপুর", district: "মানিকগঞ্জ", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হরিরামপুর, মানিকগঞ্জ", website: "http://fisheries.harirampur.manikganj.gov.bd" },
  { id: 15, upazila: "সাটুরিয়া", district: "মানিকগঞ্জ", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সাটুরিয়া, মানিকগঞ্জ", website: "http://fisheries.saturia.manikganj.gov.bd" },
  { id: 16, upazila: "ঘিওর", district: "মানিকগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ঘিওর, মানিকগঞ্জ", website: "http://fisheries.gior.manikganj.gov.bd" },
  { id: 17, upazila: "মুন্সিগঞ্জ সদর", district: "মুন্সিগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মুন্সিগঞ্জ সদর, মুন্সিগঞ্জ", website: "http://fisheries.sadar.munshiganj.gov.bd" },
  { id: 18, upazila: "সিরাজদিখান", district: "মুন্সিগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সিরাজদিখান, মুন্সিগঞ্জ", website: "http://fisheries.sirajdikhan.munshiganj.gov.bd" },
  { id: 19, upazila: "শ্রীনগর", district: "মুন্সিগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শ্রীনগর, মুন্সিগঞ্জ", website: "http://fisheries.sreenagar.munshiganj.gov.bd" },
  { id: 20, upazila: "লৌহজং", district: "মুন্সিগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, লৌহজং, মুন্সিগঞ্জ", website: "http://fisheries.louhajanj.munshiganj.gov.bd" },
  { id: 21, upazila: "টংগিবাড়ি", district: "মুন্সিগঞ্জ", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারেরকার্যালয়, টংগিবাড়ি, মুন্সিগঞ্জ", website: "http://fisheries.tongibari.munshiganj.gov.bd" },
  { id: 22, upazila: "নরসিংদী সদর", district: "নরসিংদী", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নরসিংদী সদর, নরসিংদী", website: "http://fisheries.narsingdisadar.narsingdi.gov.bd" },
  { id: 23, upazila: "মনোহরদী", district: "নরসিংদী", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মনোহরদী, নরসিংদী", website: "http://fisheries.monohardi.narsingdi.gov.bd" },
  { id: 24, upazila: "রায়পুরা", district: "নরসিংদী", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রায়পুরা, নরসিংদী", website: "http://fisheries.raipura.narsingdi.gov.bd" },
  { id: 25, upazila: "শিবপুর", district: "নরসিংদী", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারেরকার্যালয়, শিবপুর, নরসিংদী", website: "http://fisheries.shibpur.narsingdi.gov.bd" },
  { id: 26, upazila: "পলাশ", district: "নরসিংদী", division: "ঢাকা", officeName: "উপজেলা মৎস্য কার্যালয়, পলাশ, নরসিংদী", website: "http://fisheries.palash.narsingdi.gov.bd" },
  { id: 27, upazila: "টাঙ্গাইল সদর", district: "টাঙ্গাইল", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, টাঙ্গাইল সদর, টাঙ্গাইল", website: "http://fisheries.tangailsadar.tangail.gov.bd" },
  { id: 28, upazila: "মির্জাপুর", district: "টাঙ্গাইল", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মির্জাপুর, টাঙ্গাইল", website: "http://fisheries.mirzapur.tangail.gov.bd" },
  { id: 29, upazila: "গোপালপুর", district: "টাঙ্গাইল", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গোপালপুর, টাঙ্গাইল", website: "http://fisheries.gopalpur.tangail.gov.bd" },
  { id: 30, upazila: "মধুপুর", district: "টাঙ্গাইল", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মধুপুর, টাঙ্গাইল", website: "http://fisheries.madhupur.tangail.gov.bd" },
  { id: 31, upazila: "দেলদুয়ার", district: "টাঙ্গাইল", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, দেলদুয়ার, টাঙ্গাইল", website: "http://fisheries.delduar.tangail.gov.bd" },
  { id: 32, upazila: "সখিপুর", district: "টাঙ্গাইল", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সখিপুর, টাঙ্গাইল", website: "http://fisheries.sakhipur.tangail.gov.bd" },
  { id: 33, upazila: "কিশোরগঞ্জ সদর", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কিশোরগঞ্জ সদর, কিশোরগঞ্জ", website: "http://fisheries.kishoreganjsadar.kishoreganj.gov.bd" },
  { id: 34, upazila: "বাজিতপুর", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, বাজিতপুর, কিশোরগঞ্জ", website: "http://fisheries.bajitpur.kishoreganj.gov.bd" },
  { id: 35, upazila: "মিঠামইন", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মিঠামইন, কিশোরগঞ্জ", website: "http://fisheries.mithamoin.kishoreganj.gov.bd" },
  { id: 36, upazila: "ভৈরব", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ভৈরব, কিশোরগঞ্জ", website: "http://fisheries.bhairab.kishoreganj.gov.bd" },
  { id: 37, upazila: "কুলিয়ারচর", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কুলিয়ারচর, কিশোরগঞ্জ", website: "http://fisheries.kuliarchar.kishoreganj.gov.bd" },
  { id: 38, upazila: "করিমগঞ্জ", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, করিমগঞ্জ, কিশোরগঞ্জ", website: "http://fisheries.karimgonj.kishoreganj.gov.bd" },
  { id: 39, upazila: "কটিয়াদী", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কটিয়াদী, কিশোরগঞ্জ", website: "http://fisheries.katiadi.kishoreganj.gov.bd" },
  { id: 40, upazila: "হোসেনপুর", district: "কিশোরগঞ্জ", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হোসেনপুর, কিশোরগঞ্জ", website: "http://fisheries.hossainpur.kishoreganj.gov.bd" },
  { id: 41, upazila: "মাদারীপুর সদর", district: "মাদারীপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মাদারীপুর সদর, মাদারীপুর", website: "http://fisheries.sadar.madaripur.gov.bd" },
  { id: 42, upazila: "শিবচর", district: "মাদারীপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শিবচর, মাদারীপুর", website: "http://fisheries.shibchar.madaripur.gov.bd" },
  { id: 43, upazila: "কালকিনি", district: "মাদারীপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কালকিনি, মাদারীপুর", website: "http://fisheries.kalkini.madaripur.gov.bd" },
  { id: 44, upazila: "রাজৈর", district: "মাদারীপুর", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, রাজৈর, মাদারীপুর", website: "http://fisheries.rajoir.madaripur.gov.bd" },
  { id: 45, upazila: "শরীয়তপুর সদর", district: "শরীয়তপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শরীয়তপুর সদর, শরীয়তপুর", website: "http://fisheries.sadar.shariatpur.gov.bd" },
  { id: 46, upazila: "ভেদরগঞ্জ", district: "শরীয়তপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, ভেদরগঞ্জ, শরীয়তপুর", website: "http://fisheries.bhedarganj.shariatpur.gov.bd" },
  { id: 47, upazila: "গোসাইরহাট", district: "শরীয়তপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, গোসাইরহাট, শরীয়তপুর", website: "http://fisheries.gosairhat.shariatpur.gov.bd" },
  { id: 48, upazila: "নড়িয়া", district: "শরীয়তপুর", division: "ঢাকা", officeName: "উপজেলা মৎস্য কার্যালয়, নড়িয়া, শরীয়তপুর", website: "http://fisheries.naria.shariatpur.gov.bd" },
  { id: 49, upazila: "ডামুড্যা", district: "শরীয়তপুর", division: "ঢাকা", officeName: "উপজেলা মৎস্য কার্যালয়, ডামুড্যা, শরীয়তপুর", website: "http://fisheries.damudya.shariatpur.gov.bd" },
  { id: 50, upazila: "রাজবাড়ী সদর", district: "রাজবাড়ী", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রাজবাড়ী সদর, রাজবাড়ী", website: "http://fisheries.sadar.rajbari.gov.bd" },
  { id: 51, upazila: "গোয়ালন্দ", district: "রাজবাড়ী", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গোয়ালন্দ, রাজবাড়ী", website: "http://fisheries.goalanda.rajbari.gov.bd" },
  { id: 52, upazila: "গোপালগঞ্জ সদর", district: "গোপালগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গোপালগঞ্জ সদর, গোপালগঞ্জ", website: "http://fisheries.sadar.gopalganj.gov.bd" },
  { id: 53, upazila: "মুকসুদপুর", district: "গোপালগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মুকসুদপুর, গোপালগঞ্জ", website: "http://fisheries.muksudpur.gopalganj.gov.bd" },
  { id: 54, upazila: "কোটালীপাড়া", district: "গোপালগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কোটালীপাড়া, গোপালগঞ্জ", website: "http://fisheries.kotalipara.gopalganj.gov.bd" },
  { id: 55, upazila: "টুঙ্গীপাড়া", district: "গোপালগঞ্জ", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, টুঙ্গীপাড়া, গোপালগঞ্জ", website: "http://fisheries.tungipara.gopalganj.gov.bd" },
  { id: 56, upazila: "ফরিদপুর সদর", district: "ফরিদপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ফরিদপুর সদর, ফরিদপুর", website: "" },
  { id: 57, upazila: "মধুখালী", district: "ফরিদপুর", division: "ঢাকা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মধুখালী, ফরিদপুর", website: "http://fisheries.madhukhali.faridpur.gov.bd" },
  { id: 58, upazila: "সালথা", district: "ফরিদপুর", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সালথা, ফরিদপুর", website: "http://fisheries.saltha.faridpur.gov.bd" },
  { id: 59, upazila: "সদরপুর", district: "ফরিদপুর", division: "ঢাকা", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সদরপুর, ফরিদপুর", website: "http://fisheries.sadarpur.faridpur.gov.bd" },

  // চট্টগ্রাম বিভাগ
  { id: 60, upazila: "হাটহাজারী", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, হাটহাজারী, চট্টগ্রাম", website: "http://fisheries.hathazari.chittagong.gov.bd" },
  { id: 61, upazila: "বাঁশখালী", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, বাঁশখালী, চট্টগ্রাম", website: "http://fisheries.banshkhali.chittagong.gov.bd" },
  { id: 62, upazila: "মীরসরাই", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মীরসরাই, চট্টগ্রাম", website: "http://fisheries.mirsharai.chittagong.gov.bd" },
  { id: 63, upazila: "রাউজান", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রাউজান, চট্টগ্রাম", website: "http://fisheries.raozan.chittagong.gov.bd" },
  { id: 64, upazila: "পটিয়া", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পটিয়া, চট্টগ্রাম", website: "http://fisheries.patiya.chittagong.gov.bd" },
  { id: 65, upazila: "কর্ণফুলী", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কর্ণফুলী, চট্টগ্রাম", website: "http://fisheries.karnafuli.chittagong.gov.bd" },
  { id: 66, upazila: "আনোয়ারা", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, আনোয়ারা, চট্টগ্রাম", website: "http://fisheries.anwara.chittagong.gov.bd" },
  { id: 67, upazila: "সন্দ্বীপ", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সন্দ্বীপ, চট্টগ্রাম", website: "http://fisheries.sandwip.chittagong.gov.bd" },
  { id: 68, upazila: "সীতাকুন্ড", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সীতাকুন্ড, চট্টগ্রাম", website: "http://fisheries.sitakunda.chittagong.gov.bd" },
  { id: 69, upazila: "সাতকানিয়া", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সাতকানিয়া, চট্টগ্রাম", website: "http://fisheries.satkania.chittagong.gov.bd" },
  { id: 70, upazila: "লোহাগাড়া", district: "চট্টগ্রাম", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, লোহাগাড়া, চট্টগ্রাম", website: "https://lohagara.chittagong.gov.bd" },
  { id: 71, upazila: "কক্সবাজার সদর", district: "কক্সবাজার", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কক্সবাজার সদর, কক্সবাজার", website: "http://fisheries.sadar.coxsbazar.gov.bd" },
  { id: 72, upazila: "মহেশখালী", district: "কক্সবাজার", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মহেশখালী, কক্সবাজার", website: "http://fisheries.moheshkhali.coxsbazar.gov.bd" },
  { id: 73, upazila: "পেকুয়া", district: "কক্সবাজার", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পেকুয়া, কক্সবাজার", website: "http://fisheries.pekua.coxsbazar.gov.bd" },
  { id: 74, upazila: "চকরিয়া", district: "কক্সবাজার", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, চকরিয়া, কক্সবাজার", website: "http://fisheries.chakaria.coxsbazar.gov.bd" },
  { id: 75, upazila: "টেকনাফ", district: "কক্সবাজার", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, টেকনাফ, কক্সবাজার", website: "http://fisheries.teknaf.coxsbazar.gov.bd" },
  { id: 76, upazila: "রামু", district: "কক্সবাজার", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, রামু, কক্সবাজার", website: "http://fisheries.ramu.coxsbazar.gov.bd" },
  { id: 77, upazila: "কুতুবদিয়া", district: "কক্সবাজার", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য কার্যালয়, কুতুবদিয়া, কক্সবাজার", website: "http://fisheries.kutubdia.coxsbazar.gov.bd" },
  { id: 78, upazila: "রাঙ্গামাটি সদর", district: "রাঙ্গামাটি", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রাঙ্গামাটি সদর, রাঙ্গামাটি", website: "http://fisheries.sadar.rangamati.gov.bd" },
  { id: 79, upazila: "কাপ্তাই", district: "রাঙ্গামাটি", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কাপ্তাই, রাঙ্গামাটি", website: "http://fisheries.kaptai.rangamati.gov.bd" },
  { id: 80, upazila: "লংগদু", district: "রাঙ্গামাটি", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, লংগদু, রাঙ্গামাটি", website: "http://fisheries.langadu.rangamati.gov.bd" },
  { id: 81, upazila: "খাগড়াছড়ি সদর", district: "খাগড়াছড়ি", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, খাগড়াছড়ি সদর, খাগড়াছড়ি", website: "http://fisheries.sadar.khagrachhari.gov.bd" },
  { id: 82, upazila: "মাটিরাঙ্গা", district: "খাগড়াছড়ি", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য কার্যালয়, মাটিরাঙ্গা, খাগড়াছড়ি", website: "http://fisheries.matiranga.khagrachhari.gov.bd" },
  { id: 83, upazila: "লক্ষীছড়ি", district: "খাগড়াছড়ি", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য কার্যালয়, লক্ষীছড়ি, খাগড়াছড়ি", website: "http://fisheries.laxmichhari.khagrachhari.gov.bd" },
  { id: 84, upazila: "রামগড়", district: "খাগড়াছড়ি", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, রামগড়, খাগড়াছড়ি", website: "http://fisheries.ramgarh.khagrachhari.gov.bd" },
  { id: 85, upazila: "বান্দরবান সদর", district: "বান্দরবান", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বান্দরবান সদর, বান্দরবান", website: "http://fisheries.sadar.bandarban.gov.bd" },
  { id: 86, upazila: "লামা", district: "বান্দরবান", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, লামা, বান্দরবান", website: "http://fisheries.lama.bandarban.gov.bd" },
  { id: 87, upazila: "রোয়াংছড়ি", district: "বান্দরবান", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, রোয়াংছড়ি, বান্দরবান", website: "http://rowangchhari.bandarban.gov.bd" },
  { id: 88, upazila: "কুমিল্লা সদর", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কুমিল্লা আদর্শ সদর, কুমিল্লা", website: "http://fisheries.comillasadar.comilla.gov.bd" },
  { id: 89, upazila: "চান্দিনা", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, চান্দিনা, কুমিল্লা", website: "http://fisheries.chandina.comilla.gov.bd" },
  { id: 90, upazila: "লাকসাম", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, লাকসাম, কুমিল্লা", website: "http://fisheries.laksam.comilla.gov.bd" },
  { id: 91, upazila: "মুরাদনগর", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মুরাদনগর, কুমিল্লা", website: "http://fisheries.muradnagar.comilla.gov.bd" },
  { id: 92, upazila: "বুড়িচং", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বুড়িচং, কুমিল্লা", website: "http://fisheries.burichang.comilla.gov.bd" },
  { id: 93, upazila: "চৌদ্দগ্রাম", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, চৌদ্দগ্রাম, কুমিল্লা", website: "http://fisheries.chauddagram.comilla.gov.bd" },
  { id: 94, upazila: "দাউদকান্দি", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, দাউদকান্দি, কুমিল্লা", website: "http://fisheries.daudkandi.comilla.gov.bd" },
  { id: 95, upazila: "দেবিদ্বার", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, দেবিদ্বার, কুমিল্লা", website: "http://fisheries.debidwar.comilla.gov.bd" },
  { id: 96, upazila: "হোমনা", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হোমনা, কুমিল্লা", website: "http://fisheries.homna.comilla.gov.bd" },
  { id: 97, upazila: "লালমাই", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, লালমাই, কুমিল্লা", website: "http://fisheries.lalmai.comilla.gov.bd" },
  { id: 98, upazila: "ব্রাহ্মণপাড়া", district: "কুমিল্লা", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য কার্যালয়, ব্রাহ্মণপাড়া, কুমিল্লা", website: "http://fisheries.brahmanpara.comilla.gov.bd" },
  { id: 99, upazila: "চাঁদপুর সদর", district: "চাঁদপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, চাঁদপুর সদর, চাঁদপুর", website: "http://fisheries.sadar.chandpur.gov.bd" },
  { id: 100, upazila: "হাইমচর", district: "চাঁদপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, হাইমচর, চাঁদপুর", website: "http://fisheries.haimchar.chandpur.gov.bd" },
  { id: 101, upazila: "মতলব দক্ষিণ", district: "চাঁদপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মতলব দক্ষিণ, চাঁদপুর", website: "http://fisheries.matlabsouth.chandpur.gov.bd" },
  { id: 102, upazila: "মতলব উত্তর", district: "চাঁদপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মতলব উত্তর, চাঁদপুর", website: "http://fisheries.matlabnorth.chandpur.gov.bd" },
  { id: 103, upazila: "কচুয়া", district: "চাঁদপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কচুয়া, চাঁদপুর", website: "http://fisheries.kachua.chandpur.gov.bd" },
  { id: 104, upazila: "হাজীগঞ্জ", district: "চাঁদপুর", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হাজীগঞ্জ, চাঁদপুর", website: "http://fisheries.hajiganj.chandpur.gov.bd" },
  { id: 105, upazila: "শাহারাস্তি", district: "চাঁদপুর", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, শাহারাস্তি, চাঁদপুর", website: "http://fisheries.shahrasti.chandpur.gov.bd" },
  { id: 106, upazila: "ব্রাহ্মণবাড়িয়া সদর", district: "ব্রাহ্মণবাড়িয়া", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ব্রাহ্মণবাড়িয়া সদর, ব্রাহ্মণবাড়িয়া", website: "http://fisharies.sadar.brahmanbaria.gov.bd" },
  { id: 107, upazila: "নাসিরনগর", district: "ব্রাহ্মণবাড়িয়া", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নাসিরনগর, ব্রাহ্মণবাড়িয়া", website: "http://fisheries.nasirnagar.brahmanbaria.gov.bd" },
  { id: 108, upazila: "নবীনগর", district: "ব্রাহ্মণবাড়িয়া", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নবীনগর, ব্রাহ্মণবাড়িয়া", website: "http://fisheries.nabinagar.brahmanbaria.gov.bd" },
  { id: 109, upazila: "আখাউড়া", district: "ব্রাহ্মণবাড়িয়া", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, আখাউড়া, ব্রাহ্মণবাড়িয়া", website: "http://fisheries.akhaura.brahmanbaria.gov.bd" },
  { id: 110, upazila: "সরাইল", district: "ব্রাহ্মণবাড়িয়া", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সরাইল, ব্রাহ্মণবাড়িয়া", website: "http://fisheries.sarail.brahmanbaria.gov.bd" },
  { id: 111, upazila: "আশুগঞ্জ", district: "ব্রাহ্মণবাড়িয়া", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য কার্যালয়, আশুগঞ্জ, ব্রাহ্মণবাড়িয়া", website: "http://fisheries.ashuganj.brahmanbaria.gov.bd" },
  { id: 112, upazila: "ফেনী সদর", district: "ফেনী", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ফেনী সদর, ফেনী", website: "http://fisharies.sadar.feni.gov.bd" },
  { id: 113, upazila: "ছাগলনাইয়া", district: "ফেনী", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ছাগলনাইয়া, ফেনী", website: "http://fisheries.chhagalnaiya.feni.gov.bd" },
  { id: 114, upazila: "সোনাগাজী", district: "ফেনী", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সোনাগাজী, ফেনী", website: "http://fisheries.sonagazi.feni.gov.bd" },
  { id: 115, upazila: "ফুলগাজী", district: "ফেনী", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য কার্যালয়, ফুলগাজী, ফেনী", website: "http://fisheries.fulgazi.feni.gov.bd" },
  { id: 116, upazila: "লক্ষ্মীপুর সদর", district: "লক্ষ্মীপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, লক্ষ্মীপুর সদর, লক্ষ্মীপুর", website: "http://fisheries.sadar.lakshmipur.gov.bd" },
  { id: 117, upazila: "রায়পুর", district: "লক্ষ্মীপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রায়পুর, লক্ষ্মীপুর", website: "http://fisheries.raipur.lakshmipur.gov.bd" },
  { id: 118, upazila: "রামগতি", district: "লক্ষ্মীপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রামগতি, লক্ষ্মীপুর", website: "http://fisheries.ramgati.lakshmipur.gov.bd" },
  { id: 119, upazila: "কমলনগর", district: "লক্ষ্মীপুর", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কমলনগর, লক্ষ্মীপুর", website: "http://fisheries.kamalnagar.lakshmipur.gov.bd" },
  { id: 120, upazila: "রামগঞ্জ", district: "লক্ষ্মীপুর", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, রামগঞ্জ, লক্ষ্মীপুর", website: "http://fisheries.ramganj.lakshmipur.gov.bd" },
  { id: 121, upazila: "নোয়াখালী সদর", district: "নোয়াখালী", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নোয়াখালী সদর, নোয়াখালী", website: "http://fisheries.sadar.noakhali.gov.bd" },
  { id: 122, upazila: "বেগমগঞ্জ", district: "নোয়াখালী", division: "চট্টগ্রাম", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বেগমগঞ্জ, নোয়াখালী", website: "http://fisheries.begumganj.noakhali.gov.bd" },
  { id: 123, upazila: "হাতিয়া", district: "নোয়াখালী", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হাতিয়া, নোয়াখালী", website: "http://fisheries.hatia.noakhali.gov.bd" },
  { id: 124, upazila: "সোনাইমুড়ি", district: "নোয়াখালী", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সোনাইমুড়ি, নোয়াখালী", website: "http://fisheries.sonaimuri.noakhali.gov.bd" },
  { id: 125, upazila: "সুবর্নচর", district: "নোয়াখালী", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সুবর্নচর, নোয়াখালী", website: "http://fisheries.subarnachar.noakhali.gov.bd" },
  { id: 126, upazila: "সেনবাগ", district: "নোয়াখালী", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সেনবাগ, নোয়াখালী", website: "http://fisheries.senbag.noakhali.gov.bd" },
  { id: 127, upazila: "কবিরহাট", district: "নোয়াখালী", division: "চট্টগ্রাম", officeName: "উপজেলা মৎস্য কার্যালয়, কবিরহাট, নোয়াখালী", website: "http://fisheries.kabirhat.noakhali.gov.bd" },

  // খুলনা বিভাগ
  { id: 128, upazila: "রূপসা", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রূপসা, খুলনা", website: "http://fisheries.rupsha.khulna.gov.bd" },
  { id: 129, upazila: "ফুলতলা", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ফুলতলা, খুলনা", website: "http://fisheries.fultola.khulna.gov.bd" },
  { id: 130, upazila: "দীঘলিয়া", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, দীঘলিয়া, খুলনা", website: "http://fisheries.digholia.khulna.gov.bd" },
  { id: 131, upazila: "দাকোপ", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, দাকোপ, খুলনা", website: "http://fisheries.dakop.khulna.gov.bd" },
  { id: 132, upazila: "বটিয়াঘাটা", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বটিয়াঘাটা, খুলনা", website: "http://fisheries.botiaghata.khulna.gov.bd" },
  { id: 133, upazila: "ডুমুরিয়া", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ডুমুরিয়া, খুলনা", website: "http://fisheries.dumuria.khulna.gov.bd" },
  { id: 134, upazila: "তেরখাদা", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, তেরখাদা, খুলনা", website: "http://fisheries.terokhada.khulna.gov.bd" },
  { id: 135, upazila: "পাইকগাছা", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পাইকগাছা, খুলনা", website: "http://fisheries.paikgasa.khulna.gov.bd" },
  { id: 136, upazila: "কয়রা", district: "খুলনা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কয়রা, খুলনা", website: "http://fisheries.koyra.khulna.gov.bd" },
  { id: 137, upazila: "বাগেরহাট সদর", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, বাগেরহাট সদর, বাগেরহাট", website: "http://fisheries.bagerhatsadar.bagerhat.gov.bd" },
  { id: 138, upazila: "শরণখোলা", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শরণখোলা, বাগেরহাট", website: "http://fisheries.sarankhola.bagerhat.gov.bd" },
  { id: 139, upazila: "রামপাল", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রামপাল, বাগেরহাট", website: "http://fisheries.rampal.bagerhat.gov.bd" },
  { id: 140, upazila: "মোংলা", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মোংলা, বাগেরহাট", website: "http://fisheries.mongla.bagerhat.gov.bd" },
  { id: 141, upazila: "মোড়েলগঞ্জ", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মোড়েলগঞ্জ, বাগেরহাট", website: "http://fisheries.morrelganj.bagerhat.gov.bd" },
  { id: 142, upazila: "মোল্লাহাট", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মোল্লাহাট, বাগেরহাট", website: "http://fisheries.mollahat.bagerhat.gov.bd" },
  { id: 143, upazila: "ফকিরহাট", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ফকিরহাট, বাগেরহাট", website: "http://fisheries.fakirhat.bagerhat.gov.bd" },
  { id: 144, upazila: "চিতলমারী", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, চিতলমারী, বাগেরহাট", website: "http://fisheries.chitalmari.bagerhat.gov.bd" },
  { id: 145, upazila: "কচুয়া", district: "বাগেরহাট", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কচুয়া, বাগেরহাট", website: "http://fisheries.kachua.bagerhat.gov.bd" },
  { id: 146, upazila: "সাতক্ষীরা সদর", district: "সাতক্ষীরা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সাতক্ষীরা সদর, সাতক্ষীরা", website: "http://fisheries.satkhirasadar.satkhira.gov.bd" },
  { id: 147, upazila: "শ্যামনগর", district: "সাতক্ষীরা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, শ্যামনগর, সাতক্ষীরা", website: "http://fisheries.shyamnagar.satkhira.gov.bd" },
  { id: 148, upazila: "দেবহাটা", district: "সাতক্ষীরা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, দেবহাটা, সাতক্ষীরা", website: "http://fisheries.debhata.satkhira.gov.bd" },
  { id: 149, upazila: "তালা", district: "সাতক্ষীরা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, তালা, সাতক্ষীরা", website: "http://fisheries.tala.satkhira.gov.bd" },
  { id: 150, upazila: "কালিগঞ্জ", district: "সাতক্ষীরা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কালিগঞ্জ, সাতক্ষীরা", website: "http://fisheries.kaliganj.satkhira.gov.bd" },
  { id: 151, upazila: "কলারোয়া", district: "সাতক্ষীরা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কলারোয়া, সাতক্ষীরা", website: "http://fisheries.kalaroa.satkhira.gov.bd" },
  { id: 152, upazila: "আশাশুনি", district: "সাতক্ষীরা", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, আশাশুনি, সাতক্ষীরা", website: "http://fisheries.assasuni.satkhira.gov.bd" },
  { id: 153, upazila: "যশোর সদর", district: "যশোর", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, যশোর সদর, যশোর", website: "http://fisheries.sadar.jessore.gov.bd" },
  { id: 154, upazila: "শার্শা", district: "যশোর", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শার্শা, যশোর", website: "http://fisheries.sharsha.jessore.gov.bd" },
  { id: 155, upazila: "মণিরামপুর", district: "যশোর", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মণিরামপুর, যশোর", website: "http://fisheries.manirampur.jessore.gov.bd" },
  { id: 156, upazila: "কেশবপুর", district: "যশোর", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কেশবপুর, যশোর", website: "http://fisheries.keshabpur.jessore.gov.bd" },
  { id: 157, upazila: "অভয়নগর", district: "যশোর", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, অভয়নগর, যশোর", website: "http://fisheries.abhaynagar.jessore.gov.bd" },
  { id: 158, upazila: "ঝিকরগাছা", district: "যশোর", division: "খুলনা", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ঝিকরগাছা, যশোর", website: "http://fisheries.jhikargacha.jessore.gov.bd" },
  { id: 159, upazila: "বাঘারপাড়া", district: "যশোর", division: "খুলনা", officeName: "উপজেলা মৎস্য কার্যালয়, বাঘারপাড়া, যশোর", website: "http://fisheries.bagherpara.jessore.gov.bd" },
  { id: 160, upazila: "চৌগাছা", district: "যশোর", division: "খুলনা", officeName: "উপজেলা মৎস্য কার্যালয়, চৌগাছা, যশোর", website: "http://fisheries.chougachha.jessore.gov.bd" },

  // ময়মনসিংহ বিভাগ
  { id: 161, upazila: "ময়মনসিংহ সদর", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ময়মনসিংহ সদর, ময়মনসিংহ", website: "http://fisheries.mymensinghsadar.mymensingh.gov.bd" },
  { id: 162, upazila: "ফুলবাড়িয়া", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, ফুলবাড়িয়া, ময়মনসিংহ", website: "http://fisheries.fulbaria.mymensingh.gov.bd" },
  { id: 163, upazila: "মুক্তাগাছা", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মুক্তাগাছা, ময়মনসিংহ", website: "http://fisheries.muktagacha.mymensingh.gov.bd" },
  { id: 164, upazila: "ভালুকা", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ভালুকা, ময়মনসিংহ", website: "http://fisheries.bhaluka.mymensingh.gov.bd" },
  { id: 165, upazila: "ত্রিশাল", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ত্রিশাল, ময়মনসিংহ", website: "http://fisheries.trishal.mymensingh.gov.bd" },
  { id: 166, upazila: "ঈশ্বরগঞ্জ", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ঈশ্বরগঞ্জ, ময়মনসিংহ", website: "http://fisheries.iswarganj.mymensingh.gov.bd" },
  { id: 167, upazila: "গৌরীপুর", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গৌরীপুর, ময়মনসিংহ", website: "http://fisheries.gouripur.mymensingh.gov.bd" },
  { id: 168, upazila: "গফরগাঁও", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গফরগাঁও, ময়মনসিংহ", website: "http://fisheries.gafargaon.mymensingh.gov.bd" },
  { id: 169, upazila: "ফুলপুর", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ফুলপুর, ময়মনসিংহ", website: "http://fisheries.phulpur.mymensingh.gov.bd" },
  { id: 170, upazila: "হালুয়াঘাট", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হালুয়াঘাট, ময়মনসিংহ", website: "http://fisheries.haluaghat.mymensingh.gov.bd" },
  { id: 171, upazila: "নান্দাইল", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নান্দাইল, ময়মনসিংহ", website: "http://fisheries.nandail.mymensingh.gov.bd" },
  { id: 172, upazila: "ধোবাউড়া", district: "ময়মনসিংহ", division: "ময়মনসিংহ", officeName: "উপজেলা মৎস্য কার্যালয়, ধোবাউড়া, ময়মনসিংহ", website: "http://fisheries.dhobaura.mymensingh.gov.bd" },
  { id: 173, upazila: "জামালপুর সদর", district: "জামালপুর", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, জামালপুর সদর, জামালপুর", website: "http://fisheries.jamalpursadar.jamalpur.gov.bd" },
  { id: 174, upazila: "সরিষাবাড়ী", district: "জামালপুর", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সরিষাবাড়ী, জামালপুর", website: "http://fisheries.sarishabari.jamalpur.gov.bd" },
  { id: 175, upazila: "ইসলামপুর", district: "জামালপুর", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ইসলামপুর, জামালপুর", website: "http://fisheries.islampur.jamalpur.gov.bd" },
  { id: 176, upazila: "শেরপুর সদর", district: "শেরপুর", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শেরপুর সদর, শেরপুর", website: "http://fisheries.sadar.sherpur.gov.bd" },
  { id: 177, upazila: "নকলা", district: "শেরপুর", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নকলা, শেরপুর", website: "http://fisheries.nokla.sherpur.gov.bd" },
  { id: 178, upazila: "শ্রীবরদী", district: "শেরপুর", division: "ময়মনসিংহ", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, শ্রীবরদী, শেরপুর", website: "http://fisheries.sreebordi.sherpur.gov.bd" },
  { id: 179, upazila: "ঝিনাইগাঁতি", district: "শেরপুর", division: "ময়মনসিংহ", officeName: "উপজেলা মৎস্য কার্যালয়, ঝিনাইগাঁতি, শেরপুর", website: "http://fisheries.jhenaigati.sherpur.gov.bd" },
  { id: 180, upazila: "নেত্রকোনা সদর", district: "নেত্রকোনা", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নেত্রকোনা সদর, নেত্রকোনা", website: "http://fisheries.netrokonasadar.netrokona.gov.bd" },
  { id: 181, upazila: "মোহনগঞ্জ", district: "নেত্রকোনা", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মোহনগঞ্জ, নেত্রকোনা", website: "http://fisheries.mohongonj.netrokona.gov.bd" },
  { id: 182, upazila: "বারহাট্টা", district: "নেত্রকোনা", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বারহাট্টা, নেত্রকোনা", website: "http://fisheries.barhatta.netrokona.gov.bd" },
  { id: 183, upazila: "কেন্দুয়া", district: "নেত্রকোনা", division: "ময়মনসিংহ", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কেন্দুয়া, নেত্রকোনা", website: "http://fisheries.kendua.netrokona.gov.bd" },

  // রাজশাহী বিভাগ
  { id: 184, upazila: "পবা", district: "রাজশাহী", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পবা, রাজশাহী", website: "http://fisheries.paba.rajshahi.gov.bd" },
  { id: 185, upazila: "মোহনপুর", district: "রাজশাহী", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, মোহনপুর, রাজশাহী", website: "http://fisheries.mohanpur.rajshahi.gov.bd" },
  { id: 186, upazila: "গোদাগাড়ী", district: "রাজশাহী", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, গোদাগাড়ী, রাজশাহী", website: "http://fisheries.godagari.rajshahi.gov.bd" },
  { id: 187, upazila: "পুঠিয়া", district: "রাজশাহী", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারেরকার্যালয়, পুঠিয়া, রাজশাহী", website: "http://fisheries.puthia.rajshahi.gov.bd" },
  { id: 188, upazila: "চারঘাট", district: "রাজশাহী", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, চারঘাট, রাজশাহী", website: "http://fisheries.charghat.rajshahi.gov.bd" },
  { id: 189, upazila: "দুর্গাপুর", district: "রাজশাহী", division: "রাজশাহী", officeName: "উপজেলা মৎস্য কার্যালয়, দুর্গাপুর, রাজশাহী", website: "http://fisheries.durgapur.rajshahi.gov.bd" },
  { id: 190, upazila: "নাটোর সদর", district: "নাটোর", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নাটোর সদর, নাটোর", website: "http://fisheries.natoresadar.natore.gov.bd" },
  { id: 191, upazila: "সিংড়া", district: "নাটোর", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সিংড়া, নাটোর", website: "http://fisheries.singra.natore.gov.bd" },
  { id: 192, upazila: "বড়াইগ্রাম", district: "নাটোর", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বড়াইগ্রাম, নাটোর", website: "http://fisheries.baraigram.natore.gov.bd" },
  { id: 193, upazila: "গুরুদাসপুর", district: "নাটোর", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গুরুদাসপুর, নাটোর", website: "http://fisheries.gurudaspur.natore.gov.bd" },
  { id: 194, upazila: "লালপুর", district: "নাটোর", division: "রাজশাহী", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, লালপুর, নাটোর", website: "http://fisheries.lalpur.natore.gov.bd" },
  { id: 195, upazila: "নওগাঁ সদর", district: "নওগাঁ", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নওগাঁ সদর, নওগাঁ", website: "http://fisheries.naogaonsadar.naogaon.gov.bd" },
  { id: 196, upazila: "রাণীনগর", district: "নওগাঁ", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রাণীনগর, নওগাঁ", website: "http://fisheries.raninagar.naogaon.gov.bd" },
  { id: 197, upazila: "মান্দা", district: "নওগাঁ", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মান্দা, নওগাঁ", website: "http://fisheries.manda.naogaon.gov.bd" },
  { id: 198, upazila: "মহাদেবপুর", district: "নওগাঁ", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মহাদেবপুর, নওগাঁ", website: "http://fisheries.mohadevpur.naogaon.gov.bd" },
  { id: 199, upazila: "আত্রাই", district: "নওগাঁ", division: "রাজশাহী", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, আত্রাই, নওগাঁ", website: "http://fisheries.atrai.naogaon.gov.bd" },
  { id: 200, upazila: "সাপাহার", district: "নওগাঁ", division: "রাজশাহী", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সাপাহার, নওগাঁ", website: "http://fisheries.sapahar.naogaon.gov.bd" },
  { id: 201, upazila: "পত্নিতলা", district: "নওগাঁ", division: "রাজশাহী", officeName: "উপজেলা মৎস্য কার্যালয়, পত্নিতলা, নওগাঁ", website: "http://fisheries.patnitala.naogaon.gov.bd" },
  { id: 202, upazila: "নিয়ামতপুর", district: "নওগাঁ", division: "রাজশাহী", officeName: "উপজেলা মৎস্য কার্যালয়, নিয়ামতপুর, নওগাঁ", website: "http://fisheries.niamatpur.naogaon.gov.bd" },

  // সিলেট বিভাগ
  { id: 203, upazila: "সিলেট সদর", district: "সিলেট", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সিলেট সদর, সিলেট", website: "http://fisheries.sylhetsadar.sylhet.gov.bd" },
  { id: 204, upazila: "বালাগঞ্জ", district: "সিলেট", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বালাগঞ্জ, সিলেট", website: "http://fisheries.balaganj.sylhet.gov.bd" },
  { id: 205, upazila: "বিশ্বনাথ", district: "সিলেট", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বিশ্বনাথ, সিলেট", website: "http://fisheries.bishwanath.sylhet.gov.bd" },
  { id: 206, upazila: "জৈন্তাপুর", district: "সিলেট", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, জৈন্তাপুর, সিলেট", website: "http://fisheries.jaintiapur.sylhet.gov.bd" },
  { id: 207, upazila: "গোলাপগঞ্জ", district: "সিলেট", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গোলাপগঞ্জ, সিলেট", website: "http://fisheries.golapganj.sylhet.gov.bd" },
  { id: 208, upazila: "মৌলভীবাজার সদর", district: "মৌলভীবাজার", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মৌলভীবাজার সদর, মৌলভীবাজার", website: "http://fisheries.moulvibazarsadar.moulvibazar.gov.bd" },
  { id: 209, upazila: "শ্রীমঙ্গল", district: "মৌলভীবাজার", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, শ্রীমঙ্গল, মৌলভীবাজার", website: "http://fisheries.sreemangal.moulvibazar.gov.bd" },
  { id: 210, upazila: "রাজনগর", district: "মৌলভীবাজার", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রাজনগর, মৌলভীবাজার", website: "http://fisheries.rajnagar.moulvibazar.gov.bd" },
  { id: 211, upazila: "কুলাউড়া", district: "মৌলভীবাজার", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কুলাউড়া, মৌলভীবাজার", website: "http://fisheries.kulaura.moulvibazar.gov.bd" },
  { id: 212, upazila: "বড়লেখা", district: "মৌলভীবাজার", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বড়লেখা, মৌলভীবাজার", website: "http://fisheries.barlekha.moulvibazar.gov.bd" },
  { id: 213, upazila: "হবিগঞ্জ সদর", district: "হবিগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, হবিগঞ্জ সদর, হবিগঞ্জ", website: "http://fisheries.habiganjsadar.habiganj.gov.bd" },
  { id: 214, upazila: "বানিয়াচং", district: "হবিগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বানিয়াচং, হবিগঞ্জ", website: "http://fisheries.baniachong.habiganj.gov.bd" },
  { id: 215, upazila: "নবীগঞ্জ", district: "হবিগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নবীগঞ্জ, হবিগঞ্জ", website: "http://fisheries.nabiganj.habiganj.gov.bd" },
  { id: 216, upazila: "চুনারুঘাট", district: "হবিগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, চুনারুঘাট, হবিগঞ্জ", website: "http://fisheries.chunarughat.habiganj.gov.bd" },
  { id: 217, upazila: "শায়েস্তাগঞ্জ", district: "হবিগঞ্জ", division: "সিলেট", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, শায়েস্তাগঞ্জ, হবিগঞ্জ", website: "http://fisheries.shayestaganj.habiganj.gov.bd" },
  { id: 218, upazila: "লাখাই", district: "হবিগঞ্জ", division: "সিলেট", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, লাখাই, হবিগঞ্জ", website: "http://fisheries.lakhai.habiganj.gov.bd" },
  { id: 219, upazila: "সুনামগঞ্জ সদর", district: "সুনামগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সুনামগঞ্জ সদর, সুনামগঞ্জ", website: "http://fisheries.sadar.sunamganj.gov.bd" },
  { id: 220, upazila: "ছাতক", district: "সুনামগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, ছাতক, সুনামগঞ্জ", website: "http://fisheries.chhatak.sunamganj.gov.bd" },
  { id: 221, upazila: "দিরাই", district: "সুনামগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, দিরাই, সুনামগঞ্জ", website: "http://fisheries.derai.sunamganj.gov.bd" },
  { id: 222, upazila: "ধর্মপাশা", district: "সুনামগঞ্জ", division: "সিলেট", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ধর্মপাশা, সুনামগঞ্জ", website: "http://fisheries.dharmapasha.sunamganj.gov.bd" },
  { id: 223, upazila: "বিশ্বম্ভরপুর", district: "সুনামগঞ্জ", division: "সিলেট", officeName: "উপজেলা মৎস্য কার্যালয়, বিশ্বম্ভরপুর, সুনামগঞ্জ", website: "http://fisheries.bishwambarpur.sunamganj.gov.bd" },
  { id: 224, upazila: "শাল্লা", district: "সুনামগঞ্জ", division: "সিলেট", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, শাল্লা, সুনামগঞ্জ", website: "http://fisheries.shalla.sunamganj.gov.bd" },
  { id: 225, upazila: "দক্ষিণ সুনামগঞ্জ", district: "সুনামগঞ্জ", division: "সিলেট", officeName: "উপজেলা মৎস্য কার্যালয়, দক্ষিণ সুনামগঞ্জ, সুনামগঞ্জ", website: "http://fisheries.southsunamganj.sunamganj.gov.bd" },

  // রংপুর বিভাগ
  { id: 226, upazila: "রংপুর সদর", district: "রংপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রংপুর সদর, রংপুর", website: "http://fisheries.sadar.rangpur.gov.bd" },
  { id: 227, upazila: "মিঠাপুকুর", district: "রংপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মিঠাপুকুর, রংপুর", website: "http://fisheries.mithapukur.rangpur.gov.bd" },
  { id: 228, upazila: "বদরগঞ্জ", district: "রংপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বদরগঞ্জ, রংপুর", website: "http://fisheries.badargonj.rangpur.gov.bd" },
  { id: 229, upazila: "গংগাচড়া", district: "রংপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গংগাচড়া, রংপুর", website: "http://fisheries.gangachara.rangpur.gov.bd" },
  { id: 230, upazila: "পীরগঞ্জ", district: "রংপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পীরগঞ্জ, রংপুর", website: "http://fisheries.pirgonj.rangpur.gov.bd" },
  { id: 231, upazila: "কাউনিয়া", district: "রংপুর", division: "রংপুর", officeName: "উপজেলা মৎস্য কার্যালয়, কাউনিয়া, রংপুর", website: "http://fisheries.kaunia.rangpur.gov.bd" },
  { id: 232, upazila: "দিনাজপুর সদর", district: "দিনাজপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, দিনাজপুর সদর, দিনাজপুর", website: "http://fisheries.dinajpursadar.dinajpur.gov.bd" },
  { id: 233, upazila: "বীরগঞ্জ", district: "দিনাজপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বীরগঞ্জ, দিনাজপুর", website: "http://fisheries.birganj.dinajpur.gov.bd" },
  { id: 234, upazila: "পার্বতীপুর", district: "দিনাজপুর", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পার্বতীপুর, দিনাজপুর", website: "http://fisheries.parbatipur.dinajpur.gov.bd" },
  { id: 235, upazila: "হাকিমপুর", district: "দিনাজপুর", division: "রংপুর", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হাকিমপুর, দিনাজপুর", website: "http://fisheries.hakimpur.dinajpur.gov.bd" },
  { id: 236, upazila: "ঠাকুরগাঁও সদর", district: "ঠাকুরগাঁও", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ঠাকুরগাঁও সদর, ঠাকুরগাঁও", website: "http://fisheries.thakurgaonsadar.thakurgaon.gov.bd" },
  { id: 237, upazila: "পীরগঞ্জ", district: "ঠাকুরগাঁও", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পীরগঞ্জ, ঠাকুরগাঁও", website: "http://fisheries.pirganj.thakurgaon.gov.bd" },
  { id: 238, upazila: "বালিয়াডাঙ্গী", district: "ঠাকুরগাঁও", division: "রংপুর", officeName: "উপজেলা মৎস্য কার্যালয়, বালিয়াডাঙ্গী, ঠাকুরগাঁও", website: "http://fisheries.baliadangi.thakurgaon.gov.bd" },
  { id: 239, upazila: "হরিপুর", district: "ঠাকুরগাঁও", division: "রংপুর", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হরিপুর, ঠাকুরগাঁও", website: "http://fisheries.haripur.thakurgaon.gov.bd" },
  { id: 240, upazila: "রাণীশংকৈল", district: "ঠাকুরগাঁও", division: "রংপুর", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, রাণীশংকৈল, ঠাকুরগাঁও", website: "http://fisheries.ranisankail.thakurgaon.gov.bd" },
  { id: 241, upazila: "পঞ্চগড় সদর", district: "পঞ্চগড়", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারেরকার্যালয়, পঞ্চগড় সদর, পঞ্চগড়", website: "http://fisheries.panchagarhsadar.panchagarh.gov.bd" },
  { id: 242, upazila: "গাইবান্ধা সদর", district: "গাইবান্ধা", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গাইবান্ধা সদর, গাইবান্ধা", website: "http://fisheries.gaibandhasadar.gaibandha.gov.bd" },
  { id: 243, upazila: "গোবিন্দগঞ্জ", district: "গাইবান্ধা", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গোবিন্দগঞ্জ, গাইবান্ধা", website: "http://fisheries.gobindaganj.gaibandha.gov.bd" },
  { id: 244, upazila: "পলাশবাড়ি", district: "গাইবান্ধা", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পলাশবাড়ি, গাইবান্ধা", website: "http://fisheries.palashbari.gaibandha.gov.bd" },
  { id: 245, upazila: "সুন্দরগঞ্জ", district: "গাইবান্ধা", division: "রংপুর", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সুন্দরগঞ্জ, গাইবান্ধা", website: "http://fisheries.sundarganj.gaibandha.gov.bd" },
  { id: 246, upazila: "সাদুল্লাপুর", district: "গাইবান্ধা", division: "রংপুর", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সাদুল্লাপুর, গাইবান্ধা", website: "http://fisheries.sadullapur.gaibandha.gov.bd" },
  { id: 247, upazila: "সাঘাটা", district: "গাইবান্ধা", division: "রংপুর", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, সাঘাটা, গাইবান্ধা", website: "http://fisheries.saghata.gaibandha.gov.bd" },
  { id: 248, upazila: "কুড়িগ্রাম সদর", district: "কুড়িগ্রাম", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কুড়িগ্রাম সদর, কুড়িগ্রাম", website: "http://fisheries.kurigramsadar.kurigram.gov.bd" },
  { id: 249, upazila: "নাগেশ্বরী", district: "কুড়িগ্রাম", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নাগেশ্বরী, কুড়িগ্রাম", website: "http://fisheries.nageshwari.kurigram.gov.bd" },
  { id: 250, upazila: "উলিপুর", district: "কুড়িগ্রাম", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, উলিপুর, কুড়িগ্রাম", website: "http://fisheries.ulipur.kurigram.gov.bd" },
  { id: 251, upazila: "লালমনিরহাট সদর", district: "লালমনিরহাট", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, লালমনিরহাট সদর, লালমনিরহাট", website: "http://fisheries.sadar.lalmonirhat.gov.bd" },
  { id: 252, upazila: "কালিগঞ্জ", district: "লালমনিরহাট", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কালিগঞ্জ, লালমনিরহাট", website: "http://fisheries.kaliganj.lalmonirhat.gov.bd" },
  { id: 253, upazila: "হাতীবান্ধা", district: "লালমনিরহাট", division: "রংপুর", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, হাতীবান্ধা, লালমনিরহাট", website: "http://fisheries.hatibandha.lalmonirhat.gov.bd" },
  { id: 254, upazila: "নীলফামারী সদর", district: "নীলফামারী", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, নীলফামারী সদর, নীলফামারী", website: "http://fisheries.nilphamarisadar.nilphamari.gov.bd" },
  { id: 255, upazila: "সৈয়দপুর", district: "নীলফামারী", division: "রংপুর", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, সৈয়দপুর, নীলফামারী", website: "http://fisheries.syedpur.nilphamari.gov.bd" },

  // বরিশাল বিভাগ
  { id: 256, upazila: "বরিশাল সদর", district: "বরিশাল", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বরিশাল সদর, বরিশাল", website: "http://fisheries.barisalsadar.barisal.gov.bd" },
  { id: 257, upazila: "হিজলা", district: "বরিশাল", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, হিজলা, বরিশাল", website: "http://fisheries.hizla.barisal.gov.bd" },
  { id: 258, upazila: "বাবুগঞ্জ", district: "বরিশাল", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বাবুগঞ্জ, বরিশাল", website: "http://fisheries.babuganj.barisal.gov.bd" },
  { id: 259, upazila: "মুলাদি", district: "বরিশাল", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মুলাদি, বরিশাল", website: "http://muladi.barisal.gov.bd" },
  { id: 260, upazila: "আগৈলঝাড়া", district: "বরিশাল", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, আগৈলঝাড়া, বরিশাল", website: "http://fisheries.agailjhara.barisal.gov.bd" },
  { id: 261, upazila: "পটুয়াখালী সদর", district: "পটুয়াখালী", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পটুয়াখালী সদর, পটুয়াখালী", website: "http://fisheries.sadar.patuakhali.gov.bd" },
  { id: 262, upazila: "বাউফল", district: "পটুয়াখালী", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বাউফল, পটুয়াখালী", website: "http://fisheries.bauphal.patuakhali.gov.bd" },
  { id: 263, upazila: "গলাচিপা", district: "পটুয়াখালী", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, গলাচিপা, পটুয়াখালী", website: "http://fisheries.galachipa.patuakhali.gov.bd" },
  { id: 264, upazila: "কলাপাড়া", district: "পটুয়াখালী", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, কলাপাড়া, পটুয়াখালী", website: "http://fisheries.kalapara.patuakhali.gov.bd" },
  { id: 265, upazila: "মির্জাগঞ্জ", district: "পটুয়াখালী", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মির্জাগঞ্জ, পটুয়াখালী", website: "http://fisheries.mirzaganj.patuakhali.gov.bd" },
  { id: 266, upazila: "ভোলা সদর", district: "ভোলা", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ভোলা সদর, ভোলা", website: "http://fisheries.sadar.bhola.gov.bd" },
  { id: 267, upazila: "দৌলতখান", district: "ভোলা", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, দৌলতখান, ভোলা", website: "http://fisheries.daulatkhan.bhola.gov.bd" },
  { id: 268, upazila: "বোরহানউদ্দিন", district: "ভোলা", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বোরহানউদ্দিন, ভোলা", website: "http://fisheries.borhanuddin.bhola.gov.bd" },
  { id: 269, upazila: "চরফ্যাশন", district: "ভোলা", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, চরফ্যাশন, ভোলা", website: "http://fisheries.charfesson.bhola.gov.bd" },
  { id: 270, upazila: "লালমোহন", district: "ভোলা", division: "বরিশাল", officeName: "উপজেলা মৎস্য অফিসারের কার্যালয়, লালমোহন, ভোলা", website: "http://fisheries.lalmohan.bhola.gov.bd" },
  { id: 271, upazila: "পিরোজপুর সদর", district: "পিরোজপুর", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পিরোজপুর সদর, পিরোজপুর", website: "http://fisheries.sadar.pirojpur.gov.bd" },
  { id: 272, upazila: "নাজিরপুর", district: "পিরোজপুর", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য কার্যালয়, নাজিরপুর, পিরোজপুর", website: "http://fisheries.nazirpur.pirojpur.gov.bd" },
  { id: 273, upazila: "মঠবাড়িয়া", district: "পিরোজপুর", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, মঠবাড়িয়া, পিরোজপুর", website: "http://fisheries.mathbaria.pirojpur.gov.bd" },
  { id: 274, upazila: "ভান্ডারিয়া", district: "পিরোজপুর", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ভান্ডারিয়া, পিরোজপুর", website: "http://fisheries.bhandaria.pirojpur.gov.bd" },
  { id: 275, upazila: "ঝালকাঠি সদর", district: "ঝালকাঠি", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, ঝালকাঠি সদর, ঝালকাঠি", website: "http://fisheries.sadar.jhalakathi.gov.bd" },
  { id: 276, upazila: "রাজাপুর", district: "ঝালকাঠি", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, রাজাপুর, ঝালকাঠি", website: "http://fisheries.rajapur.jhalakathi.gov.bd" },
  { id: 277, upazila: "বরগুনা সদর", district: "বরগুনা", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, বরগুনা সদর, বরগুনা", website: "http://fisheries.sadar.barguna.gov.bd" },
  { id: 278, upazila: "আমতলী", district: "বরগুনা", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, আমতলী, বরগুনা", website: "http://fisheries.amtali.barguna.gov.bd" },
  { id: 279, upazila: "পাথরঘাটা", district: "বরগুনা", division: "বরিশাল", officeName: "সিনিয়র উপজেলা মৎস্য অফিসারের কার্যালয়, পাথরঘাটা, বরগুনা", website: "http://fisheries.pathorghata.barguna.gov.bd" },
];

// Helper function to get unique divisions
export const getDivisions = (): string[] => {
  return Object.keys(divisionDistricts);
};

// Helper function to get districts by division
export const getDistrictsByDivision = (division: string): string[] => {
  return divisionDistricts[division] || [];
};

// Helper function to get upazilas by district
export const getUpazilasByDistrict = (district: string): UpazilaFisheriesOffice[] => {
  return upazilaFisheriesOffices.filter(office => office.district === district);
};

// Helper function to search offices
export const searchOffices = (query: string): UpazilaFisheriesOffice[] => {
  const lowerQuery = query.toLowerCase();
  return upazilaFisheriesOffices.filter(office => 
    office.upazila.toLowerCase().includes(lowerQuery) ||
    office.district.toLowerCase().includes(lowerQuery) ||
    office.division.toLowerCase().includes(lowerQuery) ||
    office.officeName.toLowerCase().includes(lowerQuery)
  );
};
