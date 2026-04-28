import type { Cow } from "../../types/cow";

type WorkdayCowSelectorProps = {
  cows: Cow[];
  loading: boolean;
  error: string;
  searchTerm: string;
  activeHealthStatuses: string[];
  activeLivestockGroups: string[];
  activeSexes: string[];
  activePregnancyStatuses: string[];
  healthStatusFilters: string[];
  livestockGroupFilters: string[];
  sexFilters: string[];
  pregnancyStatusFilters: string[];
  onSearchChange: (value: string) => void;
  onToggleHealthStatus: (value: string) => void;
  onToggleLivestockGroup: (value: string) => void;
  onToggleSex: (value: string) => void;
  onTogglePregnancyStatus: (value: string) => void;
  selectedCowIds: Set<string>;
  isAdding: boolean;
  onToggleCow: (cowId: string) => void;
  onSelectAll: () => void;
  onAdd: () => void;
};

function formatCowEnumValue(value: string | null | undefined): string {
  if (!value) return "";
  if (value === "NeedsTreatment") return "Needs Treatment";
  return value.replace(/([A-Z])/g, " $1").trim();
}

function WorkdayCowSelector({
  cows,
  loading,
  error,
  searchTerm,
  activeHealthStatuses,
  activeLivestockGroups,
  activeSexes,
  activePregnancyStatuses,
  healthStatusFilters,
  livestockGroupFilters,
  sexFilters,
  pregnancyStatusFilters,
  onSearchChange,
  onToggleHealthStatus,
  onToggleLivestockGroup,
  onToggleSex,
  onTogglePregnancyStatus,
  selectedCowIds,
  isAdding,
  onToggleCow,
  onSelectAll,
  onAdd,
}: WorkdayCowSelectorProps) {
  const allSelected = cows.length > 0 && cows.every((c) => selectedCowIds.has(c.id));

  function renderCowMeta(cow: Cow) {
    return [
      formatCowEnumValue(cow.livestockGroup) || "Unassigned",
      formatCowEnumValue(cow.healthStatus) || "Unknown",
      cow.sex || "Unknown sex",
      cow.pregnancyStatus || "No pregnancy status",
    ].join(" • ");
  }

  function renderOwnerLine(cow: Cow) {
    const name = cow.ownerName?.trim();
    if (!name || name === "Unknown owner") return null;
    return <div className="cowRowOwner">Owner: {name}</div>;
  }

  return (
    <div className="cowListCard">
      <input
        className="searchInput"
        type="text"
        placeholder="Search by tag number or owner name..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="filterRow workdayFilterRow">
        {healthStatusFilters.map((filter) => (
          <button
            key={filter}
            className={`filterChip${activeHealthStatuses.includes(filter) ? " active" : ""}`}
            onClick={() => onToggleHealthStatus(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
        {livestockGroupFilters.map((filter) => (
          <button
            key={filter}
            className={`filterChip${activeLivestockGroups.includes(filter) ? " active" : ""}`}
            onClick={() => onToggleLivestockGroup(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
        {sexFilters.map((filter) => (
          <button
            key={filter}
            className={`filterChip${activeSexes.includes(filter) ? " active" : ""}`}
            onClick={() => onToggleSex(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
        {pregnancyStatusFilters.map((filter) => (
          <button
            key={filter}
            className={`filterChip${activePregnancyStatuses.includes(filter) ? " active" : ""}`}
            onClick={() => onTogglePregnancyStatus(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="cowSelectorCountRow">
        <span className="sectionSubtle">
          {cows.length} {cows.length === 1 ? "cow" : "cows"} shown
        </span>
        <button
          type="button"
          className="cowSelectorSelectAll"
          onClick={onSelectAll}
        >
          {allSelected ? "Deselect all" : `Select all ${cows.length}`}
        </button>
      </div>

      <div className="workdaySelectableListScroll cow-list-container">
        {loading ? (
          <p className="emptyState">Loading cows...</p>
        ) : error ? (
          <p className="emptyState">{error}</p>
        ) : cows.length === 0 ? (
          <p className="emptyState">No cows match your search.</p>
        ) : (
          cows.map((cow) => {
            const isSelected = selectedCowIds.has(cow.id);
            return (
              <button
                key={cow.id}
                type="button"
                className={`cowRowCard workdaySelectableRow cow-card${isSelected ? " cowRowCardSelected" : ""}`}
                onClick={() => onToggleCow(cow.id)}
              >
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
                <div className="cowRowMain cow-card-content">
                  <div className="cowRowTitle">Tag #{cow.tagNumber}</div>
                  <div className="cowRowMeta">{renderCowMeta(cow)}</div>
                  {renderOwnerLine(cow)}
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedCowIds.size > 0 && (
        <div className="cowSelectorActionBar">
          <span className="cowSelectorActionCount">
            {selectedCowIds.size}{" "}
            {selectedCowIds.size === 1 ? "cow" : "cows"} selected
          </span>
          <button
            className="addCowButton"
            onClick={onAdd}
            disabled={isAdding}
            type="button"
          >
            {isAdding ? "Adding..." : "Add to Workday"}
          </button>
        </div>
      )}
    </div>
  );
}

export default WorkdayCowSelector;
