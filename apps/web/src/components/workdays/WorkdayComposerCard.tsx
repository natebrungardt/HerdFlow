import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from "react";

type WorkdayComposerCardProps = {
  title: string;
  date: string;
  summary: string;
  error: string;
  saving: boolean;
  saveStatus?: string | null;
  heading?: string;
  subtle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  cancelButtonClassName?: string;
  extraAction?: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCommit?: () => void | Promise<void>;
  onKeyDown?: (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCancel: () => void;
};

function WorkdayComposerCard({
  title,
  date,
  summary,
  error,
  saving,
  saveStatus,
  heading = "Workday Details",
  subtle = "Create a draft for the crew",
  submitLabel = "Save Workday",
  cancelLabel = "Cancel",
  cancelButtonClassName = "workdaySecondaryButton",
  extraAction,
  onChange,
  onCommit,
  onKeyDown,
  onSubmit,
  onCancel,
}: WorkdayComposerCardProps) {
  return (
    <div className="card workdayComposerCard">
      <div className="sectionHeader">
        <div>
          <h2 className="sectionTitle">{heading}</h2>
          <span className="sectionSubtle">{subtle}</span>
        </div>
        {saveStatus ? (
          <span
            className={`workdaySaveStatus ${saving ? "saving" : "saved"}`.trim()}
          >
            {saveStatus}
          </span>
        ) : null}
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
          onBlur={onCommit}
          onKeyDown={onKeyDown}
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
          onBlur={onCommit}
          onKeyDown={onKeyDown}
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
          onBlur={onCommit}
          onKeyDown={onKeyDown}
          placeholder="General notes for the workday..."
          rows={5}
        />

        {error ? <p className="workdayInlineError">{error}</p> : null}

        <div className="workdayComposerActions">
          {extraAction}
          <button
            type="button"
            className={cancelButtonClassName}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          {onSubmit ? (
            <button type="submit" className="addCowButton" disabled={saving}>
              {saving ? "Saving..." : submitLabel}
            </button>
          ) : saving ? (
            <span className="sectionSubtle">Saving...</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default WorkdayComposerCard;
