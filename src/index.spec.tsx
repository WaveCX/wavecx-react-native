import * as React from 'react';
import { useEffect } from 'react';
import { Button, Switch, Text } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/react-native/extend-expect';

import { useWaveCx, WaveCxProvider } from './index';
import { clearSessionToken } from './sessions';

describe(WaveCxProvider.name, () => {
  afterEach(() => {
    clearSessionToken();
  });
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

  it('presents user-triggered content for a specific trigger point', async () => {
    const Consumer = () => {
      const { handleEvent, hasContent } = useWaveCx();

      useEffect(() => {
        handleEvent({
          type: 'session-started',
          userId: 'test-id',
        });
      }, [handleEvent]);

      return hasContent('specific-point', 'button-triggered') ? (
        <Button
          title={'Show Content'}
          onPress={() =>
            handleEvent({
              type: 'user-triggered-content',
              triggerPoint: 'specific-point',
            })
          }
        />
      ) : (
        <></>
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
              triggerPoint: 'specific-point',
              viewUrl: 'https://mock.content.com/embed',
            },
            {
              type: 'featurette',
              presentationType: 'button-triggered',
              triggerPoint: 'other-point',
              viewUrl: 'https://mock.content.com/other',
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
  });

  it('presents user-triggered content without a trigger point (legacy behavior)', async () => {
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
  });

  describe('hasContent', () => {
    it('returns true when content exists for a trigger point', async () => {
      let result = false;

      const Consumer = () => {
        const { handleEvent, hasContent } = useWaveCx();

        useEffect(() => {
          handleEvent({
            type: 'session-started',
            userId: 'test-id',
          });
          handleEvent({
            type: 'trigger-point',
            triggerPoint: 'check-point',
          });
        }, [handleEvent]);

        return (
          <>
            {hasContent('check-point') && <Text>Ready</Text>}
            <Button
              title={'Check'}
              onPress={() => {
                result = hasContent('check-point');
              }}
            />
          </>
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
                triggerPoint: 'check-point',
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
        expect(getByText('Ready')).toBeVisible();
      });
      await user.press(getByText('Check'));
      expect(result).toBe(true);
    });

    it('returns false when no content exists for a trigger point', async () => {
      let result = true;
      const onContentCacheChanged = jest.fn();

      const Consumer = () => {
        const { handleEvent, hasContent } = useWaveCx();

        useEffect(() => {
          handleEvent({
            type: 'session-started',
            userId: 'test-id',
          });
        }, [handleEvent]);

        return (
          <Button
            title={'Check'}
            onPress={() => {
              result = hasContent('no-content-here');
            }}
          />
        );
      };

      const { getByText } = render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
          recordEvent={async () => ({
            content: [
              {
                type: 'featurette',
                presentationType: 'popup',
                triggerPoint: 'check-point',
                viewUrl: 'https://mock.content.com/embed',
              },
            ],
          })}
        >
          <Consumer />
        </WaveCxProvider>
      );

      await waitFor(() => {
        expect(onContentCacheChanged).toHaveBeenLastCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ triggerPoint: 'check-point' }),
          ])
        );
      });

      const user = userEvent.setup();
      await user.press(getByText('Check'));
      expect(result).toBe(false);
    });

    it('filters by presentation type when provided', async () => {
      let popupResult = false;
      let buttonTriggeredResult = false;

      const Consumer = () => {
        const { handleEvent, hasContent } = useWaveCx();

        useEffect(() => {
          handleEvent({
            type: 'session-started',
            userId: 'test-id',
          });
          handleEvent({
            type: 'trigger-point',
            triggerPoint: 'check-point',
          });
        }, [handleEvent]);

        return (
          <>
            {hasContent('check-point') && <Text>Ready</Text>}
            <Button
              title={'Check'}
              onPress={() => {
                popupResult = hasContent('check-point', 'popup');
                buttonTriggeredResult = hasContent(
                  'check-point',
                  'button-triggered'
                );
              }}
            />
          </>
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
                triggerPoint: 'check-point',
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
        expect(getByText('Ready')).toBeVisible();
      });
      await user.press(getByText('Check'));
      expect(popupResult).toBe(false);
      expect(buttonTriggeredResult).toBe(true);
    });

    it('returns false after session ends', async () => {
      let result = true;

      const Consumer = () => {
        const { handleEvent, hasContent } = useWaveCx();

        return (
          <>
            <Button
              title={'Start'}
              onPress={() => {
                handleEvent({
                  type: 'session-started',
                  userId: 'test-id',
                });
                handleEvent({
                  type: 'trigger-point',
                  triggerPoint: 'check-point',
                });
              }}
            />
            <Button
              title={'End'}
              onPress={() => {
                handleEvent({ type: 'session-ended' });
              }}
            />
            <Button
              title={'Check'}
              onPress={() => {
                result = hasContent('check-point');
              }}
            />
          </>
        );
      };

      const { getByText } = render(
        <WaveCxProvider
          organizationCode={'org'}
          recordEvent={async () => ({
            content: [
              {
                type: 'featurette',
                presentationType: 'popup',
                triggerPoint: 'check-point',
                viewUrl: 'https://mock.content.com/embed',
              },
            ],
          })}
        >
          <Consumer />
        </WaveCxProvider>
      );

      const user = userEvent.setup();
      await user.press(getByText('Start'));
      await waitFor(() => {
        expect(getByText('Check')).toBeVisible();
      });
      await user.press(getByText('End'));
      await user.press(getByText('Check'));
      expect(result).toBe(false);
    });
  });

  describe('session-started with different userId', () => {
    it('initiates a fresh session when userId changes without session-ended', async () => {
      const recordEvent = jest.fn(async () => ({
        content: [
          {
            type: 'featurette' as const,
            presentationType: 'popup' as const,
            triggerPoint: 'trigger-point',
            viewUrl: 'https://mock.content.com/embed',
          },
        ],
      }));

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        return (
          <>
            <Button
              title={'Start User A'}
              onPress={() =>
                handleEvent({
                  type: 'session-started',
                  userId: 'user-a',
                })
              }
            />
            <Button
              title={'Start User B'}
              onPress={() =>
                handleEvent({
                  type: 'session-started',
                  userId: 'user-b',
                })
              }
            />
          </>
        );
      };

      const { getByText } = render(
        <WaveCxProvider organizationCode={'org'} recordEvent={recordEvent}>
          <Consumer />
        </WaveCxProvider>
      );

      const user = userEvent.setup();
      await user.press(getByText('Start User A'));
      await waitFor(() => {
        expect(recordEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'session-started', userId: 'user-a' })
        );
      });

      recordEvent.mockClear();
      await user.press(getByText('Start User B'));
      await waitFor(() => {
        expect(recordEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'session-started', userId: 'user-b' })
        );
      });
    });

    it('reuses session token when same userId starts a new session', async () => {
      const recordEvent = jest.fn(async () => ({
        content: [
          {
            type: 'featurette' as const,
            presentationType: 'popup' as const,
            triggerPoint: 'trigger-point',
            viewUrl: 'https://mock.content.com/embed',
          },
        ],
        sessionToken: 'test-token',
        expiresIn: 3600,
      }));

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        return (
          <Button
            title={'Start'}
            onPress={() =>
              handleEvent({
                type: 'session-started',
                userId: 'same-user',
              })
            }
          />
        );
      };

      const { getByText } = render(
        <WaveCxProvider organizationCode={'org'} recordEvent={recordEvent}>
          <Consumer />
        </WaveCxProvider>
      );

      const user = userEvent.setup();
      await user.press(getByText('Start'));
      await waitFor(() => {
        expect(recordEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'session-started',
            userId: 'same-user',
          })
        );
      });

      recordEvent.mockClear();
      await user.press(getByText('Start'));
      await waitFor(() => {
        expect(recordEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'session-refresh',
            userId: 'same-user',
          })
        );
      });
    });

    it('fetches new content for the new user when userId changes', async () => {
      const onContentCacheChanged = jest.fn();

      const recordEvent = jest.fn(async (params: { userId?: string }) => {
        if (params.userId === 'user-b') {
          return {
            content: [
              {
                type: 'featurette' as const,
                presentationType: 'popup' as const,
                triggerPoint: 'trigger-point',
                viewUrl: 'https://mock.content.com/user-b-content',
              },
            ],
            sessionToken: 'token-b',
            expiresIn: 3600,
          };
        }
        return {
          content: [],
          sessionToken: 'token-a',
          expiresIn: 3600,
        };
      });

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        return (
          <>
            <Button
              title={'Start User A'}
              onPress={() =>
                handleEvent({
                  type: 'session-started',
                  userId: 'user-a',
                })
              }
            />
            <Button
              title={'Start User B'}
              onPress={() =>
                handleEvent({
                  type: 'session-started',
                  userId: 'user-b',
                })
              }
            />
          </>
        );
      };

      const { getByText } = render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
          recordEvent={recordEvent}
        >
          <Consumer />
        </WaveCxProvider>
      );

      const user = userEvent.setup();
      await user.press(getByText('Start User A'));
      await waitFor(() => {
        expect(recordEvent).toHaveBeenCalled();
      });

      onContentCacheChanged.mockClear();
      await user.press(getByText('Start User B'));
      await waitFor(() => {
        expect(onContentCacheChanged).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              viewUrl: 'https://mock.content.com/user-b-content',
            }),
          ])
        );
      });
    });
  });

  describe('onContentCacheChanged', () => {
    it('is called when content is fetched', async () => {
      const onContentCacheChanged = jest.fn();
      const mockContent = [
        {
          type: 'featurette' as const,
          presentationType: 'popup' as const,
          triggerPoint: 'trigger-point',
          viewUrl: 'https://mock.content.com/embed',
        },
      ];

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        useEffect(() => {
          handleEvent({
            type: 'session-started',
            userId: 'test-id',
          });
        }, [handleEvent]);

        return <></>;
      };

      render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
          recordEvent={async () => ({
            content: mockContent,
          })}
        >
          <Consumer />
        </WaveCxProvider>
      );

      await waitFor(() => {
        expect(onContentCacheChanged).toHaveBeenCalledWith(mockContent);
      });
    });

    it('is called with empty array when session ends', async () => {
      const onContentCacheChanged = jest.fn();

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        return (
          <>
            <Button
              title={'Start'}
              onPress={() =>
                handleEvent({
                  type: 'session-started',
                  userId: 'test-id',
                })
              }
            />
            <Button
              title={'End'}
              onPress={() => handleEvent({ type: 'session-ended' })}
            />
          </>
        );
      };

      const { getByText } = render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
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
      await user.press(getByText('Start'));
      await waitFor(() => {
        expect(onContentCacheChanged).toHaveBeenCalledWith([
          {
            type: 'featurette',
            presentationType: 'popup',
            triggerPoint: 'trigger-point',
            viewUrl: 'https://mock.content.com/embed',
          },
        ]);
      });

      onContentCacheChanged.mockClear();
      await user.press(getByText('End'));
      expect(onContentCacheChanged).toHaveBeenCalledWith([]);
    });

    it('is called with empty array on mount', async () => {
      const onContentCacheChanged = jest.fn();

      const Consumer = () => {
        return <></>;
      };

      render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
          recordEvent={async () => ({
            content: [],
          })}
        >
          <Consumer />
        </WaveCxProvider>
      );

      await waitFor(() => {
        expect(onContentCacheChanged).toHaveBeenCalledWith([]);
      });
    });

    it('is not called again when session starts with no content returned', async () => {
      const onContentCacheChanged = jest.fn();

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        return (
          <Button
            title={'Start'}
            onPress={() =>
              handleEvent({
                type: 'session-started',
                userId: 'test-id',
              })
            }
          />
        );
      };

      const { getByText } = render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
          recordEvent={async () => ({
            content: [],
          })}
        >
          <Consumer />
        </WaveCxProvider>
      );

      await waitFor(() => {
        expect(onContentCacheChanged).toHaveBeenCalledTimes(1);
      });

      onContentCacheChanged.mockClear();
      const user = userEvent.setup();
      await user.press(getByText('Start'));
      await waitFor(() => {
        expect(getByText('Start')).toBeVisible();
      });
      expect(onContentCacheChanged).not.toHaveBeenCalled();
    });

    it('is not called when session ends with an empty cache', async () => {
      const onContentCacheChanged = jest.fn();

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        return (
          <Button
            title={'End'}
            onPress={() => handleEvent({ type: 'session-ended' })}
          />
        );
      };

      const { getByText } = render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
          recordEvent={async () => ({
            content: [],
          })}
        >
          <Consumer />
        </WaveCxProvider>
      );

      await waitFor(() => {
        expect(onContentCacheChanged).toHaveBeenCalledTimes(1);
      });

      onContentCacheChanged.mockClear();
      const user = userEvent.setup();
      await user.press(getByText('End'));
      expect(onContentCacheChanged).not.toHaveBeenCalled();
    });

    it('is not called on trigger point when no content is consumed', async () => {
      const onContentCacheChanged = jest.fn();

      const Consumer = () => {
        const { handleEvent } = useWaveCx();

        useEffect(() => {
          handleEvent({
            type: 'session-started',
            userId: 'test-id',
          });
        }, [handleEvent]);

        return (
          <Button
            title={'Trigger'}
            onPress={() =>
              handleEvent({
                type: 'trigger-point',
                triggerPoint: 'no-content-here',
              })
            }
          />
        );
      };

      const { getByText } = render(
        <WaveCxProvider
          organizationCode={'org'}
          onContentCacheChanged={onContentCacheChanged}
          recordEvent={async () => ({
            content: [
              {
                type: 'featurette',
                presentationType: 'button-triggered',
                triggerPoint: 'other-point',
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
        expect(getByText('Trigger')).toBeVisible();
      });

      onContentCacheChanged.mockClear();
      await user.press(getByText('Trigger'));
      expect(onContentCacheChanged).not.toHaveBeenCalled();
    });
  });
});
