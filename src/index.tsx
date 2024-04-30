import * as React from 'react';
import { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import WebView from 'react-native-webview';

import { Featurette } from './featurettes';
import type { FeaturetteSlide } from './featurettes';
import { fireTargetedContentEventViaApi } from './targeted-content';
import type { FireTargetedContentEvent } from './targeted-content';

export const WaveCxContainer = ({
  readTargetedContent = fireTargetedContentEventViaApi,
  ...props
}: {
  organizationCode: string;
  userId?: string;
  triggerPoint?: string;
  readTargetedContent?: FireTargetedContentEvent;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [contentItems, setContentItems] = useState<
    { url: string; slides: FeaturetteSlide[]; presentationStyle: string }[]
  >([]);
  const activeContentItem =
    contentItems.length > 0 ? contentItems[0] : undefined;

  useEffect(() => {
    (async () => {
      if (!props.userId || !props.triggerPoint) {
        return;
      }

      setIsLoading(true);
      const targetedContentResult = await readTargetedContent({
        type: 'trigger-point',
        organizationCode: props.organizationCode,
        userId: props.userId,
        triggerPoint: props.triggerPoint,
      });
      setContentItems(
        targetedContentResult.content.map((item: any) => ({
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
                      ? { type: 'blocks', blocks: c.smallAspectContentBlocks }
                      : {
                          type: 'basic',
                          bodyHtml: c.smallAspectFeatureBody,
                          imageUrl: c.smallAspectPreviewImage?.url,
                        },
                  })),
        }))
      );
      setIsLoading(false);
    })();
  }, [
    props.userId,
    props.triggerPoint,
    props.organizationCode,
    readTargetedContent,
  ]);

  return (
    <>
      {activeContentItem && (
        <Modal
          visible={contentItems.length > 0 && !isLoading}
          presentationStyle={'pageSheet'}
          onRequestClose={() => setContentItems([])}
          animationType={'slide'}
        >
          {activeContentItem.presentationStyle === 'native' && (
            <Featurette slides={activeContentItem.slides} />
          )}
          {activeContentItem.presentationStyle !== 'native' && (
            <WebView source={{ uri: activeContentItem.url }} bounces={false} />
          )}
        </Modal>
      )}
    </>
  );
};
