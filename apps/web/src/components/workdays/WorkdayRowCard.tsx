import { Link } from "react-router-dom";
import type { Workday } from "../../types/workday";

type WorkdayRowCardProps = {
  workday: Workday;
  to?: string;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
};

function formatWorkdayDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getWorkdayStatusLabel(status: Workday["status"]) {
  switch (status) {
    case "InProgress":
      return "In Progress";
    case "Completed":
      return "Completed";
    default:
      return "Planned";
  }
}

function getWorkdayStatusPillClassName(status: Workday["status"]) {
  switch (status) {
    case "InProgress":
      return "statusPill workdayStatusPill inProgress";
    case "Completed":
      return "statusPill workdayStatusPill completed";
    default:
      return "statusPill workdayStatusPill draft";
  }
}

function WorkdayRowCard({
  workday,
  to,
  isSelecting = false,
  isSelected = false,
  onToggle,
}: WorkdayRowCardProps) {
  const innerContent = (
    <>
      {isSelecting && (
        <div
          className={`cowSelectionCheckbox${isSelected ? " checked" : ""}`}
          aria-hidden="true"
        >
          {isSelected && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path
                d="M1 5L4.5 8.5L11 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}
      <div className="cowRowMain">
        <div className="cowRowTitle">{workday.title}</div>
        <div className="cowRowMeta">
          {workday.summary?.trim() || "No summary yet."}
        </div>
        <div className="cowRowOwner">
          Scheduled for {formatWorkdayDate(workday.date)}
        </div>
      </div>
      <div className="cowRowActions">
        <div className={getWorkdayStatusPillClassName(workday.status)}>
          {getWorkdayStatusLabel(workday.status)}
        </div>
      </div>
    </>
  );

  if (isSelecting) {
    return (
      <button
        type="button"
        className={`cowRowCard${isSelected ? " cowRowCardSelected" : ""}`}
        onClick={onToggle}
      >
        {innerContent}
      </button>
    );
  }

  if (to) {
    return (
      <Link className="cowRowCard" to={to}>
        {innerContent}
      </Link>
    );
  }

  return (
    <div className="cowRowCard workdayRowCard">
      {innerContent}
    </div>
  );
}

export default WorkdayRowCard;
