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
  details: string;
  viewDetails: string;
  
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
  loginSignup: string;
  adminPanel: string;
  allModules: string;
  pondMeasurement: string;
  marketPrice: string;
  
  // App Branding
  appTitle: string;
  appSubtitle: string;
  forBangladesh: string;
  
  // Dashboard
  welcomeBack: string;
  welcome: string;
  myPond: string;
  income: string;
  expense: string;
  reports: string;
  backup: string;
  totalIncome: string;
  totalExpense: string;
  profitLoss: string;
  pondCount: string;
  totalArea: string;
  totalFish: string;
  pondSummary: string;
  pondName: string;
  recentIncome: string;
  recentExpense: string;
  noPondAdded: string;
  viewSummary: string;
  status: string;
  action: string;
  active: string;
  harvestComplete: string;
  preparation: string;
  empty: string;
  
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
  reportGeneration: string;
  
  // Module Descriptions
  pondCalculatorDesc: string;
  fishStockingDesc: string;
  feedManagementDesc: string;
  waterQualityDesc: string;
  fishAdviceDesc: string;
  medicineApplicationDesc: string;
  fertilizerCalculatorDesc: string;
  biomassCalculatorDesc: string;
  stockingDensityDesc: string;
  costCalculatorDesc: string;
  reportGenerationDesc: string;
  
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
  decimal: string;
  
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
  discount: string;
  allProducts: string;
  productsForFishing: string;
  noProductFound: string;
  searchPlaceholder: string;
  priceFilter: string;
  resetFilters: string;
  applyFilter: string;
  productsFound: string;
  
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
  
  // Homepage
  heroTagline: string;
  heroTitle: string;
  heroDescription: string;
  startNow: string;
  integratedModules: string;
  integratedModulesDesc: string;
  whyUseSystem: string;
  scientificMethod: string;
  scientificMethodDesc: string;
  resourceOptimization: string;
  resourceOptimizationDesc: string;
  productivityIncrease: string;
  productivityIncreaseDesc: string;
  easyToUse: string;
  easyToUseDesc: string;
  startManagement: string;
  startManagementDesc: string;
  startPondMeasurement: string;
  
  // Modules Page
  yourProgress: string;
  pondInfoSaved: string;
  pondNotMeasured: string;
  fishStockInfoSaved: string;
  fishStockNotCalculated: string;
  workflowGuide: string;
  workflowGuideDesc: string;
  step1Desc: string;
  step2Desc: string;
  step3Desc: string;
  step4Desc: string;
  step5Desc: string;
  quickStart: string;
  quickStartDesc: string;
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
    details: "বিস্তারিত",
    viewDetails: "বিস্তারিত দেখুন",
    
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
    loginSignup: "লগইন / সাইনআপ",
    adminPanel: "অ্যাডমিন প্যানেল",
    allModules: "সকল মডিউল",
    pondMeasurement: "পুকুর পরিমাপ",
    marketPrice: "বাজার দর",
    
    // App Branding
    appTitle: "মৎস্য ব্যবস্থাপনা",
    appSubtitle: "বৈজ্ঞানিক মাছ চাষ",
    forBangladesh: "বাংলাদেশের মৎস্য খাতের জন্য",
    
    // Dashboard
    welcomeBack: "স্বাগতম",
    welcome: "স্বাগতম",
    myPond: "আমার পুকুর",
    income: "আয়",
    expense: "ব্যয়",
    reports: "রিপোর্ট",
    backup: "ব্যাকআপ",
    totalIncome: "মোট আয়",
    totalExpense: "মোট ব্যয়",
    profitLoss: "লাভ/ক্ষতি",
    pondCount: "পুকুর সংখ্যা",
    totalArea: "মোট আয়তন",
    totalFish: "মোট মাছ",
    pondSummary: "পুকুরের সারসংক্ষেপ",
    pondName: "পুকুরের নাম",
    recentIncome: "সাম্প্রতিক আয়",
    recentExpense: "সাম্প্রতিক ব্যয়",
    noPondAdded: "কোনো পুকুর যোগ করা হয়নি",
    viewSummary: "আপনার মাছ চাষের সারসংক্ষেপ দেখুন",
    status: "স্ট্যাটাস",
    action: "অ্যাকশন",
    active: "চলমান",
    harvestComplete: "আহরণ সম্পন্ন",
    preparation: "প্রস্তুতি",
    empty: "খালি",
    
    // Modules
    pondCalculator: "পুকুরের পরিমাপ",
    fishStocking: "মাছের মজুদ ঘনত্ব",
    feedManagement: "খাদ্য ব্যবস্থাপনা",
    waterQuality: "পানির গুণমান",
    fishAdvice: "ফিস এডভাইস",
    medicineApplication: "ঔষধ প্রয়োগ",
    fertilizerCalculator: "সার প্রয়োগ",
    biomassCalculator: "বায়োমাস গণনা",
    stockingDensity: "স্টকিং ডেনসিটি",
    costCalculator: "খরচ হিসাব",
    fisheriesContact: "মৎস্য যোগাযোগ",
    reportGeneration: "রিপোর্ট তৈরি",
    
    // Module Descriptions
    pondCalculatorDesc: "পুকুরের জায়গা এবং পানির আয়তন সঠিকভাবে নির্ণয় করুন",
    fishStockingDesc: "পুকুরে কতটি পোনা মজুদ করবেন তা হিসাব করুন",
    feedManagementDesc: "প্রতিদিনের খাদ্যের পরিমাণ এবং FCR হিসাব করুন",
    waterQualityDesc: "পানির pH, অক্সিজেন এবং অন্যান্য পরামিতি পরীক্ষা করুন",
    fishAdviceDesc: "AI এর মাধ্যমে মাছ চাষ সম্পর্কিত সকল সমস্যার সমাধান পান",
    medicineApplicationDesc: "রোগ প্রতিরোধ এবং চিকিৎসার জন্য ঔষধের মাত্রা নির্ণয় করুন",
    fertilizerCalculatorDesc: "পুকুরের উৎপাদনশীলতা বাড়াতে সঠিক সার প্রয়োগ করুন",
    biomassCalculatorDesc: "মাছের মোট ওজন এবং বৃদ্ধির হার নির্ণয় করুন",
    stockingDensityDesc: "সম্পূর্ণ খরচ ও উপকরণ সহ মাছ মজুদ পরিকল্পনা করুন",
    costCalculatorDesc: "মাছ চাষের সম্পূর্ণ খরচ এবং লাভ-ক্ষতির হিসাব করুন",
    reportGenerationDesc: "খামারের সকল তথ্য একসাথে রিপোর্ট আকারে দেখুন",
    
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
    area: "ক্ষেত্রফল",
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
    decimal: "শতক",
    
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
    products: "পণ্য সমূহ",
    price: "মূল্য",
    category: "ক্যাটাগরি",
    orderNow: "অর্ডার করুন",
    addToCart: "কার্টে যোগ করুন",
    discount: "ছাড়",
    allProducts: "সকল পণ্য",
    productsForFishing: "মাছ চাষের জন্য প্রয়োজনীয় সব পণ্য",
    noProductFound: "কোন পণ্য পাওয়া যায়নি",
    searchPlaceholder: "পণ্যের নাম, ক্যাটাগরি বা কোম্পানি খুঁজুন...",
    priceFilter: "প্রাইস ফিল্টার",
    resetFilters: "সব ফিল্টার মুছুন",
    applyFilter: "প্রয়োগ করুন",
    productsFound: "টি পণ্য পাওয়া গেছে",
    
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
    
    // Homepage
    heroTagline: "বাংলাদেশের মৎস্য খাতের জন্য",
    heroTitle: "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা সিস্টেম",
    heroDescription: "আধুনিক প্রযুক্তি ব্যবহার করে আপনার মাছ চাষকে আরও লাভজনক এবং টেকসই করুন। সম্পূর্ণ বৈজ্ঞানিক পদ্ধতিতে পুকুর থেকে বাজার পর্যন্ত প্রতিটি ধাপে সঠিক সিদ্ধান্ত নিন।",
    startNow: "এখনই শুরু করুন",
    integratedModules: "সমন্বিত ক্যালকুলেটর মডিউল",
    integratedModulesDesc: "প্রতিটি মডিউল পরস্পর সংযুক্ত এবং একে অপরের সাথে ডেটা শেয়ার করে, যা আপনাকে সম্পূর্ণ খামার ব্যবস্থাপনায় সহায়তা করে",
    whyUseSystem: "কেন এই সিস্টেম ব্যবহার করবেন?",
    scientificMethod: "বৈজ্ঞানিক পদ্ধতি",
    scientificMethodDesc: "গবেষণা-ভিত্তিক ফর্মুলা এবং আন্তর্জাতিক মান অনুসরণ করে তৈরি",
    resourceOptimization: "সম্পদের সর্বোত্তম ব্যবহার",
    resourceOptimizationDesc: "খাদ্য, ঔষধ এবং সারের অপচয় রোধ করে খরচ কমান",
    productivityIncrease: "উৎপাদনশীলতা বৃদ্ধি",
    productivityIncreaseDesc: "সঠিক ব্যবস্থাপনায় প্রতি হেক্টরে বেশি মাছ উৎপাদন করুন",
    easyToUse: "সহজ ব্যবহার",
    easyToUseDesc: "বাংলা ভাষায় সহজবোধ্য ইন্টারফেস এবং স্পষ্ট নির্দেশনা",
    startManagement: "আপনার মাছ চাষ ব্যবস্থাপনা শুরু করুন",
    startManagementDesc: "পুকুরের পরিমাপ থেকে শুরু করে সম্পূর্ণ চক্র সম্পন্ন করুন",
    startPondMeasurement: "পুকুর পরিমাপ শুরু করুন",
    
    // Modules Page
    yourProgress: "আপনার অগ্রগতি",
    pondInfoSaved: "পুকুরের তথ্য সংরক্ষিত",
    pondNotMeasured: "পুকুরের পরিমাপ এখনো করা হয়নি",
    fishStockInfoSaved: "মাছের মজুদ তথ্য সংরক্ষিত",
    fishStockNotCalculated: "মাছের মজুদ ঘনত্ব হিসাব করা হয়নি",
    workflowGuide: "কার্যপ্রবাহ গাইড",
    workflowGuideDesc: "সর্বোত্তম ফলাফলের জন্য এই ক্রমানুসারে মডিউলগুলি ব্যবহার করুন",
    step1Desc: "পুকুরের পরিমাপ: প্রথমে পুকুরের আয়তন নির্ণয় করুন - এটি অন্যান্য সব হিসাবের ভিত্তি",
    step2Desc: "মাছের মজুদ: পুকুরের আয়তন অনুযায়ী মাছের সংখ্যা নির্ধারণ করুন",
    step3Desc: "বায়োমাস ও খাদ্য: মাছের ওজন এবং খাদ্যের পরিমাণ হিসাব করুন",
    step4Desc: "ঔষধ ও সার: পুকুরের আয়তন ব্যবহার করে সঠিক মাত্রা নির্ণয় করুন",
    step5Desc: "খরচ ও রিপোর্ট: শেষে সম্পূর্ণ খরচ এবং রিপোর্ট তৈরি করুন",
    quickStart: "এখনই শুরু করুন",
    quickStartDesc: "পুকুরের পরিমাপ থেকে শুরু করে সম্পূর্ণ চক্র সম্পন্ন করুন",
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
    details: "Details",
    viewDetails: "View Details",
    
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
    loginSignup: "Login / Signup",
    adminPanel: "Admin Panel",
    allModules: "All Modules",
    pondMeasurement: "Pond Measurement",
    marketPrice: "Market Price",
    
    // App Branding
    appTitle: "Fish Management",
    appSubtitle: "Scientific Fish Farming",
    forBangladesh: "For Bangladesh Fisheries Sector",
    
    // Dashboard
    welcomeBack: "Welcome Back",
    welcome: "Welcome",
    myPond: "My Pond",
    income: "Income",
    expense: "Expense",
    reports: "Reports",
    backup: "Backup",
    totalIncome: "Total Income",
    totalExpense: "Total Expense",
    profitLoss: "Profit/Loss",
    pondCount: "Number of Ponds",
    totalArea: "Total Area",
    totalFish: "Total Fish",
    pondSummary: "Pond Summary",
    pondName: "Pond Name",
    recentIncome: "Recent Income",
    recentExpense: "Recent Expense",
    noPondAdded: "No pond added yet",
    viewSummary: "View your fish farming summary",
    status: "Status",
    action: "Action",
    active: "Active",
    harvestComplete: "Harvest Complete",
    preparation: "Preparation",
    empty: "Empty",
    
    // Modules
    pondCalculator: "Pond Measurement",
    fishStocking: "Fish Stocking Density",
    feedManagement: "Feed Management",
    waterQuality: "Water Quality",
    fishAdvice: "Fish Advice",
    medicineApplication: "Medicine Application",
    fertilizerCalculator: "Fertilizer Application",
    biomassCalculator: "Biomass Calculator",
    stockingDensity: "Stocking Density",
    costCalculator: "Cost Calculator",
    fisheriesContact: "Fisheries Contact",
    reportGeneration: "Report Generation",
    
    // Module Descriptions
    pondCalculatorDesc: "Accurately calculate pond area and water volume",
    fishStockingDesc: "Calculate how many fingerlings to stock in the pond",
    feedManagementDesc: "Calculate daily feed quantity and FCR",
    waterQualityDesc: "Check water pH, oxygen and other parameters",
    fishAdviceDesc: "Get solutions to all fish farming problems through AI",
    medicineApplicationDesc: "Determine medicine dosage for disease prevention and treatment",
    fertilizerCalculatorDesc: "Apply correct fertilizer to increase pond productivity",
    biomassCalculatorDesc: "Calculate total fish weight and growth rate",
    stockingDensityDesc: "Plan fish stocking with complete costs and materials",
    costCalculatorDesc: "Calculate complete cost and profit/loss of fish farming",
    reportGenerationDesc: "View all farm information together in report format",
    
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
    decimal: "Decimal",
    
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
    discount: "Discount",
    allProducts: "All Products",
    productsForFishing: "All products for fish farming",
    noProductFound: "No products found",
    searchPlaceholder: "Search by product name, category or company...",
    priceFilter: "Price Filter",
    resetFilters: "Clear All Filters",
    applyFilter: "Apply",
    productsFound: "products found",
    
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
    
    // Homepage
    heroTagline: "For Bangladesh Fisheries Sector",
    heroTitle: "Scientific Fish Farming Management System",
    heroDescription: "Make your fish farming more profitable and sustainable using modern technology. Make the right decisions at every step from pond to market using completely scientific methods.",
    startNow: "Start Now",
    integratedModules: "Integrated Calculator Modules",
    integratedModulesDesc: "Each module is interconnected and shares data with each other, helping you with complete farm management",
    whyUseSystem: "Why use this system?",
    scientificMethod: "Scientific Method",
    scientificMethodDesc: "Built following research-based formulas and international standards",
    resourceOptimization: "Resource Optimization",
    resourceOptimizationDesc: "Reduce costs by preventing waste of feed, medicine and fertilizer",
    productivityIncrease: "Productivity Increase",
    productivityIncreaseDesc: "Produce more fish per hectare with proper management",
    easyToUse: "Easy to Use",
    easyToUseDesc: "Simple interface in Bengali language with clear instructions",
    startManagement: "Start Your Fish Farming Management",
    startManagementDesc: "Complete the full cycle starting from pond measurement",
    startPondMeasurement: "Start Pond Measurement",
    
    // Modules Page
    yourProgress: "Your Progress",
    pondInfoSaved: "Pond information saved",
    pondNotMeasured: "Pond measurement not done yet",
    fishStockInfoSaved: "Fish stock information saved",
    fishStockNotCalculated: "Fish stocking density not calculated",
    workflowGuide: "Workflow Guide",
    workflowGuideDesc: "Use modules in this order for best results",
    step1Desc: "Pond Measurement: First determine the pond volume - this is the basis for all other calculations",
    step2Desc: "Fish Stocking: Determine the number of fish according to pond volume",
    step3Desc: "Biomass & Feed: Calculate fish weight and feed quantity",
    step4Desc: "Medicine & Fertilizer: Determine correct dosage using pond volume",
    step5Desc: "Cost & Report: Finally create complete cost and report",
    quickStart: "Start Now",
    quickStartDesc: "Complete the full cycle starting from pond measurement",
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
