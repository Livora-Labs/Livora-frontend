"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Instancia singleton de QueryClient con políticas de caché SWR.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos de frescura de datos (SWR)
      gcTime: 1000 * 60 * 5, // 5 minutos de retención en memoria
      refetchOnWindowFocus: false, // Previene parpadeos innecesarios al alternar pestañas
      retry: 1, // 1 reintento automático en caso de fallo de red
    },
    mutations: {
      retry: 0, // Las mutaciones no deben reintentarse automáticamente
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}
