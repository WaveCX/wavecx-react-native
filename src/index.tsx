import * as React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView from 'react-native-webview';

import {
  composeFireTargetedContentEventViaApi,
  type TargetedContent,
  type FireTargetedContentEvent,
} from './targeted-content';
import {
  type InitiateSession,
  readSessionToken,
  storeSessionToken,
  clearSessionToken,
} from './sessions';

export type Event =
  | {
      type: 'session-started';
      userId: string;
      userIdVerification?: string;
      userAttributes?: object;
    }
  | { type: 'session-ended' }
  | {
      type: 'trigger-point';
      triggerPoint: string;
      onContentDismissed?: () => void;
    }
  | {
      type: 'user-triggered-content';
      onContentDismissed?: () => void;
    };

export type EventHandler = (event: Event) => void;

export type ContentFetchStrategy = 'session-start' | 'trigger-point';

/**
 * @property preventDefault prevents default link handling/opening
 * @property dismissContent closes any open content
 */
export type LinkRequestHandlerCallbacks = {
  preventDefault: () => void;
  dismissContent: () => void;
};

export type LinkRequestHandler = (
  url: string,
  callbacks: LinkRequestHandlerCallbacks
) => void;

type WaveCxContext = {
  handleEvent: EventHandler;
  hasUserTriggeredContent: boolean;
};

const WaveCxContext = createContext<WaveCxContext | undefined>(undefined);

