import * as Ably from 'ably';

const ABLY_KEY = import.meta.env.VITE_ABLY_API_KEY;

if (!ABLY_KEY) {
  console.warn('VITE_ABLY_API_KEY is not set. Real-time messaging will be disabled.');
}

// In production, we should use Token Auth. 
// For this prototype, we use the API key directly as per user request.
export const ablyClient = ABLY_KEY ? new Ably.Realtime({ key: ABLY_KEY }) : null;
