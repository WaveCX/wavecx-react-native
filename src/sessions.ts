export type SessionToken = string;

let sessionToken: string | null = null;

export const storeSessionToken = (token: SessionToken) => {
  sessionToken = token;
};

export const clearSessionToken = () => {
  sessionToken = null;
};

export const readSessionToken = (): SessionToken | null => {
  return sessionToken;
};

export type InitiateSession = (options: {
  organizationCode: string;
  userId: string;
  userIdVerification?: string;
  userAttributes?: object;
}) => Promise<{ sessionToken: string }>;
