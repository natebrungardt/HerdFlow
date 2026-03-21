import type { Cow } from "../types/cow";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function getCows(): Promise<Cow[]> {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch cows");
  }

  return response.json();
}

export async function createCow(cowData: {
  tagNumber: string;
  breed: string;
  healthStatus: string;
}) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tagNumber: cowData.tagNumber,
      breed: cowData.breed,
      healthStatus: cowData.healthStatus,
      heatStatus: "Not In Heat",
      breedingStatus: "Open",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create cow");
  }

  return response.json();
}
