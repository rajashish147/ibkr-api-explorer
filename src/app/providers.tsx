'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function EnvironmentInitializer({ children }: { children: React.ReactNode }) {
  const { initDefaults } = useEnvironmentStore();

  useEffect(() => {
    initDefaults();
  }, [initDefaults]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
        <EnvironmentInitializer>
          {children}
        </EnvironmentInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
