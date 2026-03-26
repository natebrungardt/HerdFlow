import type { Cow } from "../../types/cow";

type SelectedCowsSummaryProps = {
  selectedCows: Cow[];
  onRemove: (cowId: number) => void;
};

function SelectedCowsSummary({
  selectedCows,
  onRemove,
}: SelectedCowsSummaryProps) {
  return (
    <div className="card workdaySelectedSummaryCard">
      <div className="sectionHeader">
        <h2 className="sectionTitle">Added to Workday</h2>
        <span className="sectionSubtle">{selectedCows.length} selected</span>
      </div>

      {selectedCows.length === 0 ? (
        <p className="emptyState">
          Select cows from the list below to add them to this workday.
        </p>
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
                {cow.ownerName || "Unknown owner"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectedCowsSummary;
