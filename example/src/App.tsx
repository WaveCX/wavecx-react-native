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

const App = () => {
  const { handleEvent } = useWaveCx();

  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userIdInput, setUserIdInput] = useState<string>('');

  useEffect(() => {
    if (userId) {
      handleEvent({
        type: 'session-started',
        userId,
      });
      handleEvent({ type: 'trigger-point', triggerPoint: 'trigger-one' });
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
              title={'Trigger One'}
              onPress={() =>
                handleEvent({
                  type: 'trigger-point',
                  triggerPoint: 'trigger-one',
                })
              }
            />
            <Button
              title={'Trigger Two'}
              onPress={() =>
                handleEvent({
                  type: 'trigger-point',
                  triggerPoint: 'trigger-two',
                })
              }
            />
            <Button
              title={'Trigger Three'}
              onPress={() =>
                handleEvent({
                  type: 'trigger-point',
                  triggerPoint: 'trigger-three',
                })
              }
            />
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
