import { createContext, useContext, ReactNode } from "react";

interface DashboardContextType {
  refreshDashboard: () => Promise<void>;
  isRefreshing: boolean;
  refreshTrigger: number;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    // Return a no-op function if context is not available
    return {
      refreshDashboard: async () => {},
      isRefreshing: false,
      refreshTrigger: 0,
    };
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
  refreshDashboard: () => Promise<void>;
  isRefreshing: boolean;
  refreshTrigger: number;
}

export function DashboardProvider({ children, refreshDashboard, isRefreshing, refreshTrigger }: DashboardProviderProps) {
  return (
    <DashboardContext.Provider value={{ refreshDashboard, isRefreshing, refreshTrigger }}>
      {children}
    </DashboardContext.Provider>
  );
}
