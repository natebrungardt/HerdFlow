import type { KeyboardEvent } from "react";
import type { WorkdayAction } from "../../types/workday";

type WorkdayActionsPanelProps = {
  actions: WorkdayAction[];
  actionName: string;
  addError: string;
  addingAction: boolean;
  removingActionId: string | null;
  onActionNameChange: (value: string) => void;
  onAddAction: () => void;
  onRemoveAction: (actionId: string) => void;
  onActionInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

function WorkdayActionsPanel({
  actions,
  actionName,
  addError,
  addingAction,
  removingActionId,
  onActionNameChange,
  onAddAction,
  onRemoveAction,
  onActionInputKeyDown,
}: WorkdayActionsPanelProps) {
  return (
    <div className="card workdaySelectedSummaryCard workdayActionsCard">
      <div className="sectionHeader">
        <div>
          <h2 className="sectionTitle">Workday Actions</h2>
          <span className="sectionSubtle">
            Add the tasks you plan to complete today.
          </span>
        </div>
        <span className="sectionSubtle">{actions.length} planned</span>
      </div>

      <div className="workdayActionComposer">
        <input
          type="text"
          className="searchInput"
          placeholder="Add action (e.g. Vaccinate)"
          value={actionName}
          onChange={(event) => onActionNameChange(event.target.value)}
          onKeyDown={onActionInputKeyDown}
          disabled={addingAction}
        />
        <button
          type="button"
          className="addCowButton workdayActionAddButton"
          onClick={onAddAction}
          disabled={addingAction || actionName.trim().length === 0}
        >
          {addingAction ? "Adding..." : "Add Action"}
        </button>
      </div>

      {addError ? <p className="workdayInlineError">{addError}</p> : null}

      {actions.length === 0 ? (
        <p className="emptyState">No actions added yet.</p>
      ) : (
        <div className="workdayActionChipList">
          {actions.map((action) => (
            <div key={action.id} className="workdayActionChip">
              <div className="workdayActionContent">
                <span className="workdayActionName">{action.name}</span>
              </div>
              <button
                type="button"
                className="workdayActionChipRemove"
                onClick={() => onRemoveAction(action.id)}
                disabled={removingActionId === action.id}
                aria-label={`Remove action ${action.name}`}
                title={`Remove action ${action.name}`}
              >
                {removingActionId === action.id ? "…" : "X"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkdayActionsPanel;
