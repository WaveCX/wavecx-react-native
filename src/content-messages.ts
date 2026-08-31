/**
 * Messages posted by WaveCX content (rendered in the modal WebView) to the host app via
 * `window.ReactNativeWebView.postMessage`. Shared contract with the web SDK -- keep the
 * shapes identical across both so content emits one payload for every platform.
 */

export const contentMessageSource = 'wavecx';

export type DismissContentMessage = {
  source: typeof contentMessageSource;
  type: 'dismiss-content';
  reason?: 'no-show-again' | 'view-later' | 'user-closed';
  /**
   * Drops this content from the in-memory session cache so entry points stop offering it.
   * Durable suppression is recorded server-side by the content itself.
   */
  suppressForSession?: boolean;
};

export type ContentMessage = DismissContentMessage;

export const isDismissContentMessage = (
  data: unknown
): data is DismissContentMessage => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const message = data as Partial<DismissContentMessage>;
  return (
    message.source === contentMessageSource &&
    message.type === 'dismiss-content'
  );
};
