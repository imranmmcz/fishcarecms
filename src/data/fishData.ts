// বাংলাদেশের বাণিজ্যিকভাবে চাষযোগ্য মাছের তথ্য
// সূত্র: মৎস্য অধিদপ্তর, বাংলাদেশ মৎস্য গবেষণা ইনস্টিটিউট

export interface FishSpecies {
  id: string;
  nameBn: string;
  nameEn: string;
  category: 'carp' | 'catfish' | 'tilapia' | 'pangas' | 'exotic' | 'indigenous';
  stockingDensity: {
    semiIntensive: number; // প্রতি শতকে
    intensive: number; // প্রতি শতকে
  };
  fingerlingWeight: number; // গ্রাম
  fingerlingPrice: number; // টাকা/পিস
  survivalRate: number; // %
  harvestWeight: number; // কেজি
  growthPeriod: number; // মাস
  marketPrice: number; // টাকা/কেজি
  fcr: number; // Feed Conversion Ratio
}

export const fishSpecies: FishSpecies[] = [
  // কার্প জাতীয় মাছ
  {
    id: 'rohu',
    nameBn: 'রুই',
    nameEn: 'Rohu',
    category: 'carp',
    stockingDensity: { semiIntensive: 20, intensive: 40 },
    fingerlingWeight: 25,
    fingerlingPrice: 4,
    survivalRate: 85,
    harvestWeight: 1.5,
    growthPeriod: 8,
    marketPrice: 220,
    fcr: 1.8
  },
  {
    id: 'katla',
    nameBn: 'কাতলা',
    nameEn: 'Catla',
    category: 'carp',
    stockingDensity: { semiIntensive: 8, intensive: 15 },
    fingerlingWeight: 30,
    fingerlingPrice: 5,
    survivalRate: 80,
    harvestWeight: 2.0,
    growthPeriod: 10,
    marketPrice: 250,
    fcr: 1.6
  },
  {
    id: 'mrigel',
    nameBn: 'মৃগেল',
    nameEn: 'Mrigal',
    category: 'carp',
    stockingDensity: { semiIntensive: 15, intensive: 30 },
    fingerlingWeight: 20,
    fingerlingPrice: 3,
    survivalRate: 85,
    harvestWeight: 1.2,
    growthPeriod: 8,
    marketPrice: 180,
    fcr: 1.7
  },
  {
    id: 'silver_carp',
    nameBn: 'সিলভার কার্প',
    nameEn: 'Silver Carp',
    category: 'carp',
    stockingDensity: { semiIntensive: 25, intensive: 50 },
    fingerlingWeight: 20,
    fingerlingPrice: 2.5,
    survivalRate: 88,
    harvestWeight: 1.5,
    growthPeriod: 8,
    marketPrice: 150,
    fcr: 1.5
  },
  {
    id: 'grass_carp',
    nameBn: 'গ্রাস কার্প',
    nameEn: 'Grass Carp',
    category: 'carp',
    stockingDensity: { semiIntensive: 5, intensive: 10 },
    fingerlingWeight: 25,
    fingerlingPrice: 5,
    survivalRate: 82,
    harvestWeight: 2.0,
    growthPeriod: 10,
    marketPrice: 180,
    fcr: 1.8
  },
  {
    id: 'common_carp',
    nameBn: 'কমন কার্প',
    nameEn: 'Common Carp',
    category: 'carp',
    stockingDensity: { semiIntensive: 10, intensive: 20 },
    fingerlingWeight: 20,
    fingerlingPrice: 3,
    survivalRate: 85,
    harvestWeight: 1.2,
    growthPeriod: 8,
    marketPrice: 160,
    fcr: 1.7
  },
  {
    id: 'mirror_carp',
    nameBn: 'মিরর কার্প',
    nameEn: 'Mirror Carp',
    category: 'carp',
    stockingDensity: { semiIntensive: 8, intensive: 15 },
    fingerlingWeight: 20,
    fingerlingPrice: 4,
    survivalRate: 82,
    harvestWeight: 1.5,
    growthPeriod: 9,
    marketPrice: 170,
    fcr: 1.8
  },
  {
    id: 'kalbaus',
    nameBn: 'কালবাউস',
    nameEn: 'Kalbaus',
    category: 'carp',
    stockingDensity: { semiIntensive: 10, intensive: 20 },
    fingerlingWeight: 25,
    fingerlingPrice: 4,
    survivalRate: 80,
    harvestWeight: 1.0,
    growthPeriod: 10,
    marketPrice: 200,
    fcr: 1.9
  },

  // ক্যাটফিশ (বিদেশি)
  {
    id: 'pangas',
    nameBn: 'পাঙ্গাশ',
    nameEn: 'Pangas',
    category: 'pangas',
    stockingDensity: { semiIntensive: 100, intensive: 200 },
    fingerlingWeight: 15,
    fingerlingPrice: 2,
    survivalRate: 90,
    harvestWeight: 1.5,
    growthPeriod: 6,
    marketPrice: 120,
    fcr: 1.5
  },
  {
    id: 'thai_pangas',
    nameBn: 'থাই পাঙ্গাশ',
    nameEn: 'Thai Pangas',
    category: 'pangas',
    stockingDensity: { semiIntensive: 80, intensive: 150 },
    fingerlingWeight: 15,
    fingerlingPrice: 2.5,
    survivalRate: 88,
    harvestWeight: 2.0,
    growthPeriod: 7,
    marketPrice: 130,
    fcr: 1.6
  },

  // তেলাপিয়া
  {
    id: 'tilapia',
    nameBn: 'তেলাপিয়া',
    nameEn: 'Tilapia',
    category: 'tilapia',
    stockingDensity: { semiIntensive: 120, intensive: 250 },
    fingerlingWeight: 10,
    fingerlingPrice: 1.5,
    survivalRate: 90,
    harvestWeight: 0.5,
    growthPeriod: 5,
    marketPrice: 160,
    fcr: 1.4
  },
  {
    id: 'gift_tilapia',
    nameBn: 'গিফট তেলাপিয়া',
    nameEn: 'GIFT Tilapia',
    category: 'tilapia',
    stockingDensity: { semiIntensive: 150, intensive: 300 },
    fingerlingWeight: 10,
    fingerlingPrice: 2,
    survivalRate: 92,
    harvestWeight: 0.6,
    growthPeriod: 5,
    marketPrice: 180,
    fcr: 1.3
  },
  {
    id: 'monosex_tilapia',
    nameBn: 'মনোসেক্স তেলাপিয়া',
    nameEn: 'Monosex Tilapia',
    category: 'tilapia',
    stockingDensity: { semiIntensive: 150, intensive: 350 },
    fingerlingWeight: 8,
    fingerlingPrice: 2,
    survivalRate: 93,
    harvestWeight: 0.5,
    growthPeriod: 4,
    marketPrice: 170,
    fcr: 1.3
  },

  // দেশি ক্যাটফিশ
  {
    id: 'shing',
    nameBn: 'শিং',
    nameEn: 'Stinging Catfish',
    category: 'catfish',
    stockingDensity: { semiIntensive: 200, intensive: 400 },
    fingerlingWeight: 5,
    fingerlingPrice: 3,
    survivalRate: 75,
    harvestWeight: 0.08,
    growthPeriod: 6,
    marketPrice: 700,
    fcr: 1.5
  },
  {
    id: 'magur',
    nameBn: 'মাগুর',
    nameEn: 'Walking Catfish',
    category: 'catfish',
    stockingDensity: { semiIntensive: 150, intensive: 300 },
    fingerlingWeight: 5,
    fingerlingPrice: 3.5,
    survivalRate: 78,
    harvestWeight: 0.15,
    growthPeriod: 6,
    marketPrice: 550,
    fcr: 1.4
  },
  {
    id: 'thai_magur',
    nameBn: 'থাই মাগুর',
    nameEn: 'Thai Magur',
    category: 'catfish',
    stockingDensity: { semiIntensive: 100, intensive: 200 },
    fingerlingWeight: 8,
    fingerlingPrice: 3,
    survivalRate: 82,
    harvestWeight: 0.3,
    growthPeriod: 5,
    marketPrice: 400,
    fcr: 1.3
  },
  {
    id: 'pabda',
    nameBn: 'পাবদা',
    nameEn: 'Pabda',
    category: 'catfish',
    stockingDensity: { semiIntensive: 150, intensive: 250 },
    fingerlingWeight: 3,
    fingerlingPrice: 4,
    survivalRate: 70,
    harvestWeight: 0.08,
    growthPeriod: 8,
    marketPrice: 800,
    fcr: 1.6
  },
  {
    id: 'gulsha',
    nameBn: 'গুলশা',
    nameEn: 'Gulsha Tengra',
    category: 'catfish',
    stockingDensity: { semiIntensive: 200, intensive: 350 },
    fingerlingWeight: 2,
    fingerlingPrice: 3,
    survivalRate: 72,
    harvestWeight: 0.05,
    growthPeriod: 6,
    marketPrice: 650,
    fcr: 1.5
  },
  {
    id: 'boal',
    nameBn: 'বোয়াল',
    nameEn: 'Boal',
    category: 'catfish',
    stockingDensity: { semiIntensive: 15, intensive: 30 },
    fingerlingWeight: 50,
    fingerlingPrice: 25,
    survivalRate: 75,
    harvestWeight: 3.0,
    growthPeriod: 12,
    marketPrice: 500,
    fcr: 2.0
  },
  {
    id: 'ayre',
    nameBn: 'আইড়',
    nameEn: 'Long-whiskered Catfish',
    category: 'catfish',
    stockingDensity: { semiIntensive: 20, intensive: 40 },
    fingerlingWeight: 30,
    fingerlingPrice: 15,
    survivalRate: 78,
    harvestWeight: 2.0,
    growthPeriod: 12,
    marketPrice: 450,
    fcr: 1.9
  },

  // কই ও পার্চ
  {
    id: 'koi',
    nameBn: 'কই',
    nameEn: 'Climbing Perch',
    category: 'indigenous',
    stockingDensity: { semiIntensive: 180, intensive: 350 },
    fingerlingWeight: 5,
    fingerlingPrice: 2,
    survivalRate: 80,
    harvestWeight: 0.15,
    growthPeriod: 5,
    marketPrice: 350,
    fcr: 1.4
  },
  {
    id: 'thai_koi',
    nameBn: 'থাই কই',
    nameEn: 'Thai Koi',
    category: 'indigenous',
    stockingDensity: { semiIntensive: 200, intensive: 400 },
    fingerlingWeight: 5,
    fingerlingPrice: 1.5,
    survivalRate: 85,
    harvestWeight: 0.18,
    growthPeriod: 4,
    marketPrice: 280,
    fcr: 1.3
  },

  // অন্যান্য দেশি মাছ
  {
    id: 'shol',
    nameBn: 'শোল',
    nameEn: 'Snakehead Murrel',
    category: 'indigenous',
    stockingDensity: { semiIntensive: 25, intensive: 50 },
    fingerlingWeight: 20,
    fingerlingPrice: 15,
    survivalRate: 75,
    harvestWeight: 1.0,
    growthPeriod: 10,
    marketPrice: 450,
    fcr: 1.8
  },
  {
    id: 'taki',
    nameBn: 'টাকি',
    nameEn: 'Spotted Snakehead',
    category: 'indigenous',
    stockingDensity: { semiIntensive: 30, intensive: 60 },
    fingerlingWeight: 10,
    fingerlingPrice: 10,
    survivalRate: 78,
    harvestWeight: 0.5,
    growthPeriod: 8,
    marketPrice: 400,
    fcr: 1.7
  },
  {
    id: 'chital',
    nameBn: 'চিতল',
    nameEn: 'Clown Knifefish',
    category: 'indigenous',
    stockingDensity: { semiIntensive: 15, intensive: 30 },
    fingerlingWeight: 30,
    fingerlingPrice: 20,
    survivalRate: 70,
    harvestWeight: 2.5,
    growthPeriod: 14,
    marketPrice: 600,
    fcr: 2.0
  },
  {
    id: 'bata',
    nameBn: 'বাটা',
    nameEn: 'Bata',
    category: 'indigenous',
    stockingDensity: { semiIntensive: 80, intensive: 150 },
    fingerlingWeight: 10,
    fingerlingPrice: 2,
    survivalRate: 85,
    harvestWeight: 0.25,
    growthPeriod: 6,
    marketPrice: 200,
    fcr: 1.5
  },
  {
    id: 'tengra',
    nameBn: 'টেংরা',
    nameEn: 'Mystus Tengra',
    category: 'catfish',
    stockingDensity: { semiIntensive: 150, intensive: 300 },
    fingerlingWeight: 3,
    fingerlingPrice: 3,
    survivalRate: 75,
    harvestWeight: 0.05,
    growthPeriod: 6,
    marketPrice: 500,
    fcr: 1.5
  },

  // চিংড়ি
  {
    id: 'golda',
    nameBn: 'গলদা চিংড়ি',
    nameEn: 'Giant Freshwater Prawn',
    category: 'exotic',
    stockingDensity: { semiIntensive: 40, intensive: 80 },
    fingerlingWeight: 2,
    fingerlingPrice: 8,
    survivalRate: 65,
    harvestWeight: 0.1,
    growthPeriod: 8,
    marketPrice: 1200,
    fcr: 2.0
  },
  {
    id: 'bagda',
    nameBn: 'বাগদা চিংড়ি',
    nameEn: 'Tiger Shrimp',
    category: 'exotic',
    stockingDensity: { semiIntensive: 30, intensive: 60 },
    fingerlingWeight: 1,
    fingerlingPrice: 5,
    survivalRate: 60,
    harvestWeight: 0.05,
    growthPeriod: 5,
    marketPrice: 1000,
    fcr: 1.8
  },
];

