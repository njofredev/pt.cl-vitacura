'use client';

import React, { createContext, useContext, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationPreloadContextType {
  isNavigating: boolean;
  targetPath: string | null;
  startPreloadNavigation: (path: string) => void;
}

const NavigationPreloadContext = createContext<NavigationPreloadContextType>({
  isNavigating: false,
  targetPath: null,
  startPreloadNavigation: () => {},
});

export function NavigationPreloadProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const router = useRouter();

  const startPreloadNavigation = (path: string) => {
    setTargetPath(path);
    startTransition(() => {
      router.push(path);
    });
  };

  return (
    <NavigationPreloadContext.Provider
      value={{
        isNavigating: isPending,
        targetPath: isPending ? targetPath : null,
        startPreloadNavigation,
      }}
    >
      {children}
    </NavigationPreloadContext.Provider>
  );
}

export function useNavigationPreload() {
  return useContext(NavigationPreloadContext);
}
