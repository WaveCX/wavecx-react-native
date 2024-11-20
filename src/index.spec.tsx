import * as React from 'react';
import { useEffect } from 'react';
import { Button, Switch, Text } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/react-native/extend-expect';

import { useWaveCx, WaveCxProvider } from './index';

describe(WaveCxProvider.name, () => {
  it('renders provided child elements', () => {
    const { getByText } = render(
      <WaveCxProvider organizationCode={'org'}>
        <Text>Children</Text>
        <Text>Always rendered</Text>
      </WaveCxProvider>
    );
    expect(getByText('Children')).toBeVisible();
    expect(getByText('Always rendered')).toBeVisible();
  });

  it('renders popup content when received', async () => {
    const Consumer = () => {
      const { handleEvent } = useWaveCx();

      useEffect(() => {
        handleEvent({
          type: 'session-started',
          userId: 'test-id',
        });
        handleEvent({
          type: 'trigger-point',
          triggerPoint: 'trigger-point',
        });
      }, [handleEvent]);

      return <></>;
    };

    const { getByText } = render(
      <WaveCxProvider
        organizationCode={'org'}
        recordEvent={async () => ({
          content: [
            {
              type: 'featurette',
              presentationType: 'popup',
              triggerPoint: 'trigger-point',
              viewUrl: 'https://mock.content.com/embed',
            },
          ],
        })}
      >
        <Consumer />
      </WaveCxProvider>
    );

    await waitFor(() => {
      expect(getByText(`What's New`)).toBeVisible();
    });
  });

  it('dismisses popup content when a different trigger point is fired', async () => {
    const Consumer = () => {
      const { handleEvent } = useWaveCx();

      useEffect(() => {
        handleEvent({
          type: 'session-started',
          userId: 'test-id',
        });
      }, [handleEvent]);

      return (
        <>
          <Button
            title={'Trigger Point'}
            onPress={() =>
              handleEvent({
                type: 'trigger-point',
                triggerPoint: 'trigger-point',
              })
            }
          />

          <Button
            title={'Other'}
            onPress={() =>
              handleEvent({
                type: 'trigger-point',
                triggerPoint: 'other',
              })
            }
          />
        </>
      );
    };

    const { getByText, queryByText } = render(
      <WaveCxProvider
        organizationCode={'org'}
        recordEvent={async () => ({
          content: [
            {
              type: 'featurette',
              presentationType: 'popup',
              triggerPoint: 'trigger-point',
              viewUrl: 'https://mock.content.com/embed',
            },
          ],
        })}
      >
        <Consumer />
      </WaveCxProvider>
    );

    const user = userEvent.setup();
    await user.press(getByText('Trigger Point'));
    await waitFor(() => {
      expect(getByText(`What's New`)).toBeVisible();
    });

    await user.press(getByText('Other'));
    await waitFor(() => {
      expect(queryByText(`What's New`)).not.toBeVisible();
    });
  });

  it('renders a received piece of pop-up content only once per session', async () => {
    const Consumer = () => {
      const { handleEvent } = useWaveCx();

      useEffect(() => {
        handleEvent({
          type: 'session-started',
          userId: 'test-id',
        });
      }, [handleEvent]);

      return (
        <>
          <Button
            title={'Trigger Point'}
            onPress={() =>
              handleEvent({
                type: 'trigger-point',
                triggerPoint: 'trigger-point',
              })
            }
          />

          <Button
            title={'Other'}
            onPress={() =>
              handleEvent({
                type: 'trigger-point',
                triggerPoint: 'other',
              })
            }
          />
        </>
      );
    };

    const { getByText, queryByText } = render(
      <WaveCxProvider
        organizationCode={'org'}
        recordEvent={async () => ({
          content: [
            {
              type: 'featurette',
              presentationType: 'popup',
              triggerPoint: 'trigger-point',
              viewUrl: 'https://mock.content.com/embed',
            },
            {
              type: 'featurette',
              presentationType: 'popup',
              triggerPoint: 'other',
              viewUrl: 'https://mock.content.com/other-embed',
            },
          ],
        })}
      >
        <Consumer />
      </WaveCxProvider>
    );

    const user = userEvent.setup();
    await user.press(getByText('Trigger Point'));
    await waitFor(() => {
      expect(getByText(`What's New`)).toBeVisible();
    });

    await user.press(getByText('Other'));
    await waitFor(() => {
      expect(getByText(`What's New`)).toBeVisible();
    });

    await user.press(getByText('Trigger Point'));
    await waitFor(() => {
      expect(queryByText('dialog')).not.toBeVisible();
    });
  });

  it('provides a user-triggered-content status flag', async () => {
    const Consumer = () => {
      const { handleEvent, hasUserTriggeredContent } = useWaveCx();

      useEffect(() => {
        handleEvent({
          type: 'session-started',
          userId: 'test-id',
        });
        handleEvent({
          type: 'trigger-point',
          triggerPoint: 'trigger-point',
        });
      }, [handleEvent]);

      return (
        <Switch aria-label={'Has Content'} value={hasUserTriggeredContent} />
      );
    };

    const { getByRole } = render(
      <WaveCxProvider
        organizationCode={'org'}
        recordEvent={async () => ({
          content: [
            {
              type: 'featurette',
              presentationType: 'button-triggered',
              triggerPoint: 'trigger-point',
              viewUrl: 'https://mock.content.com/embed',
            },
          ],
        })}
      >
        <Consumer />
      </WaveCxProvider>
    );

    await waitFor(() => {
      expect(getByRole('switch')).toBeChecked();
    });
  });

  it('invokes an optional callback when popup content is dismissed', async () => {
    let wasCallbackInvoked = false;

    const Consumer = () => {
      const { handleEvent } = useWaveCx();

      useEffect(() => {
        handleEvent({
          type: 'session-started',
          userId: 'test-id',
        });
        handleEvent({
          type: 'trigger-point',
          triggerPoint: 'trigger-point',
          onContentDismissed: () => {
            wasCallbackInvoked = true;
          },
        });
      }, [handleEvent]);

      return <></>;
    };

    const { getByText } = render(
      <WaveCxProvider
        organizationCode={'org'}
        recordEvent={async () => ({
          content: [
            {
              type: 'featurette',
              presentationType: 'popup',
              triggerPoint: 'trigger-point',
              viewUrl: 'https://mock.content.com/embed',
            },
          ],
        })}
      >
        <Consumer />
      </WaveCxProvider>
    );

    await waitFor(() => {
      expect(getByText(`What's New`)).toBeVisible();
    });

    const user = userEvent.setup();
    await user.press(getByText('Close'));
    expect(wasCallbackInvoked).toEqual(true);
  });

  it('invokes an optional callback when user-triggered content is dismissed', async () => {
    let wasCallbackInvoked = false;

    const Consumer = () => {
      const { handleEvent, hasUserTriggeredContent } = useWaveCx();

      useEffect(() => {
        handleEvent({
          type: 'session-started',
          userId: 'test-id',
        });
        handleEvent({
          type: 'trigger-point',
          triggerPoint: 'trigger-point',
        });
      }, [handleEvent]);

      return !hasUserTriggeredContent ? (
        <></>
      ) : (
        <Button
          title={'Show Content'}
          onPress={() =>
            handleEvent({
              type: 'user-triggered-content',
              onContentDismissed: () => {
                wasCallbackInvoked = true;
              },
            })
          }
        />
      );
    };

    const { getByText } = render(
      <WaveCxProvider
        organizationCode={'org'}
        recordEvent={async () => ({
          content: [
            {
              type: 'featurette',
              presentationType: 'button-triggered',
              triggerPoint: 'trigger-point',
              viewUrl: 'https://mock.content.com/embed',
            },
          ],
        })}
      >
        <Consumer />
      </WaveCxProvider>
    );

    const user = userEvent.setup();

    await waitFor(() => {
      expect(getByText('Show Content')).toBeVisible();
    });
    await user.press(getByText('Show Content'));

    await waitFor(() => {
      expect(getByText(`What's New`)).toBeVisible();
    });

    await user.press(getByText('Close'));
    expect(wasCallbackInvoked).toEqual(true);
  });
});