// মিশ্র চাষের প্রস্তাবিত অনুপাত
export interface MixedFarmingModel {
  id: string;
  nameBn: string;
  nameEn: string;
  description: string;
  fishRatios: Array<{
    fishId: string;
    percentage: number;
  }>;
  totalDensity: number; // প্রতি শতকে
}

export const mixedFarmingModels: MixedFarmingModel[] = [
  {
    id: 'traditional_carp',
    nameBn: 'ঐতিহ্যবাহী কার্প মিশ্র চাষ',
    nameEn: 'Traditional Carp Polyculture',
    description: 'রুই, কাতলা, মৃগেল, সিলভার ও গ্রাস কার্পের মিশ্র চাষ',
    fishRatios: [
      { fishId: 'rohu', percentage: 30 },
      { fishId: 'katla', percentage: 15 },
      { fishId: 'mrigel', percentage: 20 },
      { fishId: 'silver_carp', percentage: 25 },
      { fishId: 'grass_carp', percentage: 10 },
    ],
    totalDensity: 80
  },
  {
    id: 'commercial_carp',
    nameBn: 'বাণিজ্যিক কার্প মিশ্র চাষ',
    nameEn: 'Commercial Carp Polyculture',
    description: 'উচ্চ ঘনত্বে কার্প চাষ',
    fishRatios: [
      { fishId: 'rohu', percentage: 35 },
      { fishId: 'katla', percentage: 10 },
      { fishId: 'mrigel', percentage: 15 },
      { fishId: 'silver_carp', percentage: 30 },
      { fishId: 'common_carp', percentage: 10 },
    ],
    totalDensity: 120
  },
  {
    id: 'carp_with_catfish',
    nameBn: 'কার্প ও ক্যাটফিশ মিশ্র চাষ',
    nameEn: 'Carp with Catfish',
    description: 'কার্পের সাথে শিং ও মাগুর চাষ',
    fishRatios: [
      { fishId: 'rohu', percentage: 25 },
      { fishId: 'katla', percentage: 10 },
      { fishId: 'silver_carp', percentage: 20 },
      { fishId: 'shing', percentage: 25 },
      { fishId: 'magur', percentage: 20 },
    ],
    totalDensity: 100
  },
  {
    id: 'tilapia_pangas',
    nameBn: 'তেলাপিয়া-পাঙ্গাশ মিশ্র চাষ',
    nameEn: 'Tilapia-Pangas Mix',
    description: 'দ্রুত বর্ধনশীল মাছের মিশ্র চাষ',
    fishRatios: [
      { fishId: 'pangas', percentage: 50 },
      { fishId: 'tilapia', percentage: 35 },
      { fishId: 'rohu', percentage: 15 },
    ],
    totalDensity: 150
  },
  {
    id: 'high_value',
    nameBn: 'উচ্চমূল্য মাছ মিশ্র চাষ',
    nameEn: 'High Value Fish Mix',
    description: 'শিং, মাগুর, পাবদা, গুলশার মিশ্র চাষ',
    fishRatios: [
      { fishId: 'shing', percentage: 30 },
      { fishId: 'magur', percentage: 25 },
      { fishId: 'pabda', percentage: 25 },
      { fishId: 'gulsha', percentage: 20 },
    ],
    totalDensity: 200
  },
  {
    id: 'koi_based',
    nameBn: 'কই ভিত্তিক মিশ্র চাষ',
    nameEn: 'Koi Based Culture',
    description: 'কই প্রধান মাছ হিসেবে মিশ্র চাষ',
    fishRatios: [
      { fishId: 'thai_koi', percentage: 50 },
      { fishId: 'shing', percentage: 25 },
      { fishId: 'tilapia', percentage: 25 },
    ],
    totalDensity: 180
  }
];

