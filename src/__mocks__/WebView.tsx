import React from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';

type WebViewMessageEvent = { nativeEvent: { data: string } };

type WebViewProps = {
  source?: { uri: string };
  onMessage?: (event: WebViewMessageEvent) => void;
};

// Renders a host element carrying onMessage so tests can drive the content bridge with
// fireEvent(getByTestId('wavecx-webview'), 'message', ...). View has no onMessage in its
// prop types, but the testing library resolves handlers by prop name at runtime. source is
// passed through so tests can assert on the loaded URL.
// noinspection JSUnusedGlobalSymbols
export default function WebView({ source, onMessage }: WebViewProps) {
  const props = { testID: 'wavecx-webview', source, onMessage } as ViewProps;
  return <View {...props} />;
}
