'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  // Prevent hydration mismatch by optionally not rendering until mounted
  // or just render children directly. Since it's just CSS, rendering children directly is usually fine.
  return <>{children}</>;
}
