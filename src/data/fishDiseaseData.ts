export interface FishDisease {
  id: string;
  name: string;
  nameEn: string;
  category: 'bacterial' | 'fungal' | 'parasitic' | 'viral' | 'nutritional';
  affectedFish: string[];
  season: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  causes: string[];
  prevention: string[];
  treatment: {
    method: string;
    dosage: string;
    duration: string;
  }[];
  imageUrl: string;
  imageDescription: string;
}

export const fishDiseases: FishDisease[] = [
  {
    id: 'eus',
    name: 'ক্ষত রোগ (EUS)',
    nameEn: 'Epizootic Ulcerative Syndrome',
    category: 'fungal',
    affectedFish: ['রুই', 'কাতলা', 'মৃগেল', 'কালবাউশ', 'বাটা', 'শোল', 'টাকি'],
    season: ['শীত (ডিসেম্বর-ফেব্রুয়ারি)'],
    severity: 'critical',
    symptoms: [
      'শরীরে লালচে দাগ যা ধীরে ধীরে গভীর ক্ষতে পরিণত হয়',
      'ক্ষতের চারপাশ ফুলে ওঠে',
      'সাদাটে বা ধূসর ছত্রাকের আস্তরণ',
      'ক্ষতস্থান থেকে মাংস খসে পড়া',
      'কাঁটা বা হাড় বের হয়ে আসা',
      'পাখনা ও লেজ পচে যাওয়া',
      'খাবার গ্রহণ বন্ধ করে দেওয়া'
    ],
    causes: [
      'Aphanomyces invadans ছত্রাক',
      'পানির তাপমাত্রা ২০°C এর নিচে নামা',
      'পানির pH কমে যাওয়া',
      'Aeromonas hydrophila ব্যাক্টেরিয়ার গৌণ সংক্রমণ'
    ],
    prevention: [
      'শীতের শুরুতে চুন প্রয়োগ (১ কেজি/শতক)',
      'লবণ প্রয়োগ (২০০-৩০০ গ্রাম/শতক)',
      'পানির গভীরতা ৪-৫ ফুট রাখা',
      'নিয়মিত পানির pH পরীক্ষা করা'
    ],
    treatment: [
      {
        method: 'চুন ও লবণ প্রয়োগ',
        dosage: '১ কেজি চুন + ২০০ গ্রাম লবণ/শতক',
        duration: 'প্রতি ১৫ দিন পর পর'
      },
      {
        method: 'সিফাক্স (CIFAX)',
        dosage: '১ লিটার পানিতে ১ কেজি গুলে পুকুরে ছিটানো',
        duration: '৭ দিন পর পুনরায়'
      },
      {
        method: 'অক্সিটেট্রাসাইক্লিন',
        dosage: '৩-৫ গ্রাম/কেজি খাবারে',
        duration: '৭ দিন'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
    imageDescription: 'ক্ষত রোগে আক্রান্ত মাছের গায়ে গভীর লাল ক্ষত দেখা যায়'
  },
  {
    id: 'dropsy',
    name: 'ড্রপসি (পেট ফোলা রোগ)',
    nameEn: 'Dropsy / Ascites',
    category: 'bacterial',
    affectedFish: ['রুই', 'কাতলা', 'তেলাপিয়া', 'পাঙ্গাস'],
    season: ['বর্ষা (জুন-অক্টোবর)', 'শীত (নভেম্বর-জানুয়ারি)'],
    severity: 'high',
    symptoms: [
      'পেট অস্বাভাবিকভাবে ফুলে যাওয়া',
      'আঁশ আনারসের মতো খাড়া হয়ে যাওয়া',
      'চোখ কোটর থেকে বের হয়ে আসা (Exophthalmia)',
      'পেটে হলুদাভ বা রক্তমিশ্রিত তরল জমা',
      'মাছের ভারসাম্য নষ্ট হওয়া',
      'খাবার না খাওয়া'
    ],
    causes: [
      'Aeromonas hydrophila ব্যাক্টেরিয়া',
      'কিডনির কার্যক্ষমতা নষ্ট হওয়া',
      'দূষিত পানি',
      'অতিরিক্ত স্ট্রেস'
    ],
    prevention: [
      'পানির গুণাগুণ বজায় রাখা',
      'নিয়মিত পানি পরিবর্তন',
      'স্ট্রেস কমানো',
      'সুষম খাদ্য প্রদান'
    ],
    treatment: [
      {
        method: 'আক্রান্ত মাছ আলাদা করা',
        dosage: 'অবিলম্বে',
        duration: 'সম্পূর্ণ সুস্থ না হওয়া পর্যন্ত'
      },
      {
        method: 'ক্লোরামফেনিকল',
        dosage: '১০০ মিগ্রা/কেজি খাবারে',
        duration: '৭-১০ দিন'
      },
      {
        method: 'পটাশিয়াম পারম্যাঙ্গানেট গোসল',
        dosage: '২-৩ পিপিএম',
        duration: '২-৩ মিনিট'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&h=400&fit=crop',
    imageDescription: 'ড্রপসি রোগে মাছের পেট ফুলে যায় এবং আঁশ খাড়া হয়ে যায়'
  },
  {
    id: 'argulosis',
    name: 'আরগুলাস (মাছের উকুন)',
    nameEn: 'Argulosis / Fish Lice',
    category: 'parasitic',
    affectedFish: ['রুই', 'মৃগেল', 'কাতলা', 'কার্প জাতীয় সব মাছ'],
    season: ['শীত (নভেম্বর-ফেব্রুয়ারি)'],
    severity: 'medium',
    symptoms: [
      'মাছের গায়ে গোলাকার, চ্যাপ্টা ও স্বচ্ছ পোকা দেখা যায়',
      'মাছ অস্থির হয়ে লাফালাফি করে',
      'পুকুর পাড়ে বা বাঁশে গা ঘষে',
      'আক্রান্ত স্থানে লাল দাগ',
      'ক্ষত থেকে গৌণ সংক্রমণ'
    ],
    causes: [
      'Argulus spp. ক্রাস্টাসিয়ান পরজীবী',
      'দূষিত পানি',
      'অন্য আক্রান্ত মাছ থেকে ছড়ানো'
    ],
    prevention: [
      'পুকুর শুকিয়ে রোদে দেওয়া',
      'চুন প্রয়োগ',
      'স্বাস্থ্যকর পোনা সংগ্রহ',
      'জৈব নিরাপত্তা বজায় রাখা'
    ],
    treatment: [
      {
        method: 'যান্ত্রিক দমন (বাঁশ পদ্ধতি)',
        dosage: 'পুকুরে বাঁশ পুঁতে ডিম সংগ্রহ',
        duration: 'প্রতি ৭-১০ দিন পর'
      },
      {
        method: 'ডিপটারেক্স',
        dosage: '০.৫ পিপিএম',
        duration: 'সাপ্তাহিক'
      },
      {
        method: 'পটাশ গোসল',
        dosage: '৫ পিপিএম',
        duration: '১ ঘণ্টা'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=600&h=400&fit=crop',
    imageDescription: 'আরগুলাস পরজীবী মাছের গায়ে লেগে রক্ত শোষণ করে'
  },
  {
    id: 'gill-rot',
    name: 'ফুলকা পচা রোগ',
    nameEn: 'Gill Rot / Branchiomycosis',
    category: 'fungal',
    affectedFish: ['কার্প', 'তেলাপিয়া', 'পাঙ্গাস', 'শিং', 'মাগুর'],
    season: ['গ্রীষ্ম (মার্চ-মে)'],
    severity: 'high',
    symptoms: [
      'মাছ দ্রুত শ্বাস নেয় (হাঁপায়)',
      'ফুলকা ফ্যাকাশে বা ধূসর হয়ে যায়',
      'ফুলকা থেকে শ্লেষ্মা বের হয়',
      'মাছ পানির উপরে ভেসে থাকে',
      'ফুলকার অংশ পচে খসে পড়ে'
    ],
    causes: [
      'Branchiomyces ছত্রাক',
      'অ্যামোনিয়া বেড়ে যাওয়া',
      'অক্সিজেন কমে যাওয়া',
      'জৈব পদার্থপূর্ণ দূষিত পানি'
    ],
    prevention: [
      'নিয়মিত পানি পরিবর্তন',
      'এয়ারেশন সর্বোচ্চ রাখা',
      'অ্যামোনিয়া নিয়ন্ত্রণ',
      'অতিরিক্ত খাবার না দেওয়া'
    ],
    treatment: [
      {
        method: 'পটাশিয়াম পারম্যাঙ্গানেট',
        dosage: '২-৩ পিপিএম',
        duration: '৩ দিন পর পর'
      },
      {
        method: 'চুন প্রয়োগ',
        dosage: '১ কেজি/শতক',
        duration: 'একবার'
      },
      {
        method: 'এয়ারেশন বাড়ানো',
        dosage: 'সার্বক্ষণিক',
        duration: 'সুস্থ না হওয়া পর্যন্ত'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&h=400&fit=crop',
    imageDescription: 'ফুলকা পচা রোগে মাছের ফুলকা ফ্যাকাশে ও ক্ষতিগ্রস্ত হয়'
  },
  {
    id: 'white-spot-ich',
    name: 'সাদা দাগ রোগ (Ich)',
    nameEn: 'White Spot Disease / Ichthyophthiriasis',
    category: 'parasitic',
    affectedFish: ['সব ধরনের মাছ', 'বিশেষত অ্যাকুয়ারিয়াম মাছ'],
    season: ['শীত (তাপমাত্রা কমলে)', 'বর্ষা (পানি পরিবর্তনের সময়)'],
    severity: 'medium',
    symptoms: [
      'শরীরে ছোট ছোট সাদা দানার মতো দাগ',
      'মাছ গা চুলকায় ও ঘষে',
      'পাখনা গুটিয়ে রাখে',
      'শ্বাসকষ্ট হয়',
      'খাবার কম খায়'
    ],
    causes: [
      'Ichthyophthirius multifiliis প্রোটোজোয়া',
      'তাপমাত্রার হঠাৎ পরিবর্তন',
      'স্ট্রেস',
      'দুর্বল রোগ প্রতিরোধ ক্ষমতা'
    ],
    prevention: [
      'নতুন মাছ কোয়ারেন্টাইন করা',
      'পানির তাপমাত্রা স্থিতিশীল রাখা',
      'স্ট্রেস কমানো',
      'ভালো পানির গুণমান বজায় রাখা'
    ],
    treatment: [
      {
        method: 'পানির তাপমাত্রা বাড়ানো',
        dosage: '২৮-৩০°C',
        duration: '১০-১৪ দিন'
      },
      {
        method: 'লবণ প্রয়োগ',
        dosage: '২-৩ গ্রাম/লিটার',
        duration: '৭-১০ দিন'
      },
      {
        method: 'মিথিলিন ব্লু',
        dosage: '২ পিপিএম',
        duration: '৩ দিন পর পর'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1520301255226-bf5f144451c1?w=600&h=400&fit=crop',
    imageDescription: 'সাদা দাগ রোগে মাছের গায়ে ছোট সাদা দানা দেখা যায়'
  },
  {
    id: 'wssv',
    name: 'হোয়াইট স্পট সিনড্রোম (চিংড়ি)',
    nameEn: 'White Spot Syndrome Virus (WSSV)',
    category: 'viral',
    affectedFish: ['বাগদা চিংড়ি', 'গলদা চিংড়ি'],
    season: ['শীত (ডিসেম্বর-ফেব্রুয়ারি)'],
    severity: 'critical',
    symptoms: [
      'ক্যারাপেসে সাদা চুন-জাতীয় দাগ (০.৫-২ মিমি)',
      'শরীর লালচে বর্ণ ধারণ করে',
      'খাওয়া বন্ধ করে দেয়',
      'পুকুরের পাড়ে বা পানির ওপরে ভেসে থাকে',
      '৩-১০ দিনে ১০০% মড়ক সম্ভব'
    ],
    causes: [
      'White Spot Syndrome Virus (WSSV)',
      'আক্রান্ত ব্রুডস্টক বা পিএল থেকে',
      'কাঁকড়া বা অন্য বাহক থেকে',
      'নিম্ন তাপমাত্রা'
    ],
    prevention: [
      'SPF (রোগমুক্ত) পোনা ব্যবহার',
      'বায়োসিকিউরিটি বেষ্টনী তৈরি',
      'কাঁকড়া প্রবেশ নিয়ন্ত্রণ',
      'শীতে পোনা না ছাড়া',
      'PCR টেস্ট করা'
    ],
    treatment: [
      {
        method: 'কোনো চিকিৎসা নেই',
        dosage: 'প্রতিরোধই একমাত্র উপায়',
        duration: 'N/A'
      },
      {
        method: 'আক্রান্ত ঘের ধ্বংস',
        dosage: 'ব্লিচিং পাউডার দিয়ে জীবাণুমুক্ত',
        duration: 'অবিলম্বে'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&h=400&fit=crop',
    imageDescription: 'WSSV আক্রান্ত চিংড়ির খোসায় সাদা দাগ দেখা যায়'
  },
  {
    id: 'streptococcosis',
    name: 'স্ট্রেপ্টোকক্কোসিস',
    nameEn: 'Streptococcosis',
    category: 'bacterial',
    affectedFish: ['তেলাপিয়া'],
    season: ['গ্রীষ্ম (তাপমাত্রা ৩১°C এর বেশি)'],
    severity: 'high',
    symptoms: [
      'মাছ বৃত্তাকারে বা পাগলের মতো ঘোরে',
      'চোখ ঠেলে বের হয়ে আসে',
      'চোখে রক্ত জমে',
      'পেট ফুলে যায়',
      'পায়ু পথে রক্তাভ তরল বের হয়'
    ],
    causes: [
      'Streptococcus agalactiae ব্যাক্টেরিয়া',
      'Streptococcus iniae',
      'উচ্চ পানির তাপমাত্রা',
      'অতিরিক্ত স্টকিং ঘনত্ব'
    ],
    prevention: [
      'স্টকিং ঘনত্ব কমানো',
      'পানির গুণমান বজায় রাখা',
      'স্ট্রেস কমানো',
      'ভ্যাক্সিন ব্যবহার (যদি সম্ভব)'
    ],
    treatment: [
      {
        method: 'অক্সিটেট্রাসাইক্লিন',
        dosage: '৫০-১০০ মিগ্রা/কেজি মাছ/দিন',
        duration: '১০-১৪ দিন'
      },
      {
        method: 'এরিথ্রোমাইসিন',
        dosage: '২৫-৫০ মিগ্রা/কেজি মাছ/দিন',
        duration: '১০ দিন'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600&h=400&fit=crop',
    imageDescription: 'স্ট্রেপ্টোকক্কোসিসে তেলাপিয়ার চোখ ফুলে যায় ও রক্ত জমে'
  },
  {
    id: 'fin-tail-rot',
    name: 'পাখনা ও লেজ পচা',
    nameEn: 'Fin and Tail Rot',
    category: 'bacterial',
    affectedFish: ['সব ধরনের মাছ'],
    season: ['বর্ষা', 'শীত'],
    severity: 'medium',
    symptoms: [
      'পাখনা বা লেজের কিনারা সাদা বা লাল হয়ে যাওয়া',
      'ধীরে ধীরে ক্ষয় হতে থাকা',
      'পাখনা ছিঁড়ে যাওয়া',
      'রক্তপাত হওয়া'
    ],
    causes: [
      'Aeromonas ব্যাক্টেরিয়া',
      'Pseudomonas ব্যাক্টেরিয়া',
      'খারাপ পানির গুণমান',
      'শারীরিক আঘাত'
    ],
    prevention: [
      'পানির গুণমান উন্নত করা',
      'আক্রমণাত্মক মাছ আলাদা করা',
      'অ্যামোনিয়া নিয়ন্ত্রণ',
      'সতর্কতার সাথে মাছ ধরা'
    ],
    treatment: [
      {
        method: 'পটাশ গোসল',
        dosage: '৫ পিপিএম',
        duration: '৫ মিনিট/দিন'
      },
      {
        method: 'অ্যান্টিবায়োটিক',
        dosage: '৩-৫ গ্রাম/কেজি খাবারে',
        duration: '৭ দিন'
      },
      {
        method: 'লবণ প্রয়োগ',
        dosage: '২ গ্রাম/লিটার',
        duration: '৫-৭ দিন'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&h=400&fit=crop',
    imageDescription: 'পাখনা পচা রোগে মাছের পাখনা ক্ষয়প্রাপ্ত হয়'
  },
  {
    id: 'saprolegniasis',
    name: 'স্যাপ্রোলেগনিয়াসিস (তুলা রোগ)',
    nameEn: 'Saprolegniasis / Cotton Wool Disease',
    category: 'fungal',
    affectedFish: ['সব ধরনের মাছ', 'বিশেষত দুর্বল মাছ', 'ডিম'],
    season: ['শীত (ডিসেম্বর-ফেব্রুয়ারি)'],
    severity: 'medium',
    symptoms: [
      'শরীরে তুলার মতো সাদা বা ধূসর আবরণ',
      'ক্ষতস্থানে ছত্রাক বৃদ্ধি',
      'মাছ দুর্বল হয়ে যায়',
      'ডিমে সাদা আবরণ পড়ে ডিম নষ্ট হয়'
    ],
    causes: [
      'Saprolegnia ছত্রাক',
      'শারীরিক আঘাত বা ক্ষত',
      'দুর্বল রোগ প্রতিরোধ ক্ষমতা',
      'ঠান্ডা পানি'
    ],
    prevention: [
      'মাছ পরিবহনে সতর্কতা',
      'ক্ষত সৃষ্টি না হওয়া',
      'পানির গুণমান বজায় রাখা',
      'নিয়মিত লবণ প্রয়োগ'
    ],
    treatment: [
      {
        method: 'লবণ গোসল',
        dosage: '২-৩% লবণ পানি',
        duration: '১০-১৫ মিনিট'
      },
      {
        method: 'মিথিলিন ব্লু',
        dosage: '২-৩ পিপিএম',
        duration: '৩ দিন'
      },
      {
        method: 'ম্যালাকাইট গ্রিন',
        dosage: '০.১ পিপিএম',
        duration: 'একবার'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=600&h=400&fit=crop',
    imageDescription: 'তুলা রোগে মাছের গায়ে তুলার মতো সাদা ছত্রাক দেখা যায়'
  },
  {
    id: 'trichodiniasis',
    name: 'ট্রাইকোডিনিয়াসিস',
    nameEn: 'Trichodiniasis',
    category: 'parasitic',
    affectedFish: ['পোনা মাছ', 'কার্প', 'তেলাপিয়া'],
    season: ['বর্ষা-পরবর্তী (অক্টোবর-নভেম্বর)'],
    severity: 'medium',
    symptoms: [
      'মাছের গায়ে ধূসর আবরণ',
      'অতিরিক্ত শ্লেষ্মা নিঃসরণ',
      'মাছ ঘষা দেয়',
      'শ্বাসকষ্ট',
      'পোনার মড়ক'
    ],
    causes: [
      'Trichodina প্রোটোজোয়া পরজীবী',
      'অতিরিক্ত জৈব পদার্থ',
      'উচ্চ মজুদ ঘনত্ব'
    ],
    prevention: [
      'পুকুর জৈব পদার্থমুক্ত রাখা',
      'মজুদ ঘনত্ব কমানো',
      'নিয়মিত পানি পরিবর্তন'
    ],
    treatment: [
      {
        method: 'ফরমালিন গোসল',
        dosage: '১৫০-২০০ পিপিএম',
        duration: '১৫-৩০ মিনিট'
      },
      {
        method: 'লবণ প্রয়োগ',
        dosage: '৫ গ্রাম/লিটার',
        duration: '১ ঘণ্টা'
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop',
    imageDescription: 'ট্রাইকোডিনা পরজীবী পোনা মাছে বেশি আক্রমণ করে'
  }
];

export const diseaseCategories = [
  { id: 'all', name: 'সকল রোগ', icon: '🐟' },
  { id: 'bacterial', name: 'ব্যাক্টেরিয়াজনিত', icon: '🦠' },
  { id: 'fungal', name: 'ছত্রাকজনিত', icon: '🍄' },
  { id: 'parasitic', name: 'পরজীবীজনিত', icon: '🪱' },
  { id: 'viral', name: 'ভাইরাসজনিত', icon: '🔬' },
];

export const severityLabels = {
  low: { label: 'হালকা', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  medium: { label: 'মাঝারি', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  high: { label: 'গুরুতর', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
  critical: { label: 'মারাত্মক', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
};
