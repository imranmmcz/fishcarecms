import { createContext, useContext, useState, ReactNode } from "react";

interface PondData {
  area: number;
  volume: number;
  depth: number;
  shape: string;
  unit: string;
}

interface FishStockingData {
  totalFish: number;
  density: number;
  species: string[];
}

interface FarmingContextType {
  pondData: PondData | null;
  fishStockingData: FishStockingData | null;
  setPondData: (data: PondData) => void;
  setFishStockingData: (data: FishStockingData) => void;
  clearAllData: () => void;
}

const FarmingContext = createContext<FarmingContextType | undefined>(undefined);

export const FarmingProvider = ({ children }: { children: ReactNode }) => {
  const [pondData, setPondDataState] = useState<PondData | null>(() => {
    const saved = localStorage.getItem("farmingPondData");
    return saved ? JSON.parse(saved) : null;
  });

  const [fishStockingData, setFishStockingDataState] = useState<FishStockingData | null>(() => {
    const saved = localStorage.getItem("farmingFishStockingData");
    return saved ? JSON.parse(saved) : null;
  });

  const setPondData = (data: PondData) => {
    setPondDataState(data);
    localStorage.setItem("farmingPondData", JSON.stringify(data));
  };

  const setFishStockingData = (data: FishStockingData) => {
    setFishStockingDataState(data);
    localStorage.setItem("farmingFishStockingData", JSON.stringify(data));
  };

  const clearAllData = () => {
    setPondDataState(null);
    setFishStockingDataState(null);
    localStorage.removeItem("farmingPondData");
    localStorage.removeItem("farmingFishStockingData");
  };

  return (
    <FarmingContext.Provider
      value={{
        pondData,
        fishStockingData,
        setPondData,
        setFishStockingData,
        clearAllData,
      }}
    >
      {children}
    </FarmingContext.Provider>
  );
};

export const useFarming = () => {
  const context = useContext(FarmingContext);
  if (context === undefined) {
    throw new Error("useFarming must be used within a FarmingProvider");
  }
  return context;
};
