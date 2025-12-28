import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "bn" | "en";

interface TranslationStrings {
  // Common
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  loading: string;
  error: string;
  success: string;
  refresh: string;
  back: string;
  next: string;
  previous: string;
  close: string;
  confirm: string;
  yes: string;
  no: string;
  
  // Navigation
  home: string;
  dashboard: string;
  modules: string;
  shop: string;
  profile: string;
  settings: string;
  logout: string;
  login: string;
  register: string;
  
  // Dashboard
  welcomeBack: string;
  myPond: string;
  income: string;
  expense: string;
  reports: string;
  backup: string;
  
  // Modules
  pondCalculator: string;
  fishStocking: string;
  feedManagement: string;
  waterQuality: string;
  fishAdvice: string;
  medicineApplication: string;
  fertilizerCalculator: string;
  biomassCalculator: string;
  stockingDensity: string;
  costCalculator: string;
  fisheriesContact: string;
  
  // Pond Calculator
  pondShape: string;
  rectangle: string;
  square: string;
  circle: string;
  trapezoid: string;
  length: string;
  width: string;
  depth: string;
  radius: string;
  topWidth: string;
  bottomWidth: string;
  calculate: string;
  area: string;
  volume: string;
  unit: string;
  meter: string;
  feet: string;
  centimeter: string;
  squareMeter: string;
  squareFeet: string;
  cubicMeter: string;
  cubicFeet: string;
  liter: string;
  
  // Settings
  systemSettings: string;
  languageSettings: string;
  currencySettings: string;
  selectLanguage: string;
  selectCurrency: string;
  primaryLanguage: string;
  defaultCurrency: string;
  settingsSaved: string;
  settingsError: string;
  additionalConfig: string;
  advancedSettings: string;
  timezone: string;
  maintenanceMode: string;
  active: string;
  inactive: string;
  appName: string;
  maxPonds: string;
  backupFrequency: string;
  daily: string;
  weekly: string;
  monthly: string;
  
  // Admin
  adminDashboard: string;
  adminProducts: string;
  adminUsers: string;
  adminReports: string;
  adminSettings: string;
  totalUsers: string;
  totalProducts: string;
  totalOrders: string;
  
  // Products/Shop
  products: string;
  price: string;
  category: string;
  orderNow: string;
  addToCart: string;
  viewDetails: string;
  discount: string;
  
  // Notifications
  notificationSettings: string;
  emailNotifications: string;
  smsNotifications: string;
  pushNotifications: string;
  waterQualityAlerts: string;
  feedingReminders: string;
  
  // Theme
  themeSettings: string;
  lightTheme: string;
  darkTheme: string;
  systemTheme: string;
}

