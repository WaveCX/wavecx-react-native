# wavecx-react-native
Add WaveCX to your React Native application.

## Installation
`npm install wavecx-react-native`

## Quickstart
```tsx
import * as React from 'react';
import { useEffect } from 'react';
import { Button } from 'react-native';
import { HmacSHA256 } from 'crypto-js';

import { WaveCxProvider, useWaveCx } from 'wavecx-react-native';

export const App = () => (
  <WaveCxProvider organizationCode={'your-org-code'}>
    <Main />
  </WaveCxProvider>
);

const Main = () => {
  const { handleEvent } = useWaveCx();

  useEffect(() => {
    handleEvent({
      type: 'session-started',
      userId: 'user-id',
      userIdVerification: createUserIdVerification('user-id'),
      userAttributes: {
        creditScore: 800,
      },
    });
  }, []);

  return (
    <Button
      title={'Trigger Point'}
      onPress={() => {
        handleEvent({
          type: 'trigger-point',
          triggerPoint: 'trigger-point-code',
        });
      }}
    />
  );
};

// WARNING: User ID verification should NOT be performed on client.
// This is here only for brevity of example.
const createUserIdVerification = (userId: string) =>
  HmacSHA256(userId, 'your-signing-secret').toString()
```

## Usage
WaveCX follows an event-driven architecture, only needing events
raised as they occur within your application.

### Session Started Events
Because WaveCX content is targeted and tracked per user,
a "session started" event is required upon user authentication.

```ts
handleEvent({
  type: 'session-started',
  userId: 'user-id',
  userIdVerification: createUserIdVerification('user-id'),
  userAttributes: {
    // your user attributes
  },
});
```

#### User ID Verification
The user ID verification parameter is an HMACSHA256 hash of the
provided user ID, signed with a signing secret specific to your
organization. This is used to prevent user ID spoofing and
ensure that requests to WaveCX are from authorized sources.

The signing secret should be stored only in a protected environment
(i.e. a backend service) which your client application can
communicate with in order to retrieve ID verification hashes.

**Never send or store the signing secret to the client application.**

### Trigger Point Events

```ts
handleEvent({
  type: 'trigger-point',
  triggerPoint: 'trigger-point-code',
  onContentDismissed: () => {
    // optional callback when content closed by user
  }
});
```

A trigger point is an event within your application
that content can be attached to.

When a trigger-point event is raised, WaveCX will check for and
present any content set for that trigger point that is relevant
for the current user.

### Checking for Content
The WaveCX context provides a `hasContent` method to check whether
content exists for a given trigger point without presenting it.
An optional second parameter filters by presentation type.

`hasContent` is reactive — components that call it in render will
automatically rerender when the content cache changes (e.g. after
session start, trigger point consumption, or session end).

```ts
const { hasContent } = useWaveCx();

// check if any content exists for a trigger point
hasContent('trigger-point-code');

// check for a specific presentation type
hasContent('trigger-point-code', 'popup');
hasContent('trigger-point-code', 'button-triggered');
```

### User-Triggered Content
Use `hasContent` to check for user-triggered content availability
and fire a `user-triggered-content` event to present it. The
event accepts an optional `triggerPoint` parameter to specify
which trigger point's content to show. If omitted, it falls back
to the content set by the most recently fired trigger-point event.

```tsx
const { handleEvent, hasContent } = useWaveCx();

// in render
{hasContent('trigger-point-code', 'button-triggered') && (
  <Button
    title={'User-Triggered Content'}
    onPress={() => handleEvent({
      type: 'user-triggered-content',
      triggerPoint: 'trigger-point-code',
      onContentDismissed: () => {
        // optional callback when content closed by user
      }
    })}
  />
)}
```

> **Deprecation notice:** `hasUserTriggeredContent` is deprecated.
> It only reflects content state for the most recently fired trigger
> point. Use `hasContent(triggerPoint, 'button-triggered')` instead.

### Session Ended Events
If trigger points may still be reached in your application
after the user is no longer authenticated, a session ended
event must be raised to notify WaveCX that trigger points
should no longer be handled for a previously identified user.

```ts
handleEvent({ type: 'session-ended' });
```

### Intercepting Links
An optional callback may be provided to listen for links
opened within WaveCX content and change the default
behavior of opening them in the system browser.
For example, an integration can listen for deep links
and open them directly.

```tsx
import * as React from 'react';

import { WaveCxProvider } from 'wavecx-react-native';

export const App = () => (
  <WaveCxProvider
    organizationCode={'your-org-code'}
    onLinkRequested={(url, { preventDefault, dismissContent }) => {
      if (isDeepLink(url)) {
        openYourDeepLink();
        preventDefault(); // prevent default opening link in browser
        dismissContent(); // close the WaveCX content
      }
    }}
  >
    <Main/>
  </WaveCxProvider>
);
```

## API

### WaveCxProvider
`WaveCxProvider` provides a context for WaveCX events to be raised.
`WaveCxProvider` should be placed as high as possible in the
application tree.
#### Props
| name                   | type                                | description                                                                                                                           | required | default                                                         |
|------------------------|-------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-----------------------------------------------------------------|
| organizationCode       | string                              | code identifying your organization in WaveCX (i.e. the "slug" of your API URL -- "your-org" in https://api.wavecx.com/your-org)       | true     |                                                                 |
| apiBaseUrl             | string                              | base URL which API calls are made to                                                                                                  | false    | https://api.wavecx.com                                          |
| recordEvent            | function (FireTargetedContentEvent) | function to record a raised event, returning relevant content                                                                         | false    | fireTargetedContentEventViaApi (makes real calls to WaveCX API) |
| onLinkRequested        | function (LinkRequestHandler)       | function to listen for links requested within WaveCX content. Can be used e.g. to intercept deep links and prevent opening in browser | false    |                                                                 |
| contentFetchStrategy   | ContentFetchStrategy                | configures content fetching to be done once at session start (one fetch for all trigger points) or once per trigger point             | false    | trigger-point                                                   |
| maxFontSizeMultiplier  | number                              | maximum OS-level font scaling multiplier                                                                                              | false    |                                                                 |
| headerTitleStyle       | TextStyle                           | styles to apply to modal header title                                                                                                 | false    |                                                                 |
| headerCloseButtonStyle | TextStyle                           | styles to apply to the modal close button text                                                                                        | false    |                                                                 |
| onContentCacheChanged  | function (TargetedContent[]) => void | callback fired whenever the content cache changes, receiving the current cache contents. Useful for syncing content state to an external store | false    |                                                                 |

#### Types
```ts
type TargetedContent = {
  triggerPoint: string;
  type: 'featurette';
  presentationType: 'popup' | 'button-triggered';
  viewUrl: string;
};

type FireTargetedContentEvent = (options: {
  type: 'session-started' | 'session-ended' | 'trigger-point' | 'user-triggered-content';
  triggerPoint?: string;
  organizationCode: string;
  userId: string;
  userIdVerification?: string;
  userAttributes?: object;
}) => Promise<{ content: TargetedContent[] }>;

type ContentFetchStrategy =
  | 'session-start'
  | 'trigger-point';

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
```

## Example Application
An example application is available at https://github.com/WaveCX/wavecx-react-native/tree/main/example
