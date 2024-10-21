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
}) => {
  const recordEvent = useMemo(
    () =>
      props.recordEvent ??
      composeFireTargetedContentEventViaApi({
        apiBaseUrl: props.apiBaseUrl ?? 'https://api.wavecx.com',
      }),
    [props.recordEvent, props.apiBaseUrl]
  );

  const webViewRef = useRef<WebView>(null);
  const onContentDismissedCallback = useRef<(() => void) | undefined>(
    undefined
  );

  const [user, setUser] = useState<
    undefined | { id: string; idVerification?: string; attributes?: object }
  >(undefined);
  const [contentItems, setContentItems] = useState<TargetedContent[]>([]);
  const [userTriggeredContentItems, setUserTriggeredContentItems] = useState<
    TargetedContent[]
  >([]);
  const [isUserTriggeredContentShown, setIsUserTriggeredContentShown] =
    useState(false);
  const [isRemoteContentReady, setIsRemoteContentReady] = useState(false);

  const activeContentItem =
    contentItems.length > 0
      ? contentItems[0]
      : isUserTriggeredContentShown && userTriggeredContentItems.length > 0
        ? userTriggeredContentItems[0]
        : undefined;

  const handleEvent = useCallback<EventHandler>(
    async (event) => {
      onContentDismissedCallback.current = undefined;

      if (event.type === 'session-started' && user?.id !== event.userId) {
        setUser({
          id: event.userId,
          idVerification: event.userIdVerification,
          attributes: event.userAttributes,
        });
      } else if (event.type === 'session-ended') {
        setUser(undefined);
        setContentItems([]);
      } else if (event.type === 'user-triggered-content') {
        setIsUserTriggeredContentShown(true);
        onContentDismissedCallback.current = event.onContentDismissed;
      } else if (event.type === 'trigger-point') {
        setContentItems([]);
        setUserTriggeredContentItems([]);
        onContentDismissedCallback.current = event.onContentDismissed;

        if (!user) {
          return;
        }

        const targetedContentResult = await recordEvent({
          type: 'trigger-point',
          organizationCode: props.organizationCode,
          userId: user.id,
          userIdVerification: user.idVerification,
          triggerPoint: event.triggerPoint,
          userAttributes: user.attributes,
        });
        setContentItems(
          targetedContentResult.content.filter(
            (item: any) => item.presentationType === 'popup'
          )
        );
        setUserTriggeredContentItems(
          targetedContentResult.content.filter(
            (item: any) => item.presentationType === 'button-triggered'
          )
        );
      }
    },
    [props.organizationCode, recordEvent, user]
  );

  return (
    <WaveCxContext.Provider
      value={{
        handleEvent,
        hasUserTriggeredContent: userTriggeredContentItems.length > 0,
      }}
    >
      <Modal
        visible={activeContentItem !== undefined}
        presentationStyle={activeContentItem?.mobileModal?.type ?? 'pageSheet'}
        onRequestClose={() => {
          if (isUserTriggeredContentShown) {
            setIsUserTriggeredContentShown(false);
          } else {
            setContentItems([]);
          }
          setIsRemoteContentReady(false);
          onContentDismissedCallback.current?.();
        }}
        animationType={'slide'}
      >
        {activeContentItem && (
          <>
            {activeContentItem.mobileModal?.type !== 'overFullScreen' && (
              <View
                style={{
                  ...styles.header,
                  backgroundColor: activeContentItem.mobileModal?.headerColor,
                }}
              >
                <View style={styles.headerStart} />
                <View>
                  <Text style={{ fontWeight: 'bold' }}>
                    {activeContentItem.mobileModal?.title ?? `What's New`}
                  </Text>
                </View>
                <View style={styles.closeButtonContainer}>
                  <Pressable
                    onPress={() => {
                      setIsUserTriggeredContentShown(false);
                      setContentItems([]);
                      setIsRemoteContentReady(false);
                      onContentDismissedCallback.current?.();
                    }}
                    aria-label={'Close'}
                  >
                    {activeContentItem.mobileModal?.closeButton.style ===
                      'x' && (
                      <View style={styles.close}>
                        <View style={styles.closeIcon1} />
                        <View style={styles.closeIcon2} />
                      </View>
                    )}
                    {activeContentItem.mobileModal?.closeButton.style !==
                      'x' && (
                      <Text>
                        {activeContentItem.mobileModal?.closeButton.style ===
                          'text' &&
                          activeContentItem.mobileModal?.closeButton.label}
                        {!activeContentItem.mobileModal && 'Close'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
            {activeContentItem.mobileModal?.type === 'overFullScreen' && (
              <SafeAreaView
                style={{
                  backgroundColor: activeContentItem.mobileModal?.headerColor,
                }}
              >
                <View
                  style={{
                    ...styles.header,
                    backgroundColor: activeContentItem.mobileModal?.headerColor,
                  }}
                >
                  <View style={styles.headerStart} />
                  <View>
                    <Text style={{ fontWeight: 'bold' }}>
                      {activeContentItem.mobileModal?.title ?? `What's New`}
                    </Text>
                  </View>
                  <View style={styles.closeButtonContainer}>
                    <Pressable
                      onPress={() => {
                        setIsUserTriggeredContentShown(false);
                        setContentItems([]);
                        setIsRemoteContentReady(false);
                        onContentDismissedCallback.current?.();
                      }}
                      aria-label={'Close'}
                    >
                      {activeContentItem.mobileModal?.closeButton.style ===
                        'x' && (
                        <View style={styles.close}>
                          <View style={styles.closeIcon1} />
                          <View style={styles.closeIcon2} />
                        </View>
                      )}
                      {activeContentItem.mobileModal?.closeButton.style !==
                        'x' && (
                        <Text>
                          {activeContentItem.mobileModal?.closeButton.style ===
                            'text' &&
                            activeContentItem.mobileModal?.closeButton.label}
                          {!activeContentItem.mobileModal && 'Close'}
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
              source={{ uri: activeContentItem.viewUrl }}
              ref={webViewRef}
              style={{
                display: !isRemoteContentReady ? 'none' : undefined,
              }}
              onLoad={() => setIsRemoteContentReady(true)}
              onNavigationStateChange={(event) => {
                if (
                  event.url.split('//')[1]?.split('/')[0] !==
                  activeContentItem?.viewUrl.split('//')[1]?.split('/')[0]
                ) {
                  webViewRef.current?.stopLoading();
                  Linking.openURL(event.url);
                }
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