const translations: Record<Language, TranslationStrings> = {
  bn: {
    // Common
    save: "সংরক্ষণ করুন",
    cancel: "বাতিল",
    delete: "মুছুন",
    edit: "সম্পাদনা",
    add: "যোগ করুন",
    search: "খুঁজুন",
    loading: "লোড হচ্ছে...",
    error: "ত্রুটি",
    success: "সফল",
    refresh: "রিফ্রেশ",
    back: "পিছনে",
    next: "পরবর্তী",
    previous: "পূর্ববর্তী",
    close: "বন্ধ করুন",
    confirm: "নিশ্চিত করুন",
    yes: "হ্যাঁ",
    no: "না",
    
    // Navigation
    home: "হোম",
    dashboard: "ড্যাশবোর্ড",
    modules: "মডিউল",
    shop: "শপ",
    profile: "প্রোফাইল",
    settings: "সেটিংস",
    logout: "লগআউট",
    login: "লগইন",
    register: "রেজিস্টার",
    
    // Dashboard
    welcomeBack: "স্বাগতম",
    myPond: "আমার পুকুর",
    income: "আয়",
    expense: "ব্যয়",
    reports: "রিপোর্ট",
    backup: "ব্যাকআপ",
    
    // Modules
    pondCalculator: "পুকুর ক্যালকুলেটর",
    fishStocking: "মাছ স্টকিং",
    feedManagement: "খাদ্য ব্যবস্থাপনা",
    waterQuality: "পানির মান",
    fishAdvice: "মাছের পরামর্শ",
    medicineApplication: "ওষুধ প্রয়োগ",
    fertilizerCalculator: "সার ক্যালকুলেটর",
    biomassCalculator: "বায়োমাস ক্যালকুলেটর",
    stockingDensity: "স্টকিং ঘনত্ব",
    costCalculator: "খরচ ক্যালকুলেটর",
    fisheriesContact: "মৎস্য যোগাযোগ",
    
    // Pond Calculator
    pondShape: "পুকুরের আকৃতি",
    rectangle: "আয়তাকার",
    square: "বর্গাকার",
    circle: "বৃত্তাকার",
    trapezoid: "ট্র্যাপিজয়েড",
    length: "দৈর্ঘ্য",
    width: "প্রস্থ",
    depth: "গভীরতা",
    radius: "ব্যাসার্ধ",
    topWidth: "উপরের প্রস্থ",
    bottomWidth: "নিচের প্রস্থ",
    calculate: "হিসাব করুন",
    area: "আয়তন",
    volume: "আয়তন",
    unit: "একক",
    meter: "মিটার",
    feet: "ফুট",
    centimeter: "সেন্টিমিটার",
    squareMeter: "বর্গমিটার",
    squareFeet: "বর্গফুট",
    cubicMeter: "ঘনমিটার",
    cubicFeet: "ঘনফুট",
    liter: "লিটার",
    
    // Settings
    systemSettings: "সিস্টেম সেটিংস",
    languageSettings: "ভাষা সেটিংস",
    currencySettings: "মুদ্রা সেটিংস",
    selectLanguage: "ভাষা নির্বাচন করুন",
    selectCurrency: "মুদ্রা নির্বাচন করুন",
    primaryLanguage: "প্রাথমিক ভাষা",
    defaultCurrency: "ডিফল্ট মুদ্রা",
    settingsSaved: "সেটিংস সংরক্ষণ করা হয়েছে",
    settingsError: "সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে",
    additionalConfig: "অতিরিক্ত কনফিগারেশন",
    advancedSettings: "অ্যাডভান্সড সেটিংস",
    timezone: "টাইমজোন",
    maintenanceMode: "মেইনটেনেন্স মোড",
    active: "সক্রিয়",
    inactive: "নিষ্ক্রিয়",
    appName: "অ্যাপ্লিকেশনের নাম",
    maxPonds: "সর্বোচ্চ পুকুর সংখ্যা",
    backupFrequency: "ব্যাকআপ ফ্রিকোয়েন্সি",
    daily: "দৈনিক",
    weekly: "সাপ্তাহিক",
    monthly: "মাসিক",
    
    // Admin
    adminDashboard: "অ্যাডমিন ড্যাশবোর্ড",
    adminProducts: "পণ্য পরিচালনা",
    adminUsers: "ব্যবহারকারী পরিচালনা",
    adminReports: "রিপোর্ট",
    adminSettings: "সেটিংস",
    totalUsers: "মোট ব্যবহারকারী",
    totalProducts: "মোট পণ্য",
    totalOrders: "মোট অর্ডার",
    
    // Products/Shop
    products: "পণ্য",
    price: "মূল্য",
    category: "ক্যাটাগরি",
    orderNow: "অর্ডার করুন",
    addToCart: "কার্টে যোগ করুন",
    viewDetails: "বিস্তারিত দেখুন",
    discount: "ছাড়",
    
    // Notifications
    notificationSettings: "নোটিফিকেশন সেটিংস",
    emailNotifications: "ইমেইল নোটিফিকেশন",
    smsNotifications: "এসএমএস নোটিফিকেশন",
    pushNotifications: "পুশ নোটিফিকেশন",
    waterQualityAlerts: "পানির মান সতর্কতা",
    feedingReminders: "খাওয়ানোর রিমাইন্ডার",
    
    // Theme
    themeSettings: "থিম সেটিংস",
    lightTheme: "লাইট থিম",
    darkTheme: "ডার্ক থিম",
    systemTheme: "সিস্টেম থিম",
  },
  en: {
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    refresh: "Refresh",
    back: "Back",
    next: "Next",
    previous: "Previous",
    close: "Close",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    
    // Navigation
    home: "Home",
    dashboard: "Dashboard",
    modules: "Modules",
    shop: "Shop",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    login: "Login",
    register: "Register",
    
    // Dashboard
    welcomeBack: "Welcome Back",
    myPond: "My Pond",
    income: "Income",
    expense: "Expense",
    reports: "Reports",
    backup: "Backup",
    
    // Modules
    pondCalculator: "Pond Calculator",
    fishStocking: "Fish Stocking",
    feedManagement: "Feed Management",
    waterQuality: "Water Quality",
    fishAdvice: "Fish Advice",
    medicineApplication: "Medicine Application",
    fertilizerCalculator: "Fertilizer Calculator",
    biomassCalculator: "Biomass Calculator",
    stockingDensity: "Stocking Density",
    costCalculator: "Cost Calculator",
    fisheriesContact: "Fisheries Contact",
    
    // Pond Calculator
    pondShape: "Pond Shape",
    rectangle: "Rectangle",
    square: "Square",
    circle: "Circle",
    trapezoid: "Trapezoid",
    length: "Length",
    width: "Width",
    depth: "Depth",
    radius: "Radius",
    topWidth: "Top Width",
    bottomWidth: "Bottom Width",
    calculate: "Calculate",
    area: "Area",
    volume: "Volume",
    unit: "Unit",
    meter: "Meter",
    feet: "Feet",
    centimeter: "Centimeter",
    squareMeter: "Square Meter",
    squareFeet: "Square Feet",
    cubicMeter: "Cubic Meter",
    cubicFeet: "Cubic Feet",
    liter: "Liter",
    
    // Settings
    systemSettings: "System Settings",
    languageSettings: "Language Settings",
    currencySettings: "Currency Settings",
    selectLanguage: "Select Language",
    selectCurrency: "Select Currency",
    primaryLanguage: "Primary Language",
    defaultCurrency: "Default Currency",
    settingsSaved: "Settings saved successfully",
    settingsError: "Error saving settings",
    additionalConfig: "Additional Configuration",
    advancedSettings: "Advanced Settings",
    timezone: "Timezone",
    maintenanceMode: "Maintenance Mode",
    active: "Active",
    inactive: "Inactive",
    appName: "Application Name",
    maxPonds: "Maximum Ponds Per User",
    backupFrequency: "Backup Frequency",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    
    // Admin
    adminDashboard: "Admin Dashboard",
    adminProducts: "Product Management",
    adminUsers: "User Management",
    adminReports: "Reports",
    adminSettings: "Settings",
    totalUsers: "Total Users",
    totalProducts: "Total Products",
    totalOrders: "Total Orders",
    
    // Products/Shop
    products: "Products",
    price: "Price",
    category: "Category",
    orderNow: "Order Now",
    addToCart: "Add to Cart",
    viewDetails: "View Details",
    discount: "Discount",
    
    // Notifications
    notificationSettings: "Notification Settings",
    emailNotifications: "Email Notifications",
    smsNotifications: "SMS Notifications",
    pushNotifications: "Push Notifications",
    waterQualityAlerts: "Water Quality Alerts",
    feedingReminders: "Feeding Reminders",
    
    // Theme
    themeSettings: "Theme Settings",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    systemTheme: "System Theme",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationStrings;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("appLanguage");
    return (saved as Language) || "bn";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("appLanguage", lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
