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
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView from 'react-native-webview';

import { composeFireTargetedContentEventViaApi } from './targeted-content';
import type { FireTargetedContentEvent } from './targeted-content';

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
  const [contentItems, setContentItems] = useState<
    { url: string; presentationStyle: string }[]
  >([]);
  const [userTriggeredContentItems, setUserTriggeredContentItems] = useState<
    { url: string }[]
  >([]);
  const [isUserTriggeredContentShown, setIsUserTriggeredContentShown] =
    useState(false);

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
          targetedContentResult.content
            .filter((item: any) => item.presentationType === 'popup')
            .map((item: any) => ({
              presentationStyle: item.presentationStyle,
              url: item.viewUrl,
              slides:
                item.presentationStyle !== 'native'
                  ? []
                  : item.content
                      .sort((a: any, b: any) =>
                        a.sortIndex < b.sortIndex ? -1 : 1
                      )
                      .map((c: any) => ({
                        content: c.hasBlockContent
                          ? {
                              type: 'blocks',
                              blocks: c.smallAspectContentBlocks,
                            }
                          : {
                              type: 'basic',
                              bodyHtml: c.smallAspectFeatureBody,
                              imageUrl: c.smallAspectPreviewImage?.url,
                            },
                      })),
            }))
        );
        setUserTriggeredContentItems(
          targetedContentResult.content
            .filter((item: any) => item.presentationType === 'button-triggered')
            .map((item: any) => ({
              presentationStyle: item.presentationStyle,
              url: item.viewUrl,
              slides:
                item.presentationStyle !== 'native'
                  ? []
                  : item.content
                      .sort((a: any, b: any) =>
                        a.sortIndex < b.sortIndex ? -1 : 1
                      )
                      .map((c: any) => ({
                        content: c.hasBlockContent
                          ? {
                              type: 'blocks',
                              blocks: c.smallAspectContentBlocks,
                            }
                          : {
                              type: 'basic',
                              bodyHtml: c.smallAspectFeatureBody,
                              imageUrl: c.smallAspectPreviewImage?.url,
                            },
                      })),
            }))
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
        presentationStyle={'pageSheet'}
        onRequestClose={() => {
          if (isUserTriggeredContentShown) {
            setIsUserTriggeredContentShown(false);
          } else {
            setContentItems([]);
          }
          onContentDismissedCallback.current?.();
        }}
        animationType={'slide'}
      >
        <View style={styles.header}>
          <View style={styles.headerStart} />
          <View>
            <Text style={{ fontWeight: 'bold' }}>What&rsquo;s New</Text>
          </View>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              setIsUserTriggeredContentShown(false);
              setContentItems([]);
              onContentDismissedCallback.current?.();
            }}
          >
            <Text>Close</Text>
          </Pressable>
        </View>
        {activeContentItem && (
          <WebView
            source={{ uri: activeContentItem.url }}
            bounces={false}
            ref={webViewRef}
            onNavigationStateChange={(event) => {
              if (
                event.url.split('//')[1]?.split('/')[0] !==
                activeContentItem?.url.split('//')[1]?.split('/')[0]
              ) {
                webViewRef.current?.stopLoading();
                Linking.openURL(event.url);
              }
            }}
          />
        )}
      </Modal>

      {props.children}
    </WaveCxContext.Provider>
  );
};

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    backgroundColor: '#fafafa',
  },
  closeButton: {
    width: 40,
  },
  headerStart: {
    width: 40,
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
