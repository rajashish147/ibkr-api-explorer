import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Environment, EnvironmentVariable, DEFAULT_IBKR_ENVIRONMENTS } from '@/types/environment';
import { generateId } from '@/lib/utils';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;

  addEnvironment: (env: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>) => string;
  removeEnvironment: (id: string) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  setActiveEnvironment: (id: string | null) => void;
  getActiveEnvironment: () => Environment | null;
  getActiveVariables: () => EnvironmentVariable[];
  addVariable: (envId: string, variable: Omit<EnvironmentVariable, 'id'>) => void;
  updateVariable: (envId: string, variableId: string, updates: Partial<EnvironmentVariable>) => void;
  removeVariable: (envId: string, variableId: string) => void;
  setVariableValue: (key: string, value: string) => void;
  initDefaults: () => void;
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      environments: [],
      activeEnvironmentId: null,

      addEnvironment: (env) => {
        const id = generateId();
        const now = Date.now();
        set((state) => ({
          environments: [
            ...state.environments,
            { ...env, id, createdAt: now, updatedAt: now },
          ],
          activeEnvironmentId: state.activeEnvironmentId ?? id,
        }));
        return id;
      },

      removeEnvironment: (id) => {
        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
          activeEnvironmentId:
            state.activeEnvironmentId === id
              ? (state.environments.find((e) => e.id !== id)?.id ?? null)
              : state.activeEnvironmentId,
        }));
      },

      updateEnvironment: (id, updates) => {
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          ),
        }));
      },

      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

      getActiveEnvironment: () => {
        const { environments, activeEnvironmentId } = get();
        return environments.find((e) => e.id === activeEnvironmentId) ?? null;
      },

      getActiveVariables: () => {
        const env = get().getActiveEnvironment();
        return env?.variables ?? [];
      },

      addVariable: (envId, variable) => {
        const id = generateId();
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === envId
              ? { ...e, variables: [...e.variables, { ...variable, id }], updatedAt: Date.now() }
              : e
          ),
        }));
      },

      updateVariable: (envId, variableId, updates) => {
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === envId
              ? {
                  ...e,
                  variables: e.variables.map((v) =>
                    v.id === variableId ? { ...v, ...updates } : v
                  ),
                  updatedAt: Date.now(),
                }
              : e
          ),
        }));
      },

      removeVariable: (envId, variableId) => {
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === envId
              ? { ...e, variables: e.variables.filter((v) => v.id !== variableId), updatedAt: Date.now() }
              : e
          ),
        }));
      },

      setVariableValue: (key, value) => {
        const { activeEnvironmentId, environments } = get();
        if (!activeEnvironmentId) return;
        set({
          environments: environments.map((e) => {
            if (e.id !== activeEnvironmentId) return e;
            const existing = e.variables.find((v) => v.key === key);
            if (existing) {
              return {
                ...e,
                variables: e.variables.map((v) => (v.key === key ? { ...v, value, source: 'Auto-extracted', updatedAt: Date.now() } : v)),
                updatedAt: Date.now(),
              };
            } else {
              return {
                ...e,
                variables: [
                  ...e.variables,
                  { id: generateId(), key, value, description: 'Auto-extracted variable', enabled: true, sensitive: false, source: 'Auto-extracted', updatedAt: Date.now() },
                ],
                updatedAt: Date.now(),
              };
            }
          }),
        });
      },

      initDefaults: () => {
        const { environments } = get();
        if (environments.length === 0) {
          const now = Date.now();
          const defaultEnvs: Environment[] = DEFAULT_IBKR_ENVIRONMENTS.map((e, i) => ({
            ...e,
            id: generateId(),
            createdAt: now + i,
            updatedAt: now + i,
          }));
          set({
            environments: defaultEnvs,
            activeEnvironmentId: defaultEnvs[0].id,
          });
        }
      },
    }),
    { name: 'ibkr-environment-store' }
  )
);
