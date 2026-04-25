import { Link } from "react-router-dom";
import type { KeyboardEvent, RefObject } from "react";
import type { WorkdayAction, WorkdayCowAssignment } from "../../types/workday";

type WorkdaySetupWorkspacePanelProps = {
  actions: WorkdayAction[];
  actionName: string;
  addError: string;
  addingAction: boolean;
  removingActionId: string | null;
  assignments: WorkdayCowAssignment[];
  removingCowId: string | null;
  actionInputRef: RefObject<HTMLInputElement | null>;
  onActionNameChange: (value: string) => void;
  onAddAction: () => void;
  onRemoveAction: (actionId: string) => void;
  onActionInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onRemoveCow: (cowId: string) => void;
};

function WorkdaySetupWorkspacePanel({
  actions,
  actionName,
  addError,
  addingAction,
  removingActionId,
  assignments,
  removingCowId,
  actionInputRef,
  onActionNameChange,
  onAddAction,
  onRemoveAction,
  onActionInputKeyDown,
  onRemoveCow,
}: WorkdaySetupWorkspacePanelProps) {
  return (
    <section className="card workdayWorkspacePanel workdayWorkspacePanelTall flex flex-col h-[730px] overflow-hidden">
      <div className="workdayWorkspaceHeader">
        <div className="workdayWorkspaceHeaderRow">
          <h2 className="sectionTitle">Workday Actions</h2>
          <div className="workdayWorkspaceToolbar action-input-row">
            <input
              ref={actionInputRef}
              type="text"
              className="searchInput workdayWorkspaceInput"
              placeholder="Add action (e.g. Vaccinate)"
              value={actionName}
              onChange={(event) => onActionNameChange(event.target.value)}
              onKeyDown={onActionInputKeyDown}
            />
            <button
              type="button"
              className="addCowButton workdayActionAddButton"
              onClick={onAddAction}
              disabled={addingAction || actionName.trim().length === 0}
            >
              {addingAction ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        <span className="sectionSubtle workdayWorkspaceSubtitle">
          Build the tasks these assigned cows will receive.
        </span>
      </div>

      {addError ? <p className="workdayInlineError">{addError}</p> : null}

      <div className="workdayWorkspaceChips action-tags-container">
        {actions.length === 0 ? (
          <p className="emptyState">Add actions to shape this workday.</p>
        ) : (
          actions.map((action) => (
            <div
              key={action.id}
              className="workdayActionChip"
              title={action.name}
            >
              <div className="workdayActionContent">
                <span className="workdayActionName" title={action.name}>
                  {action.name}
                </span>
              </div>
              <button
                type="button"
                className="workdayActionChipRemove"
                onClick={() => onRemoveAction(action.id)}
                disabled={removingActionId === action.id}
                aria-label={`Remove action ${action.name}`}
                title={`Remove action ${action.name}`}
              >
                {removingActionId === action.id ? "…" : "x"}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="workdayWorkspaceDivider" />

      <div className="workdayWorkspaceSectionHeader">
        <div>
          <h2 className="sectionTitle">Assigned Cows</h2>
          <span className="sectionSubtle">
            These cows will receive the actions above.
          </span>
        </div>
        <span className="sectionSubtle">{assignments.length} assigned</span>
      </div>

      <div className="workdayWorkspaceCowListViewport flex-1 overflow-y-auto pr-2">
        {assignments.length === 0 ? (
          <p className="emptyState">
            No cows have been added to this workday yet.
          </p>
        ) : (
          <div className="workdayWorkspaceCowList">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="workdayWorkspaceCowRow cowRowCard cow-card"
              >
                <Link
                  className="workdayWorkspaceCowLink"
                  to={`/cows/${assignment.cow.id}`}
                >
                  <div className="cowRowMain cow-card-content">
                    <div className="cowRowTitle">
                      Tag #{assignment.cow.tagNumber}
                    </div>
                    <div className="cowRowMeta">
                      {assignment.cow.livestockGroup || "Uncategorized"} •{" "}
                      {assignment.cow.healthStatus || "Unknown health status"}
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  className="workdaySelectionRemoveButton"
                  onClick={() => onRemoveCow(assignment.cowId)}
                  disabled={removingCowId === assignment.cowId}
                  aria-label={`Remove cow #${assignment.cow.tagNumber}`}
                  title={`Remove cow #${assignment.cow.tagNumber}`}
                >
                  {removingCowId === assignment.cowId ? "…" : "X"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default WorkdaySetupWorkspacePanel;
