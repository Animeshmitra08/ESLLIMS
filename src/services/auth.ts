import userRoles from "../../jsondata/UserRole.json";

import { COMMON_PASSWORD } from "@/constants/auth";

type UserRoleRecord = {
  USER_NAME: string;
  ROLE_NAME: string;
  lab_Location?: string;
};

export type AuthUser = {
  userName: string;
  role: string;
  labLocations: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

/** Checks the shared password and looks up the user in UserRole.json. */
export function authenticate(userId: string, password: string): AuthUser | null {
  if (password !== COMMON_PASSWORD) return null;
  return findUser(userId);
}

/**
 * Looks up a user in UserRole.json. User IDs are matched ignoring case and
 * surrounding spaces. Records without a usable user name or lab location are
 * ignored.
 */
export function findUser(userId: string): AuthUser | null {
  const target = normalize(userId);
  const record = (userRoles as UserRoleRecord[]).find(
    (r) =>
      normalize(r.USER_NAME) === target &&
      target !== "" &&
      target !== "@" &&
      !!r.lab_Location?.trim()
  );
  if (!record) return null;

  return {
    userName: record.USER_NAME.trim(),
    role: record.ROLE_NAME.trim(),
    labLocations: record
      .lab_Location!.split(",")
      .map((lab) => lab.trim())
      .filter(Boolean),
  };
}
