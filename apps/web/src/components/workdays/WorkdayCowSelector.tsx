import type { Cow } from "../../types/cow";

type WorkdayCowSelectorProps = {
  cows: Cow[];
  loading: boolean;
  error: string;
  searchTerm: string;
  selectedCowIds: string[];
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
  onToggleCow: (cowId: string) => void;
};

function WorkdayCowSelector({
  cows,
  loading,
  error,
  searchTerm,
  selectedCowIds,
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
  onToggleCow,
}: WorkdayCowSelectorProps) {
  return (
    <div className="cowListCard">
      <div className="sectionHeader">
        <h2 className="sectionTitle">Select Cows</h2>
        <span className="sectionSubtle">
          {selectedCowIds.length} selected for this workday
        </span>
      </div>

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
            className={`filterChip ${activeHealthStatuses.includes(filter) ? "active" : ""}`.trim()}
            onClick={() => onToggleHealthStatus(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}

        {livestockGroupFilters.map((filter) => (
          <button
            key={filter}
            className={`filterChip ${activeLivestockGroups.includes(filter) ? "active" : ""}`.trim()}
            onClick={() => onToggleLivestockGroup(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}

        {sexFilters.map((filter) => (
          <button
            key={filter}
            className={`filterChip ${activeSexes.includes(filter) ? "active" : ""}`.trim()}
            onClick={() => onToggleSex(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}

        {pregnancyStatusFilters.map((filter) => (
          <button
            key={filter}
            className={`filterChip ${activePregnancyStatuses.includes(filter) ? "active" : ""}`.trim()}
            onClick={() => onTogglePregnancyStatus(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="emptyState">Loading cows...</p>
      ) : error ? (
        <p className="emptyState">{error}</p>
      ) : cows.length === 0 ? (
        <p className="emptyState">No cows match your search.</p>
      ) : (
        cows.map((cow) => {
          const isSelected = selectedCowIds.includes(cow.id);

          return (
            <button
              key={cow.id}
              type="button"
              className={`cowRowCard workdaySelectableRow ${isSelected ? "selected" : ""}`.trim()}
              onClick={() => onToggleCow(cow.id)}
              aria-pressed={isSelected}
            >
              <div className="cowRowMain">
                <div className="cowRowTitle">Tag #{cow.tagNumber}</div>
                <div className="cowRowMeta">
                  {cow.livestockGroup || "Unassigned"} •{" "}
                  {cow.healthStatus || "Unknown health status"} •{" "}
                  {cow.sex || "Unknown sex"} •{" "}
                  {cow.pregnancyStatus || "No pregnancy status"}
                </div>
                <div className="cowRowOwner">
                  Owner: {cow.ownerName || "Unknown owner"}
                </div>
              </div>

              <div className="cowRowActions">
                <div
                  className={
                    isSelected ? "statusPill" : "statusPill needsTreatment"
                  }
                >
                  {isSelected ? "Added" : "Available"}
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

export default WorkdayCowSelector;
