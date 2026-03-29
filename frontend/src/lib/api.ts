import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

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

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw createApiError(await parseError(response));
  }

  return response;
}
