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

/**
 * Query param content reads to learn which content messages this SDK acts on, so it can hide
 * controls an older SDK would ignore (e.g. a close button). Shared contract with the web SDK.
 */
export const contentCapabilitiesParam = 'wcxCapabilities';
export const contentCapabilities = ['dismiss-content'] as const;

/**
 * Appends this SDK's capabilities to a content URL. Apply it when loading content, never to
 * the cached URL: session suppression matches cache entries on the exact viewUrl. Built with
 * string handling because React Native's URL does not implement searchParams.
 */
export const withContentCapabilities = (viewUrl: string): string => {
  if (!/^https?:\/\//i.test(viewUrl)) {
    return viewUrl;
  }
  const hashIndex = viewUrl.indexOf('#');
  const base = hashIndex === -1 ? viewUrl : viewUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : viewUrl.slice(hashIndex);
  const separator = !base.includes('?') ? '?' : /[?&]$/.test(base) ? '' : '&';
  const value = encodeURIComponent(contentCapabilities.join(','));
  return `${base}${separator}${contentCapabilitiesParam}=${value}${hash}`;
};