export const WaveCxProvider = (props: {
  organizationCode: string;
  children?: ReactNode;
  apiBaseUrl?: string;
  recordEvent?: FireTargetedContentEvent;
  onLinkRequested?: LinkRequestHandler;
  contentFetchStrategy?: ContentFetchStrategy;
  initiateSession?: InitiateSession;
}) => {
  const stateRef = useRef({
    isContentLoading: false,
    eventQueue: [] as Event[],
    contentCache: [] as TargetedContent[],
  });

  const recordEvent = useMemo(
    () =>
      props.recordEvent ??
      composeFireTargetedContentEventViaApi({
        apiBaseUrl: props.apiBaseUrl ?? 'https://api.wavecx.com',
      }),
    [props.recordEvent, props.apiBaseUrl]
  );

  const onContentDismissedCallback = useRef<(() => void) | undefined>(
    undefined
  );

  const [activePopupContent, setActivePopupContent] = useState<
    TargetedContent | undefined
  >(undefined);
  const [activeUserTriggeredContent, setActiveUserTriggeredContent] = useState<
    TargetedContent | undefined
  >(undefined);
  const [isUserTriggeredContentShown, setIsUserTriggeredContentShown] =
    useState(false);
  const [isRemoteContentReady, setIsRemoteContentReady] = useState(false);

  const presentedContentItem =
    activePopupContent ??
    (isUserTriggeredContentShown ? activeUserTriggeredContent : undefined);

  const { initiateSession, organizationCode } = props;

  const handleEvent = useCallback<EventHandler>(
    async (event) => {
      onContentDismissedCallback.current = undefined;

      if (event.type === 'session-started') {
        stateRef.current.contentCache = [];

        const sessionToken = readSessionToken();
        if (sessionToken) {
          try {
            stateRef.current.isContentLoading = true;
            const targetedContentResult = await recordEvent({
              organizationCode: organizationCode,
              type: 'session-refresh',
              sessionToken: sessionToken,
              userId: event.userId,
            });
            stateRef.current.contentCache = targetedContentResult.content;
          } catch {}
          stateRef.current.isContentLoading = false;
          if (stateRef.current.eventQueue.length > 0) {
            stateRef.current.eventQueue.forEach((e) => handleEvent(e));
            stateRef.current.eventQueue = [];
          }
          return;
        }

        if (initiateSession) {
          try {
            stateRef.current.isContentLoading = true;
            const sessionResult = await initiateSession({
              organizationCode: organizationCode,
              userId: event.userId,
              userIdVerification: event.userIdVerification,
              userAttributes: event.userAttributes,
            });
            storeSessionToken(sessionResult.sessionToken);
            const targetedContentResult = await recordEvent({
              organizationCode: organizationCode,
              type: 'session-refresh',
              sessionToken: sessionResult.sessionToken,
              userId: event.userId,
            });
            stateRef.current.contentCache = targetedContentResult.content;
          } catch {}
          stateRef.current.isContentLoading = false;
          if (stateRef.current.eventQueue.length > 0) {
            stateRef.current.eventQueue.forEach((e) => handleEvent(e));
            stateRef.current.eventQueue = [];
          }
        } else {
          stateRef.current.isContentLoading = true;
          try {
            const targetedContentResult = await recordEvent({
              type: 'session-started',
              organizationCode: organizationCode,
              userId: event.userId,
              userIdVerification: event.userIdVerification,
              userAttributes: event.userAttributes,
            });
            stateRef.current.contentCache = targetedContentResult.content;
          } catch {}
          stateRef.current.isContentLoading = false;
          if (stateRef.current.eventQueue.length > 0) {
            stateRef.current.eventQueue.forEach((e) => handleEvent(e));
            stateRef.current.eventQueue = [];
          }
        }
      } else if (event.type === 'session-ended') {
        stateRef.current.contentCache = [];
        setActivePopupContent(undefined);
        setActiveUserTriggeredContent(undefined);
        clearSessionToken();
      } else if (event.type === 'user-triggered-content') {
        setIsUserTriggeredContentShown(true);
        onContentDismissedCallback.current = event.onContentDismissed;
      } else if (event.type === 'trigger-point') {
        setActivePopupContent(undefined);
        setActiveUserTriggeredContent(undefined);
        onContentDismissedCallback.current = event.onContentDismissed;

        if (stateRef.current.isContentLoading) {
          stateRef.current.eventQueue.push(event);
          return;
        }

        onContentDismissedCallback.current = event.onContentDismissed;
        setActivePopupContent(
          stateRef.current.contentCache.filter(
            (c) =>
              c.triggerPoint === event.triggerPoint &&
              c.presentationType === 'popup'
          )[0]
        );
        stateRef.current.contentCache = stateRef.current.contentCache.filter(
          (c) =>
            c.triggerPoint !== event.triggerPoint ||
            c.presentationType !== 'popup'
        );
        setActiveUserTriggeredContent(
          stateRef.current.contentCache.filter(
            (c) =>
              c.triggerPoint === event.triggerPoint &&
              c.presentationType === 'button-triggered'
          )[0]
        );
      }
    },
    [organizationCode, initiateSession, recordEvent]
  );

  const dismissContent = () => {
    setIsUserTriggeredContentShown(false);
    setActivePopupContent(undefined);
    setIsRemoteContentReady(false);
    onContentDismissedCallback.current?.();
  };

  return (
    <WaveCxContext.Provider
      value={{
        handleEvent,
        hasUserTriggeredContent: activeUserTriggeredContent !== undefined,
      }}
    >
      <Modal
        visible={presentedContentItem !== undefined}
        presentationStyle={
          presentedContentItem?.mobileModal?.type ?? 'pageSheet'
        }
        onRequestClose={dismissContent}
        animationType={'slide'}
      >
        {presentedContentItem && (
          <>
            {presentedContentItem.mobileModal?.type !== 'overFullScreen' && (
              <View
                style={{
                  ...styles.header,
                  backgroundColor:
                    presentedContentItem.mobileModal?.headerColor,
                }}
              >
                <View style={styles.headerStart} />
                <View>
                  <Text style={styles.headerTitle}>
                    {presentedContentItem.mobileModal?.title ?? `What's New`}
                  </Text>
                </View>
                <View style={styles.closeButtonContainer}>
                  <Pressable onPress={dismissContent} aria-label={'Close'}>
                    {presentedContentItem.mobileModal?.closeButton.style ===
                      'x' && (
                      <View style={styles.close}>
                        <View style={styles.closeIcon1} />
                        <View style={styles.closeIcon2} />
                      </View>
                    )}
                    {presentedContentItem.mobileModal?.closeButton.style !==
                      'x' && (
                      <Text>
                        {presentedContentItem.mobileModal?.closeButton.style ===
                          'text' &&
                          presentedContentItem.mobileModal?.closeButton.label}
                        {!presentedContentItem.mobileModal && 'Close'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
            {presentedContentItem.mobileModal?.type === 'overFullScreen' && (
              <SafeAreaView
                style={{
                  backgroundColor:
                    presentedContentItem.mobileModal?.headerColor,
                }}
              >
                <View
                  style={{
                    ...styles.header,
                    backgroundColor:
                      presentedContentItem.mobileModal?.headerColor,
                  }}
                >
                  <View style={styles.headerStart} />
                  <View>
                    <Text style={styles.headerTitle}>
                      {presentedContentItem.mobileModal?.title ?? `What's New`}
                    </Text>
                  </View>
                  <View style={styles.closeButtonContainer}>
                    <Pressable onPress={dismissContent} aria-label={'Close'}>
                      {presentedContentItem.mobileModal?.closeButton.style ===
                        'x' && (
                        <View style={styles.close}>
                          <View style={styles.closeIcon1} />
                          <View style={styles.closeIcon2} />
                        </View>
                      )}
                      {presentedContentItem.mobileModal?.closeButton.style !==
                        'x' && (
                        <Text>
                          {presentedContentItem.mobileModal?.closeButton
                            .style === 'text' &&
                            presentedContentItem.mobileModal?.closeButton.label}
                          {!presentedContentItem.mobileModal && 'Close'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </SafeAreaView>
            )}

            {!isRemoteContentReady && (
              <ActivityIndicator style={styles.loadingIndicator} />
            )}

            <WebView
              source={{ uri: presentedContentItem.viewUrl }}
              style={!isRemoteContentReady ? styles.hidden : undefined}
              onLoad={() => setIsRemoteContentReady(true)}
              onMessage={(message) => {
                try {
                  const messageData = JSON.parse(message.nativeEvent.data);
                  if (messageData.type === 'link-requested') {
                    let isDefaultPrevented = false;
                    props.onLinkRequested?.(messageData.url, {
                      dismissContent,
                      preventDefault: () => {
                        isDefaultPrevented = true;
                      },
                    });

                    if (!isDefaultPrevented) {
                      Linking.openURL(messageData.url);
                    }
                  }
                } catch {}
              }}
            />
          </>
        )}
      </Modal>

      {props.children}
    </WaveCxContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: '10%',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fafafa',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  closeButtonContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-end',
  },
  close: {
    width: 20,
    height: 20,
  },
  closeIcon1: {
    position: 'absolute',
    top: 0,
    left: 9,
    height: 20,
    width: 2,
    borderRadius: 2,
    backgroundColor: '#222',
    transform: 'rotate(45deg)',
  },
  closeIcon2: {
    position: 'absolute',
    top: 0,
    left: 9,
    height: 20,
    width: 2,
    borderRadius: 2,
    backgroundColor: '#222',
    transform: 'rotate(-45deg)',
  },
  headerStart: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
});

export const useWaveCx = () => {
  const context = useContext(WaveCxContext);
  if (!context) {
    throw new Error(
      `${useWaveCx.name} must be used in a WaveCx context provider`
    );
  }
  return context;
};
