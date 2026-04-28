import type { Cow } from "../types/cow";
import { slugifyFilePart } from "../lib/account";
import { apiFetch } from "../lib/api";

export type CreateCowInput = {
  tagNumber: string;
  ownerName: string | null;
  livestockGroup: string | null;
  breed: string;
  sex: string;
  name: string | null;
  color: string | null;
  healthStatus: string;
  heatStatus: string | null;
  pregnancyStatus: string | null;
  hasCalf: boolean;
  dateOfBirth: string | null;
  birthWeight: number | null;
  easeOfBirth: string | null;
  sireId: string | null;
  sireName: string | null;
  damId: string | null;
  damName: string | null;
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

export async function getAllCows(): Promise<Cow[]> {
  const [activeCows, removedCows] = await Promise.all([
    getCows(),
    getRemovedCows(),
  ]);
  const cowsById = new Map<string, Cow>();

  for (const cow of [...activeCows, ...removedCows]) {
    cowsById.set(cow.id, cow);
  }

  return Array.from(cowsById.values());
}

function getFilenameFromDisposition(header: string | null): string {
  if (!header) {
    return "herd-export.csv";
  }

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = header.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] ?? "herd-export.csv";
}

type ExportCowsCsvOptions = {
  farmName?: string;
};

function buildExportFilename(defaultFileName: string, farmName?: string): string {
  const farmSlug = farmName ? slugifyFilePart(farmName) : "";

  if (!farmSlug) {
    return defaultFileName;
  }

  const extensionIndex = defaultFileName.lastIndexOf(".");
  const extension =
    extensionIndex >= 0 ? defaultFileName.slice(extensionIndex) : ".csv";

  const dateMatch = defaultFileName.match(/(\d{4}-\d{2}-\d{2})/);
  const datePart = dateMatch ? `-${dateMatch[1]}` : "";

  return `${farmSlug}-herd-data${datePart}${extension}`;
}

function prependFarmMetadata(csvText: string, farmName?: string): string {
  if (!farmName) {
    return csvText;
  }

  const escaped = farmName.replace(/"/g, '""');
  return `Farm Name,"${escaped}"\n\n${csvText}`;
}

export async function exportCowsCsv(
  options: ExportCowsCsvOptions = {},
): Promise<void> {
  const response = await apiFetch("/cows/export");
  const fileName = buildExportFilename(
    getFilenameFromDisposition(
      response.headers.get("Content-Disposition"),
    ),
    options.farmName,
  );
  const csvText = await response.text();
  const blob = new Blob(
    [prependFarmMetadata(csvText, options.farmName)],
    { type: "text/csv; charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
      name: cowData.name,
      color: cowData.color,
      dateOfBirth: cowData.dateOfBirth,
      birthWeight: cowData.birthWeight,
      easeOfBirth: cowData.easeOfBirth,
      sireId: cowData.sireId,
      sireName: cowData.sireName,
      damId: cowData.damId,
      damName: cowData.damName,
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

export async function createCalf(damId: string): Promise<Cow> {
  const response = await apiFetch(`/cows/${damId}/calves`, {
    method: "POST",
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

export type ImportResult = {
  importedCount: number;
  skippedRows: ImportSkippedRow[];
  warningRows: ImportWarningRow[];
};

export type ImportSkippedRow = {
  rowNumber: number;
  reason: string;
  tagNumber: string | null;
};

export type ImportWarningRow = {
  rowNumber: number;
  field: string;
  message: string;
};

export async function downloadImportTemplate(): Promise<void> {
  const response = await apiFetch("/cows/import/template");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "herd-import-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importCowsCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch("/cows/import", {
    method: "POST",
    body: formData,
  });
  return response.json();
}

export async function bulkUpdateCows(
  cowIds: string[],
  action: "markHealthy" | "markNeedsTreatment" | "archive",
): Promise<void> {
  await apiFetch("/cows/bulk-update", {
    method: "PUT",
    body: JSON.stringify({ cowIds, action }),
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
      name: cowData.name,
      color: cowData.color,
      dateOfBirth: cowData.dateOfBirth,
      birthWeight: cowData.birthWeight,
      easeOfBirth: cowData.easeOfBirth,
      sireId: cowData.sireId,
      sireName: cowData.sireName,
      damId: cowData.damId,
      damName: cowData.damName,
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
