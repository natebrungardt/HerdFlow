const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export type Note = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
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

export async function getNotes(cowId: number): Promise<Note[]> {
  const response = await fetch(`${API_BASE_URL}/${cowId}/notes`);

  if (!response.ok) {
    throw createApiError(await parseError(response));
  }

  return response.json();
}

export async function createNote(
  cowId: number,
  content: string,
): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/${cowId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw createApiError(await parseError(response));
  }

  return response.json();
}

export async function deleteNote(cowId: number, noteId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${cowId}/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw createApiError(await parseError(response));
  }
}

export async function updateNote(
  cowId: number,
  noteId: number,
  content: string,
): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/${cowId}/notes/${noteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw createApiError(await parseError(response));
  }

  return response.json();
}
