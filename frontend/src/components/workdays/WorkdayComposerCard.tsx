import type { ReactNode } from "react";

type WorkdayComposerCardProps = {
  title: string;
  date: string;
  summary: string;
  error: string;
  saving: boolean;
  heading?: string;
  subtle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  extraAction?: ReactNode;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

function WorkdayComposerCard({
  title,
  date,
  summary,
  error,
  saving,
  heading = "Workday Details",
  subtle = "Create a draft for the crew",
  submitLabel = "Save Workday",
  cancelLabel = "Cancel",
  extraAction,
  onChange,
  onSubmit,
  onCancel,
}: WorkdayComposerCardProps) {
  return (
    <div className="card workdayComposerCard">
      <div className="sectionHeader">
        <h2 className="sectionTitle">{heading}</h2>
        <span className="sectionSubtle">{subtle}</span>
      </div>

      <form className="workdayComposerForm" onSubmit={onSubmit}>
        <label className="workdayFieldLabel" htmlFor="title">
          Workday Name
        </label>
        <input
          id="title"
          name="title"
          className="searchInput workdayTextInput"
          value={title}
          onChange={onChange}
          placeholder="Workday 1"
          maxLength={120}
          required
        />

        <label className="workdayFieldLabel" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          className="searchInput workdayTextInput"
          value={date}
          onChange={onChange}
        />

        <label className="workdayFieldLabel" htmlFor="summary">
          General Notes
        </label>
        <textarea
          id="summary"
          name="summary"
          className="workdayNotesInput"
          value={summary}
          onChange={onChange}
          placeholder="General notes for the workday..."
          rows={5}
        />

        {error ? <p className="workdayInlineError">{error}</p> : null}

        <div className="workdayComposerActions">
          {extraAction}
          <button
            type="button"
            className="workdaySecondaryButton"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button type="submit" className="addCowButton" disabled={saving}>
            {saving ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkdayComposerCard;
