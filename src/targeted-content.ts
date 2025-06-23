export type TargetedContent = {
  triggerPoint: string;
  type: 'featurette';
  presentationType: 'popup' | 'button-triggered';
  viewUrl: string;
  mobileModal?: {
    type: 'pageSheet' | 'overFullScreen';
    title: string;
    headerColor: string;
    closeButton: { style: 'x' } | { style: 'text'; label: string };
  };
};

export type FireTargetedContentEvent = (options: {
  type: 'session-started' | 'session-refresh' | 'trigger-point';
  sessionToken?: string;
  triggerPoint?: string;
  organizationCode: string;
  userId: string;
  userIdVerification?: string;
  userAttributes?: object;
}) => Promise<{
  content: TargetedContent[];
  sessionToken?: string;
  expiresIn?: number;
}>;

export const composeFireTargetedContentEventViaApi =
  (dependencies: { apiBaseUrl: string }): FireTargetedContentEvent =>
  async (options) => {
    const response = await fetch(
      `${dependencies.apiBaseUrl}/${options.organizationCode}/targeted-content-events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: options.type,
          sessionToken: options.sessionToken,
          userId: options.userId,
          userIdVerification: options.userIdVerification,
          triggerPoint: options.triggerPoint,
          platform: 'mobile',
          userData: {
            attributes: options.userAttributes,
          },
        }),
      }
    );
    if (response.ok) {
      return response.json();
    } else {
      return { content: [] };
    }
  };

export const fireTargetedContentEventViaApi =
  composeFireTargetedContentEventViaApi({
    apiBaseUrl: 'https://api.wavecx.com',
  });
