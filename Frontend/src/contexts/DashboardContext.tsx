import { createContext, useContext, ReactNode } from "react";

interface DashboardContextType {
  refreshDashboard: () => Promise<void>;
  isRefreshing: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    // Return a no-op function if context is not available
    return {
      refreshDashboard: async () => {},
      isRefreshing: false,
    };
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
  refreshDashboard: () => Promise<void>;
  isRefreshing: boolean;
}

export function DashboardProvider({ children, refreshDashboard, isRefreshing }: DashboardProviderProps) {
  return (
    <DashboardContext.Provider value={{ refreshDashboard, isRefreshing }}>
      {children}
    </DashboardContext.Provider>
  );
}
