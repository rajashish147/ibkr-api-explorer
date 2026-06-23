'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useEffect } from 'react';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { useOpenApiParser } from '@/hooks/useOpenApiParser';
import { useOpenApiStore } from '@/stores/useOpenApiStore';

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
  const endpoints = useEndpointStore((state) => state.endpoints);
  const specs = useOpenApiStore((state) => state.specs);
  const { parseFromUrl } = useOpenApiParser();

  useEffect(() => {
    initDefaults();
  }, [initDefaults]);

  useEffect(() => {
    if (specs.length > 0 || endpoints.length > 0) return;

    void parseFromUrl('/api/openapi');
  }, [endpoints.length, parseFromUrl, specs.length]);

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
