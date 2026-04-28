import { useMemo, useState } from "react";
import type { Workday } from "../../types/workday";
import WorkdayRowCard from "./WorkdayRowCard";

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
  isSelecting?: boolean;
  selectedWorkdayIds?: string[];
  onEnterSelect?: () => void;
  onCancelSelect?: () => void;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onBulkComplete?: () => void;
  onBulkDelete?: () => void;
};

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
  getWorkdaySupplementaryMeta: _getWorkdaySupplementaryMeta,
  showScheduledDateLabel: _showScheduledDateLabel = true,
  isSelecting = false,
  selectedWorkdayIds = [],
  onEnterSelect,
  onCancelSelect,
  onToggleSelect,
  onSelectAll,
  onBulkComplete,
  onBulkDelete,
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

  const showActionBar = isSelecting && selectedWorkdayIds.length > 0;

  return (
    <div className="allCowsPage">
      <div className={`allCowsShell${showActionBar ? " hasActionBar" : ""}`}>
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">
                {isSelecting
                  ? selectedWorkdayIds.length === 0
                    ? "Select workdays"
                    : `${selectedWorkdayIds.length} selected`
                  : title}
              </h1>
              {!isSelecting && <p className="pageSubtitle">{subtitle}</p>}
            </div>

            <div className="headerActions">
              {isSelecting ? (
                <>
                  {onSelectAll ? (
                    <button className="selectButton" onClick={onSelectAll}>
                      {selectedWorkdayIds.length === workdays.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  ) : null}
                  <button className="cancelSelectButton" onClick={onCancelSelect}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {ctaLabel && onCtaClick ? (
                    <button className="addCowButton" onClick={onCtaClick}>
                      {ctaLabel}
                    </button>
                  ) : null}
                  {onEnterSelect ? (
                    <button className="selectButton" onClick={onEnterSelect}>
                      Select
                    </button>
                  ) : null}
                </>
              )}
            </div>
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
                const isSelected = selectedWorkdayIds.includes(workday.id);

                return (
                  <WorkdayRowCard
                    key={workday.id}
                    workday={workday}
                    to={isSelecting ? undefined : getWorkdayHref?.(workday)}
                    isSelecting={isSelecting}
                    isSelected={isSelected}
                    onToggle={
                      isSelecting
                        ? () => onToggleSelect?.(workday.id)
                        : undefined
                    }
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {showActionBar && (
        <div className="bulkActionBar">
          <span className="bulkActionCount">
            {selectedWorkdayIds.length} selected
          </span>
          <div className="bulkActionButtons">
            <button
              className="bulkActionButton bulkActionHealthy"
              onClick={onBulkComplete}
            >
              Mark Complete
            </button>
            <button
              className="bulkActionButton danger"
              onClick={onBulkDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkdayListView;
