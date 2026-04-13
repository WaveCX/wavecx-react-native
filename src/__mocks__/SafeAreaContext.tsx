import React from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

type SafeAreaViewProps = ViewProps & {
  children?: ReactNode;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
};

export function SafeAreaProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function SafeAreaView({
  children,
  edges: _edges,
  ...props
}: SafeAreaViewProps) {
  return <View {...props}>{children}</View>;
}
