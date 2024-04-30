import * as React from 'react';
// import RenderHtml from 'react-native-render-html';
import {
  Text,
  Image,
  View,
  ScrollView,
  Dimensions,
  Button,
  Linking,
} from 'react-native';

const BasicContent = (props: { bodyHtml: string; imageUrl?: string }) => {
  return (
    <>
      {/*<RenderHtml*/}
      {/*  source={{ html: props.bodyHtml }}*/}
      {/*  contentWidth={400}*/}
      {/*  classesStyles={{*/}
      {/*    'text-align-center': { textAlign: 'center' },*/}
      {/*  }}*/}
      {/*/>*/}
      {props.imageUrl && (
        <Image
          source={{ uri: props.imageUrl }}
          style={{
            width: '80%',
            aspectRatio: '1.16/1',
            alignSelf: 'center',
            marginTop: 50,
          }}
        />
      )}
      <Button
        title={'Test'}
        onPress={() => Linking.openURL('https://wavecx.com')}
      />
    </>
  );
};

const BlockContent = (props: { blocks: any[] }) => (
  <>
    {props.blocks.map((block) => (
      <>
        <Text>{JSON.stringify(block)}</Text>
      </>
    ))}
  </>
);

export type FeaturetteContent =
  | { type: 'basic'; bodyHtml: string; imageUrl?: string }
  | { type: 'blocks'; blocks: any[] };

export type FeaturetteSlide = { content: FeaturetteContent };

export const Featurette = (props: { slides: FeaturetteSlide[] }) => {
  return (
    <>
      <View style={{ height: '100%', width: '100%' }}>
        {/*{props.slides.map((slide) => (*/}
        {/*  <View style={{ width: '100%' }}>*/}
        {/*    {slide.content.type === 'basic' && (*/}
        {/*      <BasicContent*/}
        {/*        bodyHtml={slide.content.bodyHtml}*/}
        {/*        imageUrl={slide.content.imageUrl}*/}
        {/*      />*/}
        {/*    )}*/}
        {/*    {slide.content.type === 'blocks' && <BlockContent />}*/}
        {/*  </View>*/}
        {/*))}*/}

        <ScrollView
          horizontal={true}
          pagingEnabled={true}
          style={{
            width: Dimensions.get('window').width,
          }}
        >
          {props.slides.map((slide) => (
            <View
              style={{
                width: Dimensions.get('window').width,
              }}
            >
              {slide.content.type === 'basic' && (
                <BasicContent
                  bodyHtml={slide.content.bodyHtml}
                  imageUrl={slide.content.imageUrl}
                />
              )}
              {slide.content.type === 'blocks' && (
                <BlockContent blocks={slide.content.blocks} />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
};
