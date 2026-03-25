import type { Cow } from "../types/cow";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export type CreateCowInput = {
  tagNumber: string;
  ownerName: string;
  livestockGroup: string;
  breed: string;
  sex: string;
  healthStatus: string;
  heatStatus: string | null;
  breedingStatus: string | null;
  dateOfBirth: string | null;
  purchaseDate: string | null;
  saleDate: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  notes: string | null;
};

type ApiError = {
  status?: number;
  message: string;
};

function createApiError(error: ApiError): Error & ApiError {
  const apiError = new Error(error.message) as Error & ApiError;
  apiError.status = error.status;
  return apiError;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();

    if (data.detail) {
      return {
        status: response.status,
        message: data.detail,
      };
    }

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
    throw createApiError(error);
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
      ownerName: cowData.ownerName,
      livestockGroup: cowData.livestockGroup,
      sex: cowData.sex,
      breed: cowData.breed,
      dateOfBirth: cowData.dateOfBirth,
      healthStatus: cowData.healthStatus,
      heatStatus: cowData.heatStatus,
      breedingStatus: cowData.breedingStatus,
      purchasePrice: cowData.purchasePrice,
      salePrice: cowData.salePrice,
      purchaseDate: cowData.purchaseDate,
      saleDate: cowData.saleDate,
      notes: cowData.notes,
    }),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }

  return response.json();
}

export async function getCowById(id: number): Promise<Cow> {
  const response = await fetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }

  return response.json();
}

export async function deleteCow(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }
}
export async function getRemovedCows(): Promise<Cow[]> {
  const response = await fetch(`${API_BASE_URL}/removed`);

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }

  return response.json();
}

export async function restoreCow(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/restore/${id}`, {
    method: "PUT",
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }
}

export async function updateCow(
  id: number,
  cowData: CreateCowInput,
): Promise<Cow> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tagNumber: cowData.tagNumber,
      ownerName: cowData.ownerName,
      livestockGroup: cowData.livestockGroup,
      sex: cowData.sex,
      breed: cowData.breed,
      dateOfBirth: cowData.dateOfBirth,
      healthStatus: cowData.healthStatus,
      heatStatus: cowData.heatStatus,
      breedingStatus: cowData.breedingStatus,
      purchasePrice: cowData.purchasePrice,
      salePrice: cowData.salePrice,
      purchaseDate: cowData.purchaseDate,
      saleDate: cowData.saleDate,
      notes: cowData.notes,
    }),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }

  return response.json();
}
