// User ID hashing is performed client-side in this example for simplicity.
// In production, user IDs should be hashed server side and sent to the client.
// The signing secret should never be sent to or stored on the client.

import { HmacSHA256 } from 'crypto-js';

const signingSecret = process.env.EXPO_PUBLIC_HASH_SECRET;

export const createUserIdVerification = (userId: string): string | undefined =>
  signingSecret ? HmacSHA256(userId, signingSecret).toString() : undefined;