// খরচের হার (শতক প্রতি)
export interface CostRates {
  pondPreparation: {
    liming: number; // চুন (কেজি/শতক)
    limingPrice: number; // টাকা/কেজি
    fertilizer: number; // সার (কেজি/শতক)
    fertilizerPrice: number; // টাকা/কেজি
    rotenone: number; // রোটেনন (গ্রাম/শতক/ফুট গভীরতা)
    rotenonePrice: number; // টাকা/কেজি
    pondRepair: number; // পাড় মেরামত (টাকা/শতক)
  };
  labor: {
    dailyWage: number; // দৈনিক মজুরি (টাকা)
    feedingDays: number; // খাদ্য দেওয়ার দিন/মাস
    maintenanceDays: number; // রক্ষণাবেক্ষণ দিন/মাস
    harvestLabor: number; // আহরণ শ্রমিক (টাকা/শতক)
  };
  feed: {
    floatingFeedPrice: number; // ভাসমান খাদ্য (টাকা/কেজি)
    sinkingFeedPrice: number; // ডুবন্ত খাদ্য (টাকা/কেজি)
    supplementaryFeedPrice: number; // সম্পূরক খাদ্য (টাকা/কেজি)
  };
  medicine: {
    monthlyPerDecimal: number; // মাসিক ঔষধ খরচ (টাকা/শতক)
    waterTreatment: number; // পানি শোধন (টাকা/শতক/মাস)
  };
  equipment: {
    netHauling: number; // জাল টানা (টাকা/শতক)
    netPurchase: number; // জাল কেনা (টাকা/১০০ শতক)
  };
  miscellaneous: {
    transport: number; // পরিবহন (টাকা/কেজি)
    marketing: number; // বাজারজাতকরণ (% of revenue)
  };
}

