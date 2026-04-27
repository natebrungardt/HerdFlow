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
}: CowRowCardProps) {
  const statusClassName =
    cow.healthStatus === "Healthy"
      ? "statusPill"
      : "statusPill needsTreatment";
  const resolvedSecondaryText = secondaryText ?? supplementaryMeta;

  const content =
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

  if (to) {
    return (
      <Link className="cowRowCard cowCard" to={to}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="cowRowCard cowCard calfHistoryCowCard"
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export default CowRowCard;
