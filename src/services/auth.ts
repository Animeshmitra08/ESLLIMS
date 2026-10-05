import { isAxiosError } from "axios";

import { LoginApi } from "@/services/ApiServices";

export type AuthUser = {
  /** The user name typed at login, shown in the app. */
  userName: string;
  userId: string;
  role: string;
  roleId: string;
  companyId: string;
  companyName: string;
};

export type AuthSession = {
  user: AuthUser;
  /** Sent as `Authorization: Bearer <token>` on application API calls. */
  token: string;
  tokenExpiry: string | null;
};

const DEFAULT_ERROR = "Invalid User ID or Password.";

/** Turns whatever the login call rejected with into a message for the user. */
const toLoginErrorMessage = (error: unknown): string => {
  // No server response at all: offline, DNS, TLS, or timeout.
  if (isAxiosError(error)) return "Can't reach the server. Check your connection and try again.";
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object") {
    const body = error as Record<string, unknown>;
    const message = body.message ?? body.Message ?? body.title;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return DEFAULT_ERROR;
};

/**
 * Logs in with the application API. Resolves with the user and token, or
 * rejects with an Error whose message can be shown on the login screen.
 */
export async function login(userName: string, password: string): Promise<AuthSession> {
  const name = userName.trim();

  let response;
  try {
    response = await LoginApi(name, password);
  } catch (error) {
    throw new Error(toLoginErrorMessage(error));
  }

  const data = response?.userData;
  if (!data?.token) throw new Error(toLoginErrorMessage(response));

  return {
    user: {
      userName: name,
      userId: data.UserId,
      role: data.RoleName,
      roleId: data.RoleId,
      companyId: data.CompanyId,
      companyName: data.CompanyName,
    },
    token: data.token,
    tokenExpiry: response.tokenExpiryDate ?? null,
  };
}

/** True if the expiry date has passed. Unknown or unparseable dates count as valid. */
export const isTokenExpired = (tokenExpiry: string | null) => {
  if (!tokenExpiry) return false;
  const expiresAt = Date.parse(tokenExpiry);
  return !Number.isNaN(expiresAt) && expiresAt <= Date.now();
};
