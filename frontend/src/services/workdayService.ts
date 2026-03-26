import type { Workday } from "../types/workday";

const COW_API_BASE_URL = import.meta.env.VITE_API_URL;

if (!COW_API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

const WORKDAY_API_BASE_URL = COW_API_BASE_URL.replace(/\/cows\/?$/, "/workdays");

type ApiError = {
  status?: number;
  message: string;
};

export type CreateWorkdayInput = {
  title: string;
  date: string | null;
  summary: string | null;
  cowIds: number[];
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

export async function getActiveWorkdays(): Promise<Workday[]> {
  const response = await fetch(WORKDAY_API_BASE_URL);

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }

  return response.json();
}

export async function createWorkday(
  workdayData: CreateWorkdayInput,
): Promise<Workday> {
  const response = await fetch(WORKDAY_API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: workdayData.title,
      date: workdayData.date,
      summary: workdayData.summary,
      cowIds: workdayData.cowIds,
    }),
  });

  if (!response.ok) {
    const error = await parseError(response);
    throw createApiError(error);
  }

  return response.json();
}
