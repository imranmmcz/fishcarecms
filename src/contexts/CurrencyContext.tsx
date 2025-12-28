import { createContext, useContext, useState, ReactNode } from "react";

export type CurrencyCode = "BDT" | "USD" | "EUR" | "GBP" | "INR" | "JPY" | "CNY" | "AED" | "SAR" | "MYR";

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameBn: string;
  rate: number; // Rate relative to BDT (base currency)
}

export const currencies: Record<CurrencyCode, CurrencyInfo> = {
  BDT: {
    code: "BDT",
    symbol: "৳",
    name: "Bangladeshi Taka",
    nameBn: "বাংলাদেশি টাকা",
    rate: 1,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    nameBn: "মার্কিন ডলার",
    rate: 0.0091, // 1 BDT = 0.0091 USD
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    nameBn: "ইউরো",
    rate: 0.0084,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    nameBn: "ব্রিটিশ পাউন্ড",
    rate: 0.0072,
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    nameBn: "ভারতীয় রুপি",
    rate: 0.76,
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    nameBn: "জাপানি ইয়েন",
    rate: 1.36,
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    nameBn: "চীনা ইউয়ান",
    rate: 0.066,
  },
  AED: {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    nameBn: "আরব আমিরাত দিরহাম",
    rate: 0.033,
  },
  SAR: {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    nameBn: "সৌদি রিয়াল",
    rate: 0.034,
  },
  MYR: {
    code: "MYR",
    symbol: "RM",
    name: "Malaysian Ringgit",
    nameBn: "মালয়েশিয়ান রিংগিত",
    rate: 0.040,
  },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencyInfo: CurrencyInfo;
  formatPrice: (priceInBDT: number) => string;
  convertPrice: (priceInBDT: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem("appCurrency");
    return (saved as CurrencyCode) || "BDT";
  });

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    localStorage.setItem("appCurrency", curr);
  };

  const currencyInfo = currencies[currency];

  const convertPrice = (priceInBDT: number): number => {
    return priceInBDT * currencyInfo.rate;
  };

  const formatPrice = (priceInBDT: number): string => {
    const convertedPrice = convertPrice(priceInBDT);
    
    // Format based on currency
    const formatted = new Intl.NumberFormat(currency === "BDT" ? "bn-BD" : "en-US", {
      minimumFractionDigits: currency === "JPY" ? 0 : 2,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(convertedPrice);

    return `${currencyInfo.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyInfo,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
