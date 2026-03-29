import { apiFetch } from "../lib/api";

export type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export async function getNotes(cowId: string): Promise<Note[]> {
  const response = await apiFetch(`/cows/${cowId}/notes`);
  return response.json();
}

export async function createNote(
  cowId: string,
  content: string,
): Promise<Note> {
  const response = await apiFetch(`/cows/${cowId}/notes`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  return response.json();
}

export async function deleteNote(cowId: string, noteId: string): Promise<void> {
  await apiFetch(`/cows/${cowId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

export async function updateNote(
  cowId: string,
  noteId: string,
  content: string,
): Promise<Note> {
  const response = await apiFetch(`/cows/${cowId}/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });

  return response.json();
}
