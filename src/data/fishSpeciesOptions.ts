// বাংলাদেশের প্রচলিত সকল মাছের প্রজাতির নাম
// এই ফাইলটি সকল ক্যালকুলেটর, ফর্ম ও ড্রপডাউনে ব্যবহৃত হয়

export const FISH_SPECIES_OPTIONS = [
  // কার্প জাতীয়
  { value: "রুই", label: "রুই (Rohu)", key: "rohu" },
  { value: "কাতলা", label: "কাতলা (Catla)", key: "katla" },
  { value: "মৃগেল", label: "মৃগেল (Mrigal)", key: "mrigal" },
  { value: "সিলভার কার্প", label: "সিলভার কার্প (Silver Carp)", key: "silver_carp" },
  { value: "গ্রাস কার্প", label: "গ্রাস কার্প (Grass Carp)", key: "grass_carp" },
  { value: "কমন কার্প", label: "কমন কার্প (Common Carp)", key: "common_carp" },
  { value: "মিরর কার্প", label: "মিরর কার্প (Mirror Carp)", key: "mirror_carp" },
  { value: "কালবাউস", label: "কালবাউস (Kalbaus)", key: "kalbaus" },

  // ক্যাটফিশ
  { value: "পাঙ্গাস", label: "পাঙ্গাস (Pangasius)", key: "pangas" },
  { value: "থাই পাঙ্গাশ", label: "থাই পাঙ্গাশ (Thai Pangas)", key: "thai_pangas" },
  { value: "শিং", label: "শিং (Stinging Catfish)", key: "shing" },
  { value: "মাগুর", label: "মাগুর (Walking Catfish)", key: "magur" },
  { value: "থাই মাগুর", label: "থাই মাগুর (Thai Magur)", key: "thai_magur" },
  { value: "পাবদা", label: "পাবদা (Pabda)", key: "pabda" },
  { value: "গুলশা", label: "গুলশা (Gulsha Tengra)", key: "gulsha" },
  { value: "টেংরা", label: "টেংরা (Mystus Tengra)", key: "tengra" },
  { value: "বোয়াল", label: "বোয়াল (Boal)", key: "boal" },
  { value: "আইড়", label: "আইড় (Long-whiskered Catfish)", key: "ayre" },

  // তেলাপিয়া
  { value: "তেলাপিয়া", label: "তেলাপিয়া (Tilapia)", key: "tilapia" },
  { value: "গিফট তেলাপিয়া", label: "গিফট তেলাপিয়া (GIFT Tilapia)", key: "gift_tilapia" },
  { value: "মনোসেক্স তেলাপিয়া", label: "মনোসেক্স তেলাপিয়া (Monosex Tilapia)", key: "monosex_tilapia" },

  // কই ও দেশি মাছ
  { value: "কই", label: "কই (Climbing Perch)", key: "koi" },
  { value: "থাই কই", label: "থাই কই (Thai Koi)", key: "thai_koi" },
  { value: "শোল", label: "শোল (Snakehead Murrel)", key: "shol" },
  { value: "টাকি", label: "টাকি (Spotted Snakehead)", key: "taki" },
  { value: "চিতল", label: "চিতল (Clown Knifefish)", key: "chital" },
  { value: "বাটা", label: "বাটা (Bata)", key: "bata" },

  // চিংড়ি
  { value: "গলদা চিংড়ি", label: "গলদা চিংড়ি (Giant Freshwater Prawn)", key: "golda" },
  { value: "বাগদা চিংড়ি", label: "বাগদা চিংড়ি (Tiger Shrimp)", key: "bagda" },
];

/** শুধু নামের তালিকা (ব্যাজ, চেকবক্স ইত্যাদির জন্য) */
export const FISH_SPECIES_NAMES = FISH_SPECIES_OPTIONS.map(f => f.value);

/** ড্রপডাউনে "সকল প্রজাতি" সহ তালিকা */
export const FISH_SPECIES_WITH_ALL = [
  { value: "all", label: "সকল প্রজাতি" },
  ...FISH_SPECIES_OPTIONS,
];
