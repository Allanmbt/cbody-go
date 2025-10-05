import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode="light">{children}</GluestackUIProvider>
    </QueryClientProvider>
  );
}
