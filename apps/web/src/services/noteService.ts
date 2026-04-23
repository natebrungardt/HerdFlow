import { apiFetch } from "../lib/api";

export type Note = {
  id: string;
  content: string;
  source?: string | null;
  workdayId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateNoteInput = {
  content: string;
  source?: string | null;
  workdayId?: string | null;
};

export async function getNotes(cowId: string): Promise<Note[]> {
  const response = await apiFetch(`/cows/${cowId}/notes`);
  return response.json();
}

export async function createNote(
  cowId: string,
  input: string | CreateNoteInput,
): Promise<Note> {
  const payload =
    typeof input === "string"
      ? { content: input }
      : {
          content: input.content,
          source: input.source ?? null,
          workdayId: input.workdayId ?? null,
        };

  const response = await apiFetch(`/cows/${cowId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
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
