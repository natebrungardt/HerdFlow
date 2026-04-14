import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getUserDisplayName } from "../../lib/account";
import { submitFeedback } from "../../services/feedbackService";
import "../../styles/FeedbackModal.css";

type FeedbackModalProps = {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
};

type FormValues = {
  name: string;
  email: string;
  company: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

function getDefaultName(user: User | null): string {
  const displayName = getUserDisplayName(user);
  return displayName === "Account" ? "" : displayName;
}

function getDefaultValues(user: User | null): FormValues {
  return {
    name: getDefaultName(user),
    email: user?.email ?? "",
    company: "",
    message: "",
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function FeedbackModal({
  isOpen,
  user,
  onClose,
}: FeedbackModalProps) {
  const defaultValues = useMemo(() => getDefaultValues(user), [user]);
  const [formValues, setFormValues] = useState<FormValues>(defaultValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(defaultValues);
    setFormErrors({});
    setSubmitError("");
    setIsSubmitting(false);
    setIsSuccess(false);
  }, [defaultValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleFieldChange(field: keyof FormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    setFormErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });

    setSubmitError("");
  }

  function validate(): FormErrors {
    const errors: FormErrors = {};
    const trimmedName = formValues.name.trim();
    const trimmedEmail = formValues.email.trim();
    const trimmedMessage = formValues.message.trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    }

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!trimmedMessage) {
      errors.message = "Message is required.";
    }

    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await submitFeedback({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        company: formValues.company,
        message: formValues.message.trim(),
      });

      setFormErrors({});
      setSubmitError("");
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to send feedback. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      aria-modal="true"
      className="modalOverlay"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="modalCard feedbackModalCard"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="feedbackModalHeader">
          <div>
            <h3>Send Feedback</h3>
            <p className="feedbackModalIntro">
              What&apos;s working, what's rough, or what should we build next?
            </p>
          </div>
          <button
            aria-label="Close feedback form"
            className="feedbackModalClose"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="feedbackModalForm" onSubmit={handleSubmit}>
          <div className="feedbackModalGrid">
            <label className="feedbackField">
              <span>Name</span>
              <input
                autoComplete="name"
                name="name"
                onChange={(event) =>
                  handleFieldChange("name", event.target.value)
                }
                placeholder="Full name"
                type="text"
                value={formValues.name}
              />
              {!isSuccess && formErrors.name ? (
                <span className="feedbackFieldError">{formErrors.name}</span>
              ) : null}
            </label>

            <label className="feedbackField">
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) =>
                  handleFieldChange("email", event.target.value)
                }
                placeholder="you@example.com"
                type="email"
                value={formValues.email}
              />
              {!isSuccess && formErrors.email ? (
                <span className="feedbackFieldError">{formErrors.email}</span>
              ) : null}
            </label>
          </div>

          <label className="feedbackField">
            <span>Company (optional)</span>
            <input
              autoComplete="organization"
              name="company"
              onChange={(event) =>
                handleFieldChange("company", event.target.value)
              }
              placeholder="Company name"
              type="text"
              value={formValues.company}
            />
          </label>

          <label className="feedbackField">
            <span>What would you like to share?</span>
            <textarea
              name="message"
              onChange={(event) =>
                handleFieldChange("message", event.target.value)
              }
              placeholder="What’s working, what feels off, or what should we build next?

"
              rows={7}
              value={formValues.message}
            />
            {!isSuccess && formErrors.message ? (
              <span className="feedbackFieldError">{formErrors.message}</span>
            ) : null}
          </label>

          {submitError ? (
            <div className="feedbackSubmitError">{submitError}</div>
          ) : null}

          {isSuccess ? (
            <div className="feedbackSubmitSuccess">
              Thanks. Your message has been sent to support.
            </div>
          ) : null}

          <div className="modalActions feedbackModalActions">
            <button className="cancelButton" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="feedbackSubmitButton"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
