import type { Cow } from "../types/cow";

const API_BASE_URL = "http://localhost:5062/api/cow";

export async function getCows(): Promise<Cow[]> {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch cows");
  }

  return response.json();
}
