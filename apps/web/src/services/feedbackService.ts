import { supabase } from "../lib/supabase";

const APP_NAME = import.meta.env.VITE_APP_NAME;
const RAW_API_BASE_URL = import.meta.env.VITE_API_URL;

function normalizeApiBaseUrl(rawBaseUrl: string): string {
  const trimmed = rawBaseUrl.trim().replace(/\/+$/, "");

  if (trimmed.endsWith("/api")) return trimmed;

  return `${trimmed}/api`;
}

if (!APP_NAME) {
  throw new Error("VITE_APP_NAME is not configured");
}

if (!RAW_API_BASE_URL) {
  throw new Error("VITE_API_URL is not configured");
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);

type SubmitFeedbackInput = {
  name: string;
  email: string;
  message: string;
  company?: string | null;
  file?: File | null;
};

export async function submitFeedback({
  name,
  email,
  message,
  company,
  file,
}: SubmitFeedbackInput): Promise<void> {
  const formData = new FormData();

  formData.append("appName", APP_NAME);
  formData.append("name", name);
  formData.append("email", email);
  formData.append("message", message);

  if (company?.trim()) {
    formData.append("company", company.trim());
  }

  // 👇 ALWAYS safe to include conditionally
  if (file) {
    formData.append("file", file);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers,
    body: formData, // 👈 ALWAYS FormData
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Feedback error:", response.status, text);
    throw new Error(text || "Failed to send feedback. Please try again.");
  }
}
