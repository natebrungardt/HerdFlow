import { apiFetch } from "../lib/api";

const APP_NAME = import.meta.env.VITE_APP_NAME;

if (!APP_NAME) {
  throw new Error("VITE_APP_NAME is not configured");
}

export type FeedbackRequest = {
  appName: string;
  name: string;
  email: string;
  message: string;
  company?: string | null;
};

type SubmitFeedbackInput = {
  name: string;
  email: string;
  message: string;
  company?: string | null;
};

export async function submitFeedback({
  name,
  email,
  message,
  company,
}: SubmitFeedbackInput): Promise<void> {
  const payload: FeedbackRequest = {
    appName: APP_NAME,
    name,
    email,
    message,
    company: company?.trim() ? company.trim() : null,
  };

  await apiFetch("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
