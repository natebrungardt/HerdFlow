import { Link } from "react-router-dom";
import type { Cow } from "../../types/cow";
import "../../styles/AllCows.css";

type CowRowCardProps = {
  cow: Cow;
  supplementaryMeta?: string | null;
  secondaryText?: string | null;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "calf-history";
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
};

function formatHealthStatus(status: string | null | undefined) {
  return (status ?? "Unknown").replace(/([A-Z])/g, " $1").trim();
}

function formatDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function formatParentTag(parent: Cow["sire"] | Cow["dam"], fallback?: string | null) {
  if (parent?.tagNumber) {
    return parent.tagNumber;
  }

  if (fallback?.trim()) {
    return fallback.trim();
  }

  return "—";
}

function CowRowCard({
  cow,
  supplementaryMeta,
  secondaryText,
  to,
  onClick,
  variant = "default",
  isSelecting = false,
  isSelected = false,
  onToggle,
}: CowRowCardProps) {
  const statusClassName =
    cow.healthStatus === "Healthy"
      ? "statusPill"
      : "statusPill needsTreatment";
  const resolvedSecondaryText = secondaryText ?? supplementaryMeta;

  const innerContent =
    variant === "calf-history" ? (
      <>
        <div className="cowRowMain cowCardContent leftContent">
          <div className="cowRowTitle">
            <span className="tagText">Tag #{cow.tagNumber}</span>
            {cow.isRemoved ? (
              <span className="calfArchivedBadge">Archived</span>
            ) : null}
          </div>
          <div className="cowRowMeta secondaryText">
            {formatDisplayValue(cow.sex)} • {formatDisplayValue(cow.color)} •{" "}
            {resolvedSecondaryText ?? "DOB: —"}
          </div>
          <div className="cowRowRelationship relationshipText">
            Dam: {formatParentTag(cow.dam, cow.damName)} • Sire:{" "}
            {formatParentTag(cow.sire, cow.sireName)}
          </div>
          <div className="cowRowSupplementaryMeta tertiaryText detailsText">
            Birth Weight: {formatDisplayValue(cow.birthWeight)} • Ease of Birth:{" "}
            {formatDisplayValue(cow.easeOfBirth)}
          </div>
        </div>

        <div className="cowRowActions rightContent">
          <div className={statusClassName}>{formatHealthStatus(cow.healthStatus)}</div>
        </div>
      </>
    ) : (
      <>
        {isSelecting && (
          <div className={`cowSelectionCheckbox${isSelected ? " checked" : ""}`} aria-hidden="true">
            {isSelected && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
        <div className="cowRowMain">
          <div className="cowRowTitle">
            Tag #{cow.tagNumber}
            {cow.isRemoved ? <span className="calfArchivedBadge">Archived</span> : null}
          </div>
          <div className="cowRowMeta">
            {cow.livestockGroup || "Unassigned"} •{" "}
            {formatHealthStatus(cow.healthStatus)} • {cow.sex || "Unknown sex"} •{" "}
            {cow.pregnancyStatus || "No pregnancy status"}
          </div>
          <div className="cowRowOwner">
            Owner: {cow.ownerName || "Unknown owner"}
          </div>
          {resolvedSecondaryText ? (
            <div className="cowRowSupplementaryMeta">{resolvedSecondaryText}</div>
          ) : null}
        </div>

        <div className="cowRowActions">
          <div className={statusClassName}>{formatHealthStatus(cow.healthStatus)}</div>
        </div>
      </>
    );

  if (isSelecting) {
    return (
      <button
        type="button"
        className={`cowRowCard cowCard${isSelected ? " cowRowCardSelected" : ""}`}
        onClick={onToggle}
      >
        {innerContent}
      </button>
    );
  }

  if (to) {
    return (
      <Link className="cowRowCard cowCard" to={to}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="cowRowCard cowCard calfHistoryCowCard"
      onClick={onClick}
    >
      {innerContent}
    </button>
  );
}

export default CowRowCard;
