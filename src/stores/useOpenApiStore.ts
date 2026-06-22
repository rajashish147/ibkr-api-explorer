import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OpenApiSpec } from '@/types/openapi';
import { idbStorage } from '@/lib/idb-storage';
interface ImportedSpec {
  id: string;
  name: string;
  source: 'file' | 'url' | 'paste';
  sourceUrl?: string;
  rawContent: string;
  spec: OpenApiSpec;
  importedAt: number;
  endpointCount: number;
  isActive: boolean;
}

interface OpenApiState {
  specs: ImportedSpec[];
  activeSpecId: string | null;

  addSpec: (spec: Omit<ImportedSpec, 'id'>) => string;
  removeSpec: (id: string) => void;
  setActiveSpec: (id: string | null) => void;
  updateSpec: (id: string, updates: Partial<ImportedSpec>) => void;
  clearAll: () => void;
  getActiveSpec: () => ImportedSpec | null;
}

export const useOpenApiStore = create<OpenApiState>()(
  persist(
    (set, get) => ({
      specs: [],
      activeSpecId: null,

      addSpec: (spec) => {
        const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        set((state) => ({
          specs: [...state.specs, { ...spec, id }],
          activeSpecId: id,
        }));
        return id;
      },

      removeSpec: (id) => {
        set((state) => ({
          specs: state.specs.filter((s) => s.id !== id),
          activeSpecId: state.activeSpecId === id ? (state.specs[0]?.id ?? null) : state.activeSpecId,
        }));
      },

      setActiveSpec: (id) => set({ activeSpecId: id }),

      updateSpec: (id, updates) => {
        set((state) => ({
          specs: state.specs.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },

      clearAll: () => set({ specs: [], activeSpecId: null }),

      getActiveSpec: () => {
        const { specs, activeSpecId } = get();
        return specs.find((s) => s.id === activeSpecId) ?? null;
      },
    }),
    {
      name: 'ibkr-openapi-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        specs: state.specs,
        activeSpecId: state.activeSpecId,
      }),
    }
  )
);
