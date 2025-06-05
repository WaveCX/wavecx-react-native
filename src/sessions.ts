export type SessionToken = string;

let sessionToken: string | null = null;
let sessionTokenExpiration: Date | null = null;

export const storeSessionToken = (token: SessionToken, expiresIn: number) => {
  sessionToken = token;
  sessionTokenExpiration = new Date(Date.now() + expiresIn * 1000);
};

export const clearSessionToken = () => {
  sessionToken = null;
  sessionTokenExpiration = null;
};

export const readSessionToken = (): SessionToken | null => {
  try {
    if (!sessionTokenExpiration) {
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
