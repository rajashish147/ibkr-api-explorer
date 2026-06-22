import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HistoryEntry } from '@/types/response';
import { generateId } from '@/lib/utils';

interface HistoryState {
  entries: HistoryEntry[];
  maxEntries: number;

  addEntry: (entry: Omit<HistoryEntry, 'id'>) => string;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  setMaxEntries: (max: number) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      maxEntries: 500,

      addEntry: (entry) => {
        const id = generateId();
        set((state) => {
          const entries = [{ ...entry, id }, ...state.entries].slice(0, state.maxEntries);
          return { entries };
        });
        return id;
      },

      removeEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

      clearHistory: () => set({ entries: [] }),

      setMaxEntries: (max) =>
        set((state) => ({
          maxEntries: max,
          entries: state.entries.slice(0, max),
        })),
    }),
    {
      name: 'ibkr-history-store',
      partialize: (state) => ({
        entries: state.entries.slice(0, 100).map((e) => ({
          ...e,
          response: e.response
            ? { ...e.response, rawBody: e.response.rawBody.slice(0, 10000) }
            : undefined,
        })),
        maxEntries: state.maxEntries,
      }),
    }
  )
);