export const costRates: CostRates = {
  pondPreparation: {
    liming: 1, // ১ কেজি/শতক
    limingPrice: 15, // ১৫ টাকা/কেজি
    fertilizer: 5, // ৫ কেজি/শতক (জৈব সার)
    fertilizerPrice: 20, // ২০ টাকা/কেজি
    rotenone: 30, // ৩০ গ্রাম/শতক/ফুট
    rotenonePrice: 800, // ৮০০ টাকা/কেজি
    pondRepair: 200, // ২০০ টাকা/শতক
  },
  labor: {
    dailyWage: 500, // ৫০০ টাকা
    feedingDays: 30, // প্রতিদিন
    maintenanceDays: 8, // ৮ দিন/মাস
    harvestLabor: 100, // ১০০ টাকা/শতক
  },
  feed: {
    floatingFeedPrice: 55, // ৫৫ টাকা/কেজি
    sinkingFeedPrice: 48, // ৪৮ টাকা/কেজি
    supplementaryFeedPrice: 35, // ৩৫ টাকা/কেজি
  },
  medicine: {
    monthlyPerDecimal: 50, // ৫০ টাকা/শতক/মাস
    waterTreatment: 30, // ৩০ টাকা/শতক/মাস
  },
  equipment: {
    netHauling: 50, // ৫০ টাকা/শতক
    netPurchase: 12000, // ১২০০০ টাকা/১০০ শতক
  },
  miscellaneous: {
    transport: 5, // ৫ টাকা/কেজি
    marketing: 2, // ২%
  }
};
