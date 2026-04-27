import { apiFetch } from "../lib/api";

export async function getActivities(cowId: string) {
  const res = await apiFetch(`/cows/${cowId}/activities`);
  return res.json();
}

export type RecentActivityEntry = {
  id: string;
  description: string;
  eventType: string;
  createdAt: string;
};

export async function getRecentActivity(
  limit = 10,
): Promise<RecentActivityEntry[]> {
  const res = await apiFetch(`/activity?limit=${limit}`);
  return res.json();
}
