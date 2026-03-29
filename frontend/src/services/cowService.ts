import type { Cow } from "../types/cow";
import { apiFetch } from "../lib/api";

export type CreateCowInput = {
  tagNumber: string;
  ownerName: string;
  livestockGroup: string;
  breed: string;
  sex: string;
  healthStatus: string;
  heatStatus: string | null;
  pregnancyStatus: string | null;
  hasCalf: boolean;
  dateOfBirth: string | null;
  purchaseDate: string | null;
  saleDate: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  notes: string | null;
};

export async function getCows(): Promise<Cow[]> {
  const response = await apiFetch("/cows");
  return response.json();
}

export async function createCow(cowData: CreateCowInput): Promise<Cow> {
  const response = await apiFetch("/cows", {
    method: "POST",
    body: JSON.stringify({
      tagNumber: cowData.tagNumber,
      ownerName: cowData.ownerName,
      livestockGroup: cowData.livestockGroup,
      sex: cowData.sex,
      breed: cowData.breed,
      dateOfBirth: cowData.dateOfBirth,
      healthStatus: cowData.healthStatus,
      heatStatus: cowData.heatStatus,
      pregnancyStatus: cowData.pregnancyStatus,
      hasCalf: cowData.hasCalf,
      purchasePrice: cowData.purchasePrice,
      salePrice: cowData.salePrice,
      purchaseDate: cowData.purchaseDate,
      saleDate: cowData.saleDate,
      notes: cowData.notes,
    }),
  });

  return response.json();
}

export async function getCowById(id: string): Promise<Cow> {
  const response = await apiFetch(`/cows/${id}`);
  return response.json();
}

export async function archiveCow(id: string): Promise<void> {
  await apiFetch(`/cows/${id}/archive`, {
    method: "PUT",
  });
}

export async function deleteCow(id: string): Promise<void> {
  await apiFetch(`/cows/${id}`, {
    method: "DELETE",
  });
}
export async function getRemovedCows(): Promise<Cow[]> {
  const response = await apiFetch("/cows/removed");
  return response.json();
}

export async function restoreCow(id: string): Promise<void> {
  await apiFetch(`/cows/${id}/restore`, {
    method: "PUT",
  });
}

export async function updateCow(
  id: string,
  cowData: CreateCowInput,
): Promise<Cow> {
  const response = await apiFetch(`/cows/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      tagNumber: cowData.tagNumber,
      ownerName: cowData.ownerName,
      livestockGroup: cowData.livestockGroup,
      sex: cowData.sex,
      breed: cowData.breed,
      dateOfBirth: cowData.dateOfBirth,
      healthStatus: cowData.healthStatus,
      heatStatus: cowData.heatStatus,
      pregnancyStatus: cowData.pregnancyStatus,
      hasCalf: cowData.hasCalf,
      purchasePrice: cowData.purchasePrice,
      salePrice: cowData.salePrice,
      purchaseDate: cowData.purchaseDate,
      saleDate: cowData.saleDate,
      notes: cowData.notes,
    }),
  });

  return response.json();
}
