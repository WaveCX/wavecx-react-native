import React from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export function SafeAreaProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function SafeAreaView({
  children,
  ...props
}: { children?: ReactNode } & Record<string, unknown>) {
  return <View {...props}>{children}</View>;
}
