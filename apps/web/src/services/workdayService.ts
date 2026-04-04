import type { Workday } from "../types/workday";
import { apiFetch } from "../lib/api";

const WORKDAY_API_BASE_PATH = "/workdays";

export type CreateWorkdayInput = {
  title: string;
  date: string | null;
  summary: string | null;
  cowIds: string[];
};

export type UpdateWorkdayInput = {
  title: string;
  date: string;
  summary: string | null;
};

export async function getActiveWorkdays(): Promise<Workday[]> {
  const response = await apiFetch(WORKDAY_API_BASE_PATH);
  return response.json();
}

export async function getArchivedWorkdays(): Promise<Workday[]> {
  const response = await apiFetch(`${WORKDAY_API_BASE_PATH}/archived`);
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
      cowIds: workdayData.cowIds,
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

export async function archiveWorkday(id: string): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/archive`, {
    method: "PUT",
  });
}

export async function restoreWorkday(id: string): Promise<void> {
  await apiFetch(`${WORKDAY_API_BASE_PATH}/${id}/restore`, {
    method: "PUT",
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
