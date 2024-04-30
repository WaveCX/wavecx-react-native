import * as React from 'react';
import { useState } from 'react';

import {
  Text,
  TextInput,
  SafeAreaView,
  StyleSheet,
  Button,
  View,
} from 'react-native';

import { WaveCxContainer } from 'wavecx-react-native';

export default function App() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userIdInput, setUserIdInput] = useState<string>('');
  const [triggerPoint, setTriggerPoint] = useState('trigger-one');

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
              onPress={() => setUserId(userIdInput)}
              // ref={(b) => (button2Ref.current = b)}
            />
          </>
        )}

        {userId && (
          <>
            <Text>Signed in as {userId}</Text>
            <Button title={'Sign Out'} onPress={() => setUserId(undefined)} />
            <Button
              title={'Trigger One'}
              onPress={() => setTriggerPoint('trigger-one')}
            />
            <Button
              title={'Trigger Two'}
              onPress={() => setTriggerPoint('trigger-two')}
            />
            <Button
              title={'Trigger Three'}
              onPress={() => setTriggerPoint('trigger-three')}
            />
          </>
        )}
      </SafeAreaView>

      <WaveCxContainer
        userId={userId}
        triggerPoint={triggerPoint}
        organizationCode={'tenant'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '90%',
  },
});
