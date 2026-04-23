import type { Workday, WorkdayAction } from "../types/workday";
import { apiFetch } from "../lib/api";

const WORKDAY_API_BASE_PATH = "/workdays";

export type CreateWorkdayInput = {
  title: string;
  date: string | null;
  summary: string | null;
};

export type UpdateWorkdayInput = {
  title: string;
  date: string;
  summary: string | null;
};

export type CreateWorkdayActionInput = {
  name: string;
};

export type ToggleWorkdayEntryInput = {
  cowId: string;
  actionId: string;
  completed: boolean;
};

export type UpdateWorkdayCowStatusInput = {
  cowId: string;
  isWorked: boolean;
};

export async function getActiveWorkdays(): Promise<Workday[]> {
  const response = await apiFetch(WORKDAY_API_BASE_PATH);
  return response.json();
}

export async function getCompletedWorkdays(): Promise<Workday[]> {
  const response = await apiFetch(`${WORKDAY_API_BASE_PATH}/completed`);
  return response.json();
}

export async function getWorkdayById(id: string): Promise<Workday> {
  const response = await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}`);
  return response.json();
}

export async function createWorkday(
  workdayData: CreateWorkdayInput,
): Promise<Workday> {
  const response = await apiFetch(WORKDAY_API_BASE_PATH, {
    method: "POST",
    body: JSON.stringify({
      title: workdayData.title,
      date: workdayData.date,
      summary: workdayData.summary,
    }),
  });

  return response.json();
}

export async function updateWorkday(
  id: string,
  workdayData: UpdateWorkdayInput,
): Promise<Workday> {
  const response = await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(workdayData),
  });

  return response.json();
}

export async function deleteWorkday(id: string): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}`, {
    method: "DELETE",
  });
}

export async function addCowsToWorkday(
  id: string,
  cowIds: string[],
): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/cows`, {
    method: "POST",
    body: JSON.stringify({ cowIds }),
  });
}

export async function removeCowFromWorkday(
  id: string,
  cowId: string,
): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/cows/${cowId}`, {
    method: "DELETE",
  });
}

export async function addWorkdayAction(
  id: string,
  action: CreateWorkdayActionInput,
): Promise<WorkdayAction> {
  const response = await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/actions`, {
    method: "POST",
    body: JSON.stringify(action),
  });

  return response.json();
}

export async function removeWorkdayAction(
  id: string,
  actionId: string,
): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/actions/${actionId}`, {
    method: "DELETE",
  });
}

export async function startWorkday(id: string): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/start`, {
    method: "POST",
  });
}

export async function completeWorkday(id: string): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/complete`, {
    method: "POST",
  });
}

export async function resetWorkday(workdayId: string): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${workdayId}/reset`, {
    method: "POST",
  });
}

export async function updateCowWorkdayStatus(
  id: string,
  input: UpdateWorkdayCowStatusInput,
): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/cows/${input.cowId}/status`, {
    method: "PUT",
    body: JSON.stringify({ isWorked: input.isWorked }),
  });
}

export async function toggleWorkdayEntry(
  id: string,
  entry: ToggleWorkdayEntryInput,
): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/toggle`, {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function setEntryCompletion(
  workdayId: string,
  cowId: string,
  actionId: string,
  completed: boolean,
): Promise<void> {
  await toggleWorkdayEntry(workdayId, {
    cowId,
    actionId,
    completed,
  });
}
