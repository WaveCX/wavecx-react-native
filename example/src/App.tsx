import * as React from 'react';
import { useEffect, useState } from 'react';

import {
  Text,
  TextInput,
  SafeAreaView,
  StyleSheet,
  Button,
  View,
} from 'react-native';

import { WaveCxProvider, useWaveCx } from 'wavecx-react-native';

import { createUserIdVerification } from './user-id-verification';

export default function AppWrapper() {
  return (
    <WaveCxProvider
      organizationCode={process.env.EXPO_PUBLIC_ORGANIZATION_CODE ?? ''}
      apiBaseUrl={process.env.EXPO_PUBLIC_API_URL}
    >
      <App />
    </WaveCxProvider>
  );
}

const triggerPointOne =
  process.env.EXPO_PUBLIC_TRIGGER_POINT_ONE ?? 'account-view';
const triggerPointTwo =
  process.env.EXPO_PUBLIC_TRIGGER_POINT_TWO ?? 'financial-wellness';
const triggerPointThree =
  process.env.EXPO_PUBLIC_TRIGGER_POINT_THREE ?? 'payments';

const App = () => {
  const { handleEvent, hasUserTriggeredContent } = useWaveCx();

  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userIdInput, setUserIdInput] = useState<string>('');

  useEffect(() => {
    if (userId) {
      handleEvent({
        type: 'session-started',
        userId,
        userIdVerification: createUserIdVerification(userId),
        userAttributes: {
          creditScore: 800,
        },
      });
      handleEvent({ type: 'trigger-point', triggerPoint: triggerPointOne });
    } else {
      handleEvent({ type: 'session-ended' });
    }
  }, [userId, handleEvent]);

  return (
    <View>
      <SafeAreaView style={{ alignItems: 'center' }}>
        {!userId && (
          <>
            <Text>User ID</Text>
            <TextInput
              value={userIdInput}
              onChangeText={setUserIdInput}
              style={styles.input}
              placeholder={userId}
            />
            <Button
              title={'Sign In'}
              onPress={() => {
                setUserId(userIdInput);
              }}
            />
          </>
        )}

        {userId && (
          <>
            <Text>Signed in as {userId}</Text>
            <Button title={'Sign Out'} onPress={() => setUserId(undefined)} />
            <Button
              title={'Account View'}
              onPress={() =>
                handleEvent({
                  type: 'trigger-point',
                  triggerPoint: triggerPointOne,
                })
              }
            />
            <Button
              title={'Financial Wellness'}
              onPress={() =>
                handleEvent({
                  type: 'trigger-point',
                  triggerPoint: triggerPointTwo,
                })
              }
            />
            <Button
              title={'Payments'}
              onPress={() =>
                handleEvent({
                  type: 'trigger-point',
                  triggerPoint: triggerPointThree,
                })
              }
            />

            {hasUserTriggeredContent && (
              <Button
                title={'User-Triggered Content'}
                onPress={() => handleEvent({ type: 'user-triggered-content' })}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '90%',
  },
});
