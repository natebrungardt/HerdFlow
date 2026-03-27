const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export async function getActivities(cowId: number) {
  const res = await fetch(`${API_BASE_URL}/${cowId}/activities`);

  if (!res.ok) {
    throw new Error("Failed to load activities");
  }

  return res.json();
}
