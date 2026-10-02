import axios, { isAxiosError } from "axios";

export type FirebaseTokenTypes = {
  id?: string;
  deviceId: string;
  firebaseToken: string;
  userlog: string;
  loggedBy: string;
  loggedOn?: string; // ISO date string
  lastLoginBy: string;
  lastLogin?: string; // ISO date string
  status: number;
};

export type SendNotificationRequest = {
  token: string[];
  title: string;
  body: string;
  channelId: string;
  data?: Record<string, string>;
};

const API_BASE = process.env.EXPO_PUBLIC_NOTIFICATION_URL;

if (!API_BASE) {
  console.warn("EXPO_PUBLIC_NOTIFICATION_URL is not set; notification API calls will fail.");
}

const notificationApi = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

notificationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      error.response.data = "API Unauthorised. Please contact support.";
    }
    return Promise.reject(error);
  }
);

/**
 * Rejects with the server's error body when there is one, otherwise with the
 * original error (e.g. network failure or timeout) so the reason isn't lost.
 */
const toApiError = (error: unknown) =>
  isAxiosError(error) && error.response?.data !== undefined ? error.response.data : error;

/** Save a device's FCM token for the logged-in user. */
export const postTokenToDatabase = async (data: FirebaseTokenTypes) => {
  try {
    const res = await notificationApi.post("/FirebaseToken", data);
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/** List all saved FCM tokens. */
export const getFirebaseToken = async (): Promise<FirebaseTokenTypes[]> => {
  try {
    const res = await notificationApi.get<FirebaseTokenTypes[]>("/FirebaseToken");
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/** Ask the backend to push a notification to the given tokens. */
export const postNotification = async (data: SendNotificationRequest) => {
  try {
    const res = await notificationApi.post("/FirebaseToken/send", data);
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
};
