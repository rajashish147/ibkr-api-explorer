import { create } from 'zustand';
import { ApiResponse, ResponseStatus, ConsoleLog } from '@/types/response';
import { generateId } from '@/lib/utils';

interface ResponseState {
  response: ApiResponse | null;
  status: ResponseStatus;
  activeTab: 'pretty' | 'raw' | 'headers' | 'schema' | 'console';
  consoleLogs: ConsoleLog[];
  abortController: AbortController | null;

  setResponse: (response: ApiResponse) => void;
  setStatus: (status: ResponseStatus) => void;
  setActiveTab: (tab: ResponseState['activeTab']) => void;
  clearResponse: () => void;
  addLog: (level: ConsoleLog['level'], message: string, data?: unknown) => void;
  clearLogs: () => void;
  setAbortController: (controller: AbortController | null) => void;
  abort: () => void;
}

export const useResponseStore = create<ResponseState>()((set, get) => ({
  response: null,
  status: 'idle',
  activeTab: 'pretty',
  consoleLogs: [],
  abortController: null,

  setResponse: (response) => set({ response }),

  setStatus: (status) => set({ status }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  clearResponse: () => set({ response: null, status: 'idle', consoleLogs: [] }),

  addLog: (level, message, data) => {
    const log: ConsoleLog = { id: generateId(), level, message, timestamp: Date.now(), data };
    set((state) => ({ consoleLogs: [...state.consoleLogs, log] }));
  },

  clearLogs: () => set({ consoleLogs: [] }),

  setAbortController: (controller) => set({ abortController: controller }),

  abort: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, status: 'idle' });
    }
  },
}));
