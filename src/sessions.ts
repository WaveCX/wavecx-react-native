export type SessionToken = string;

let sessionToken: string | null = null;
let sessionTokenExpiration: Date | null = null;
let sessionUserId: string | null = null;

export const storeSessionToken = (
  token: SessionToken,
  expiresIn: number,
  userId: string
) => {
  sessionToken = token;
  sessionTokenExpiration = new Date(Date.now() + expiresIn * 1000);
  sessionUserId = userId;
};

export const clearSessionToken = () => {
  sessionToken = null;
  sessionTokenExpiration = null;
  sessionUserId = null;
};

export const readSessionToken = (userId: string): SessionToken | null => {
  try {
    if (!sessionTokenExpiration) {
      return null;
    }
    if (sessionUserId !== userId) {
      return null;
    }
    return sessionTokenExpiration > new Date() ? sessionToken : null;
  } catch {
    return null;
  }
};

export type InitiateSession = (options: {
  organizationCode: string;
  userId: string;
  userIdVerification?: string;
  userAttributes?: object;
}) => Promise<{ sessionToken: string; expiresIn?: number }>;
