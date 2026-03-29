import { apiFetch } from "../lib/api";

export async function getActivities(cowId: string) {
  const res = await apiFetch(`/cows/${cowId}/activities`);
  return res.json();
}
