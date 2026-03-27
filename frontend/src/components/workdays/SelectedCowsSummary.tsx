import type { Cow } from "../../types/cow";

type SelectedCowsSummaryProps = {
  selectedCows: Cow[];
  onRemove: (cowId: number) => void;
  title?: string;
  emptyMessage?: string;
  countLabel?: string;
};

function SelectedCowsSummary({
  selectedCows,
  onRemove,
  title = "Added to Workday",
  emptyMessage = "Select cows from the list below to add them to this workday.",
  countLabel = "selected",
}: SelectedCowsSummaryProps) {
  return (
    <div className="card workdaySelectedSummaryCard">
      <div className="sectionHeader">
        <div>
          <h2 className="sectionTitle">{title}</h2>
          <span className="sectionSubtle">Click a tag to remove it.</span>
        </div>
        <span className="sectionSubtle">
          {selectedCows.length} {countLabel}
        </span>
      </div>

      {selectedCows.length === 0 ? (
        <p className="emptyState">{emptyMessage}</p>
      ) : (
        <div className="workdaySelectionPills">
          {selectedCows.map((cow) => (
            <button
              key={cow.id}
              type="button"
              className="workdaySelectionPill"
              onClick={() => onRemove(cow.id)}
            >
              <span>Tag #{cow.tagNumber}</span>
              <span className="workdaySelectionPillMeta">
                {cow.healthStatus || "Unknown health status"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectedCowsSummary;
