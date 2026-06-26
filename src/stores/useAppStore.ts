import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SidebarTab = 'collections' | 'endpoints' | 'history' | 'favorites' | 'environments';
type ActivePanel = 'explorer' | 'runner' | 'marketdata' | 'contracts' | 'orders' | 'futures' | 'portfolio';

interface AppState {
  sidebarTab: SidebarTab;
  activePanel: ActivePanel;
  sidebarWidth: number;
  rightPanelWidth: number;
  isImportOpen: boolean;
  isEnvironmentOpen: boolean;
  isCollectionManagerOpen: boolean;
  isRunnerOpen: boolean;
  theme: 'dark' | 'light';

  setSidebarTab: (tab: SidebarTab) => void;
  setActivePanel: (panel: ActivePanel) => void;
  setSidebarWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setImportOpen: (open: boolean) => void;
  setEnvironmentOpen: (open: boolean) => void;
  setCollectionManagerOpen: (open: boolean) => void;
  setRunnerOpen: (open: boolean) => void;
  setDeveloperMode: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarTab: 'endpoints',
      activePanel: 'explorer',
      sidebarWidth: 320,
      rightPanelWidth: 480,
      isImportOpen: false,
      isEnvironmentOpen: false,
      isCollectionManagerOpen: false,
      isRunnerOpen: false,
      isDeveloperMode: false,
      theme: 'dark',

      setSidebarTab: (tab) => set({ sidebarTab: tab }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(240, Math.min(480, width)) }),
      setRightPanelWidth: (width) => set({ rightPanelWidth: Math.max(320, Math.min(800, width)) }),
      setImportOpen: (open) => set({ isImportOpen: open }),
      setEnvironmentOpen: (open) => set({ isEnvironmentOpen: open }),
      setCollectionManagerOpen: (open) => set({ isCollectionManagerOpen: open }),
      setRunnerOpen: (open) => set({ isRunnerOpen: open }),
      setDeveloperMode: (enabled) => set({ isDeveloperMode: enabled }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ibkr-app-store' }
  )
);
