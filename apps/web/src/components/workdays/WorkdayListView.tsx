import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Workday } from "../../types/workday";

type WorkdayListViewProps = {
  workdays: Workday[];
  loading: boolean;
  error: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  getWorkdayHref?: (workday: Workday) => string;
  emptyMessage?: string;
  sectionTitle?: string;
  getWorkdaySupplementaryMeta?: (workday: Workday) => string | null;
  showScheduledDateLabel?: boolean;
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
      return "Draft";
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

function WorkdayListView({
  workdays,
  loading,
  error,
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  getWorkdayHref,
  emptyMessage = "No workdays found.",
  sectionTitle = "Workday Records",
  getWorkdaySupplementaryMeta,
  showScheduledDateLabel = true,
}: WorkdayListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkdays = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return workdays;
    }

    return workdays.filter((workday) => {
      return (
        workday.title.toLowerCase().includes(normalizedSearch) ||
        (workday.summary ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [workdays, searchTerm]);

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">{title}</h1>
              <p className="pageSubtitle">{subtitle}</p>
            </div>

            {ctaLabel && onCtaClick ? (
              <button className="addCowButton" onClick={onCtaClick}>
                {ctaLabel}
              </button>
            ) : null}
          </div>

          <div className="toolbarCard">
            <input
              className="searchInput"
              type="text"
              placeholder="Search by workday title or summary..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="cowListCard">
            <div className="sectionHeader">
              <h2 className="sectionTitle">{sectionTitle}</h2>
              <span className="sectionSubtle">
                {filteredWorkdays.length} shown
              </span>
            </div>

            {loading ? (
              <p className="emptyState">Loading workdays...</p>
            ) : error ? (
              <p className="emptyState">{error}</p>
            ) : filteredWorkdays.length === 0 ? (
              <p className="emptyState">{emptyMessage}</p>
            ) : (
              filteredWorkdays.map((workday) => {
                const href = getWorkdayHref?.(workday);
                const supplementaryMeta = getWorkdaySupplementaryMeta?.(workday);
                const content = (
                  <>
                    <div className="cowRowMain">
                      <div className="cowRowTitle">{workday.title}</div>
                      <div className="cowRowMeta">
                        {workday.summary?.trim() || "No summary yet."}
                      </div>
                      {showScheduledDateLabel ? (
                        <div className="cowRowOwner">
                          Scheduled for {formatWorkdayDate(workday.date)}
                        </div>
                      ) : null}
                      {supplementaryMeta ? (
                        <div className="cowRowSupplementaryMeta">
                          {supplementaryMeta}
                        </div>
                      ) : null}
                    </div>

                    <div className="cowRowActions">
                      <div className={getWorkdayStatusPillClassName(workday.status)}>
                        {getWorkdayStatusLabel(workday.status)}
                      </div>
                    </div>
                  </>
                );

                if (!href) {
                  return (
                    <div key={workday.id} className="cowRowCard workdayRowCard">
                      {content}
                    </div>
                  );
                }

                return (
                  <Link key={workday.id} className="cowRowCard" to={href}>
                    {content}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkdayListView;
