import type { Cow } from "../../types/cow";
import WorkdayCowSelector from "./WorkdayCowSelector";

type WorkdayAddCowsPanelProps = {
  filteredAvailableCows: Cow[];
  loading: boolean;
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

function WorkdayAddCowsPanel({
  filteredAvailableCows,
  loading,
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
}: WorkdayAddCowsPanelProps) {
  return (
    <section className="dashboardCard workdayAddCowsCard">
      <div className="dataCardHeader">
        <h2 className="cardTitle">Add More Cows</h2>
        <span className="cardSubtle">Search the active herd</span>
      </div>

      <div className="workdayCreateLayout">
        <WorkdayCowSelector
          cows={filteredAvailableCows}
          loading={loading}
          error=""
          searchTerm={searchTerm}
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
          onAddCow={onAddCow}
        />
      </div>
    </section>
  );
}

export default WorkdayAddCowsPanel;
