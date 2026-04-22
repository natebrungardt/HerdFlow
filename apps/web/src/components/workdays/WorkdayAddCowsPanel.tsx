import type { Cow } from "../../types/cow";
import SelectedCowsSummary from "./SelectedCowsSummary";
import WorkdayCowSelector from "./WorkdayCowSelector";

type WorkdayAddCowsPanelProps = {
  selectedCows: Cow[];
  filteredAvailableCows: Cow[];
  loading: boolean;
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
  addingCows: boolean;
  onRemoveSelectedCow: (cowId: string) => void;
  onAddSelectedCows: () => void;
  onSearchChange: (value: string) => void;
  onToggleHealthStatus: (value: string) => void;
  onToggleLivestockGroup: (value: string) => void;
  onToggleSex: (value: string) => void;
  onTogglePregnancyStatus: (value: string) => void;
  onToggleCow: (cowId: string) => void;
};

function WorkdayAddCowsPanel({
  selectedCows,
  filteredAvailableCows,
  loading,
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
  addingCows,
  onRemoveSelectedCow,
  onAddSelectedCows,
  onSearchChange,
  onToggleHealthStatus,
  onToggleLivestockGroup,
  onToggleSex,
  onTogglePregnancyStatus,
  onToggleCow,
}: WorkdayAddCowsPanelProps) {
  return (
    <section className="dashboardCard workdayAddCowsCard">
      <div className="dataCardHeader">
        <h2 className="cardTitle">Add More Cows</h2>
        <span className="cardSubtle">Search the active herd</span>
      </div>

      <div className="workdayCreateLayout">
        <SelectedCowsSummary
          selectedCows={selectedCows}
          onRemove={onRemoveSelectedCow}
          title="Selected Cows"
          emptyMessage="Select cows from the list below to add them to this workday."
        />

        <div className="workdayDetailActionRow">
          <button
            type="button"
            className="addCowButton"
            onClick={onAddSelectedCows}
            disabled={addingCows || selectedCowIds.length === 0}
          >
            {addingCows ? "Adding..." : "Add Selected Cows"}
          </button>
        </div>

        <WorkdayCowSelector
          cows={filteredAvailableCows}
          loading={loading}
          error=""
          searchTerm={searchTerm}
          selectedCowIds={selectedCowIds}
          activeHealthStatuses={activeHealthStatuses}
          activeLivestockGroups={activeLivestockGroups}
          activeSexes={activeSexes}
          activePregnancyStatuses={activePregnancyStatuses}
          healthStatusFilters={healthStatusFilters}
          livestockGroupFilters={livestockGroupFilters}
          sexFilters={sexFilters}
          pregnancyStatusFilters={pregnancyStatusFilters}
          onSearchChange={onSearchChange}
          onToggleHealthStatus={onToggleHealthStatus}
          onToggleLivestockGroup={onToggleLivestockGroup}
          onToggleSex={onToggleSex}
          onTogglePregnancyStatus={onTogglePregnancyStatus}
          onToggleCow={onToggleCow}
        />
      </div>
    </section>
  );
}

export default WorkdayAddCowsPanel;
