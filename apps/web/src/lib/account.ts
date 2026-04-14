import type { User } from "@supabase/supabase-js";

export const MIN_PASSWORD_LENGTH = 8;

function readUserMetadataValue(user: User | null, key: string): string {
  const value = user?.user_metadata?.[key];

  return typeof value === "string" ? value.trim() : "";
}

export function getUserDisplayName(user: User | null): string {
  const displayName =
    readUserMetadataValue(user, "display_name") ||
    readUserMetadataValue(user, "full_name") ||
    readUserMetadataValue(user, "name");

  if (displayName) {
    return displayName;
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "Account";
}

export function getUserFarmName(user: User | null): string {
  return readUserMetadataValue(user, "farm_name");
}

export function getDashboardFarmLabel(user: User | null): string {
  return getUserFarmName(user) || getUserDisplayName(user);
}

export function getUserDefaultOwnerName(user: User | null): string {
  return readUserMetadataValue(user, "default_owner_name");
}

export function getUserProfileDefaults(user: User | null) {
  return {
    displayName:
      readUserMetadataValue(user, "display_name") ||
      readUserMetadataValue(user, "full_name") ||
      readUserMetadataValue(user, "name"),
    farmName: getUserFarmName(user),
    defaultOwnerName: getUserDefaultOwnerName(user),
  };
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

export function getPasswordRequirementsMessage(): string {
  return `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include at least one letter and one number.`;
}

export function slugifyFilePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
