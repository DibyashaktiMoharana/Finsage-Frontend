'use client';

import React from 'react';
import { Theme } from '@carbon/react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <Theme theme="white">
      {children}
    </Theme>
  );
}
