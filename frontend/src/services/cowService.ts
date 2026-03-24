import type { Cow } from "../types/cow";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

type CreateCowInput = {
  tagNumber: string;
  breed: string;
  healthStatus: string;
};

type ApiError = {
  status?: number;
  message: string;
};

async function parseError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();

    if (data.message) {
      return {
        status: response.status,
        message: data.message,
      };
    }

    if (data.errors) {
      const firstKey = Object.keys(data.errors)[0];
      const firstError = data.errors[firstKey][0];

      return {
        status: response.status,
        message: firstError,
      };
    }

    return {
      status: response.status,
      message: "Request failed",
    };
  } catch {
    return {
      status: response.status,
      message: "Request failed",
    };
  }
}

export async function getCows(): Promise<Cow[]> {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    const error = await parseError(response);
    throw new Error(error.message);
  }

  return response.json();
}

export async function createCow(cowData: CreateCowInput): Promise<Cow> {
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
    const error = await parseError(response);
    throw new Error(error.message);
  }

  return response.json();
}

export async function getCowById(id: number): Promise<Cow> {
  const response = await fetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    const error = await parseError(response);
    throw new Error(error.message);
  }

  return response.json();
}

export async function deleteCow(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw new Error(error.message);
  }
}
