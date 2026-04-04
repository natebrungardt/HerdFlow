import type { WorkdayCowAssignment } from "../../types/workday";

type AssignedWorkdayCowsProps = {
  assignments: WorkdayCowAssignment[];
  removingCowId: string | null;
  onRemove: (cowId: string) => void;
};

function AssignedWorkdayCows({
  assignments,
  removingCowId,
  onRemove,
}: AssignedWorkdayCowsProps) {
  return (
    <div className="cowListCard">
      <div className="sectionHeader">
        <h2 className="sectionTitle">Assigned Cows</h2>
        <span className="sectionSubtle">{assignments.length} on this workday</span>
      </div>

      {assignments.length === 0 ? (
        <p className="emptyState">No cows have been added to this workday yet.</p>
      ) : (
        assignments.map((assignment) => (
          <div key={assignment.id} className="cowRowCard workdayRowCard">
            <div className="cowRowMain">
              <div className="cowRowTitle">Tag #{assignment.cow.tagNumber}</div>
              <div className="cowRowMeta">
                {assignment.cow.livestockGroup || "Unassigned"} •{" "}
                {assignment.cow.healthStatus || "Unknown health status"} •{" "}
                {assignment.cow.sex || "Unknown sex"} •{" "}
                {assignment.cow.pregnancyStatus || "No pregnancy status"}
              </div>
              <div className="cowRowOwner">
                Owner: {assignment.cow.ownerName || "Unknown owner"}
              </div>
            </div>

            <div className="cowRowActions">
              <button
                type="button"
                className="workdaySecondaryButton workdayRemoveCowButton"
                onClick={() => onRemove(assignment.cowId)}
                disabled={removingCowId === assignment.cowId}
              >
                {removingCowId === assignment.cowId ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AssignedWorkdayCows;
