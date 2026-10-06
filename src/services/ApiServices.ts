import axios, { isAxiosError } from "axios";

import type { LoginResponse } from "@/types/LoginTypes";

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

export type LoginRequest = {
  appid: string;
  userName: string;
  password: string;
  rememberPassword: boolean;
};

const API_BASE = process.env.EXPO_PUBLIC_NOTIFICATION_URL;
const APPLICATION_URL = process.env.EXPO_PUBLIC_APPLICATION_URL;
const APP_ID = process.env.EXPO_PUBLIC_APP_ID ?? "";

if (!APP_ID) {
  console.warn("EXPO_PUBLIC_APP_ID is not set; login will fail.");
}

const LOGIN_PATH = "/login";

const notificationApi = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const applicationApi = axios.create({
  baseURL: APPLICATION_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─── Auth token for the application API ─────────────────────────────────────

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Set after login (or session restore); cleared on logout. */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** Called once when an application API request is rejected with 401. */
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

// Every application API call except login carries the login token.
applicationApi.interceptors.request.use((config) => {
  if (authToken && config.url !== LOGIN_PATH) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// A 401 on an authenticated call means the token expired or was revoked, so
// log the user out. The token is cleared first so parallel failing requests
// only trigger this once.
applicationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && error.config?.url !== LOGIN_PATH && authToken) {
      authToken = null;
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

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



//Application Api functions--------------

/** The only application API call sent without the Bearer token. */
export const LoginApi = async (userName: string, password: string) => {
  const body: LoginRequest = {
    appid: APP_ID,
    userName,
    password,
    rememberPassword: false,
  };
  try {
    const res = await applicationApi.post<LoginResponse>(LOGIN_PATH, body, {
      headers: { appid: APP_ID },
    });
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const SampleApi = async (data: string, connection: string, method: string) => {
  try {
    const res = await applicationApi.post(`/ErpServices?connection=${connection}&method=${method}`, data);
    return res.data;
  } catch (error) {
    throw toApiError(error);
  }
}

const LIMS_CONNECTION = "LimsSql";

/** A SampleApi call on the LIMS connection, with the body sent as JSON. */
export const fetchLims = <T,>(method: string, data: object): Promise<T> =>
  SampleApi(JSON.stringify(data), LIMS_CONNECTION, method);