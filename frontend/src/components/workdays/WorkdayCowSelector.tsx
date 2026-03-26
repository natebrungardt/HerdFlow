import type { Cow } from "../../types/cow";

type WorkdayCowSelectorProps = {
  cows: Cow[];
  loading: boolean;
  error: string;
  searchTerm: string;
  selectedCowIds: number[];
  onSearchChange: (value: string) => void;
  onToggleCow: (cowId: number) => void;
};

function WorkdayCowSelector({
  cows,
  loading,
  error,
  searchTerm,
  selectedCowIds,
  onSearchChange,
  onToggleCow,
}: WorkdayCowSelectorProps) {
  return (
    <div className="cowListCard">
      <div className="sectionHeader">
        <h2 className="sectionTitle">Select Cows</h2>
        <span className="sectionSubtle">
          {selectedCowIds.length} added to this workday
        </span>
      </div>

      <input
        className="searchInput"
        type="text"
        placeholder="Search by tag number or owner name..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
      />

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
            <label
              key={cow.id}
              className={`cowRowCard workdaySelectableRow ${isSelected ? "selected" : ""}`.trim()}
            >
              <div className="workdayCheckboxWrap">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleCow(cow.id)}
                />
              </div>

              <div className="cowRowMain">
                <div className="cowRowTitle">Tag #{cow.tagNumber}</div>
                <div className="cowRowMeta">
                  {cow.livestockGroup || "Unassigned"} •{" "}
                  {cow.sex || "Unknown sex"} •{" "}
                  {cow.pregnancyStatus || "No pregnancy status"}
                </div>
                <div className="cowRowOwner">
                  Owner: {cow.ownerName || "Unknown owner"}
                </div>
              </div>

              <div className="cowRowActions">
                <div className={isSelected ? "statusPill" : "statusPill needsTreatment"}>
                  {isSelected ? "Added" : "Available"}
                </div>
              </div>
            </label>
          );
        })
      )}
    </div>
  );
}

export default WorkdayCowSelector;
