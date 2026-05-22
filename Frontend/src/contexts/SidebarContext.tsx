import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  toggleMinimized: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimized = () => setIsMinimized(!isMinimized);

  return (
    <SidebarContext.Provider value={{ isMinimized, setIsMinimized, toggleMinimized }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}