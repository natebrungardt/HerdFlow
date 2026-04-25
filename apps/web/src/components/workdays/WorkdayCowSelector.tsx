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
  onAddCow: (cowId: string) => void;
};

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
  onAddCow,
}: WorkdayCowSelectorProps) {
  return (
    <div className="cowListCard">
      <div className="sectionHeader">
        <h2 className="sectionTitle">Select Cows</h2>
        <span className="sectionSubtle">Click any cow to add to workday</span>
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

      <div className="workdaySelectableListScroll cow-list-container">
        {loading ? (
          <p className="emptyState">Loading cows...</p>
        ) : error ? (
          <p className="emptyState">{error}</p>
        ) : cows.length === 0 ? (
          <p className="emptyState">No cows match your search.</p>
        ) : (
          cows.map((cow) => {
            return (
              <button
                key={cow.id}
                type="button"
                className="cowRowCard workdaySelectableRow cow-card"
                onClick={() => onAddCow(cow.id)}
              >
                <div className="cowRowMain cow-card-content">
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
                  <div className="statusPill needsTreatment">Add</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default WorkdayCowSelector;
