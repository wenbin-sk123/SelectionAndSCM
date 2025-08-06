import { create } from "zustand";

interface KPIData {
  currentBalance: number;
  totalRevenue: number;
  totalProfit: number;
  inventoryValue: number;
  taskProgress: number;
}

interface DashboardState {
  kpis: KPIData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  setKPIs: (kpis: KPIData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateKPI: (key: keyof KPIData, value: number) => void;
  refreshKPIs: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  kpis: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  setKPIs: (kpis) => 
    set({ 
      kpis, 
      lastUpdated: new Date(),
      error: null 
    }),
  
  setLoading: (loading) => 
    set({ isLoading: loading }),
  
  setError: (error) => 
    set({ error, isLoading: false }),
  
  updateKPI: (key, value) => 
    set((state) => ({
      kpis: state.kpis ? { ...state.kpis, [key]: value } : null,
      lastUpdated: new Date(),
    })),
  
  refreshKPIs: async () => {
    const { setLoading, setError, setKPIs } = get();
    setLoading(true);
    
    try {
      const response = await fetch("/api/dashboard/kpis?taskId=default", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setKPIs(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch KPIs");
    } finally {
      setLoading(false);
    }
  },
}));
