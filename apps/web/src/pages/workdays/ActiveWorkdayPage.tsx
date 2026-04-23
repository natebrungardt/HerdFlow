import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  completeWorkday,
  getWorkdayById,
  toggleWorkdayEntry,
} from "../../services/workdayService";
import type {
  Workday,
  WorkdayAction,
  WorkdayCowAssignment,
} from "../../types/workday";
import "../../styles/AllCows.css";
import "../../styles/CowDetailPage.css";
import "../../styles/ActiveWorkdayPage.css";

type CompletionMap = Record<string, Record<string, boolean>>;

type HeaderBarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  backHref: string;
  completing: boolean;
  onCompleteWorkday: () => void;
};

type GridContainerProps = {
  actions: WorkdayAction[];
  cows: WorkdayCowAssignment[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
};

type GridHeaderProps = {
  actions: WorkdayAction[];
};

type GridBodyProps = {
  cows: WorkdayCowAssignment[];
  actions: WorkdayAction[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
};

type RowProps = {
  cow: WorkdayCowAssignment;
  actions: WorkdayAction[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
};

type CellProps = {
  cowId: string;
  cowTag: string;
  actionId: string;
  complete: boolean;
  onToggle: (cowId: string, actionId: string) => void;
};

function isGuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildCompletionMap(workday: Workday): CompletionMap {
  const nextMap: CompletionMap = {};

  for (const entry of workday.entries ?? []) {
    if (!nextMap[entry.cowId]) {
      nextMap[entry.cowId] = {};
    }

    nextMap[entry.cowId][entry.actionId] = entry.isCompleted;
  }

  return nextMap;
}

function HeaderBar({
  searchTerm,
  onSearchChange,
  backHref,
  completing,
  onCompleteWorkday,
}: HeaderBarProps) {
  return (
    <div className="header-bar">
      <div className="header-left">
        <input
          aria-label="Search cows by tag"
          className="searchInput active-grid-search"
          placeholder="Search by cow tag"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="header-center">
        <Link className="btn btn-outline" to={backHref}>
          Back
        </Link>
      </div>
      <div className="header-right">
        <button
          type="button"
          className="addCowButton"
          disabled={completing}
          onClick={onCompleteWorkday}
        >
          {completing ? "Completing..." : "Complete Workday"}
        </button>
      </div>
    </div>
  );
}

function GridHeader({ actions }: GridHeaderProps) {
  return (
    <div className="active-grid-header" role="row">
      <div className="active-grid-cow active-grid-cow-header" role="columnheader">
        Cow
      </div>
      {actions.map((action) => (
        <div
          key={action.id}
          className="active-grid-header-cell"
          role="columnheader"
          title={action.name}
        >
          <span>{action.name}</span>
        </div>
      ))}
    </div>
  );
}

function Cell({ cowId, cowTag, actionId, complete, onToggle }: CellProps) {
  return (
    <div className="active-grid-cell" role="gridcell">
      <button
        type="button"
        aria-label={`${complete ? "Mark incomplete" : "Mark complete"} for cow ${cowTag}`}
        aria-pressed={complete}
        className={`active-grid-circle${complete ? " complete" : ""}`}
        onClick={() => onToggle(cowId, actionId)}
      />
    </div>
  );
}

function Row({ cow, actions, completions, onToggle }: RowProps) {
  return (
    <div className="active-grid-row" role="row">
      <div className="active-grid-cow" role="rowheader" title={cow.cow.tagNumber}>
        {cow.cow.tagNumber}
      </div>
      {actions.map((action) => (
        <Cell
          key={action.id}
          cowId={cow.cowId}
          cowTag={cow.cow.tagNumber}
          actionId={action.id}
          complete={completions[cow.cowId]?.[action.id] ?? false}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function GridBody({ cows, actions, completions, onToggle }: GridBodyProps) {
  return (
    <div className="active-grid-body" role="rowgroup">
      {cows.map((cow) => (
        <Row
          key={cow.id}
          cow={cow}
          actions={actions}
          completions={completions}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function GridContainer({
  actions,
  cows,
  completions,
  onToggle,
}: GridContainerProps) {
  return (
    <div className="active-grid-container" role="grid" aria-label="Active workday grid">
      <GridHeader actions={actions} />
      <GridBody
        cows={cows}
        actions={actions}
        completions={completions}
        onToggle={onToggle}
      />
    </div>
  );
}

function ActiveWorkdayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workday, setWorkday] = useState<Workday | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [completions, setCompletions] = useState<CompletionMap>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWorkday() {
      if (!isGuid(id)) {
        setError("Active workday ID is missing or invalid.");
        setLoading(false);
        return;
      }

      try {
        setError("");
        const workdayData = await getWorkdayById(id);
        setWorkday(workdayData);
        setCompletions(buildCompletionMap(workdayData));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load active workday";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadWorkday();
  }, [id]);

  const actions = workday?.actions ?? [];
  const cows = workday?.workdayCows ?? [];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCows = useMemo(
    () =>
      cows.filter((assignment) =>
        assignment.cow.tagNumber.toLowerCase().includes(normalizedSearch),
      ),
    [cows, normalizedSearch],
  );

  function handleToggle(cowId: string, actionId: string) {
    if (!isGuid(id)) {
      return;
    }

    const current = completions[cowId]?.[actionId] ?? false;
    const nextCompleted = !current;

    setCompletions((prev) => {
      return {
        ...prev,
        [cowId]: {
          ...prev[cowId],
          [actionId]: nextCompleted,
        },
      };
    });

    void toggleWorkdayEntry(id, {
      cowId,
      actionId,
      completed: nextCompleted,
    }).catch((err) => {
      setCompletions((prev) => ({
        ...prev,
        [cowId]: {
          ...prev[cowId],
          [actionId]: current,
        },
      }));

      const message =
        err instanceof Error ? err.message : "Failed to save completion";
      setError(message);
    });
  }

  async function handleCompleteWorkday() {
    if (!isGuid(id)) {
      return;
    }

    setCompleting(true);
    setError("");

    try {
      await completeWorkday(id);
      navigate("/workdays/completed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete workday";
      setError(message);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="allCowsPage">
        <div className="allCowsShell">
          <div className="allCowsContent">
            <div className="active-workday-state">Loading active workday...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          {error ? <div className="pageErrorBanner">{error}</div> : null}

          <div className="allCowsHeader active-workday-header">
            <div className="titleBlock">
              <h1 className="pageTitle">{workday?.title ?? "Active Workday"}</h1>
              <p className="pageSubtitle">
                Track work as it happens with fast, optimistic action toggles.
              </p>
            </div>
          </div>

          <HeaderBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            backHref={id ? `/workdays/${id}` : "/workdays"}
            completing={completing}
            onCompleteWorkday={() => void handleCompleteWorkday()}
          />

          {!actions.length || !cows.length ? (
            <div className="active-workday-state">
              Add at least one cow and one action in setup before using the live grid.
            </div>
          ) : filteredCows.length === 0 ? (
            <div className="active-workday-state">
              No cows match your search
            </div>
          ) : (
            <GridContainer
              actions={actions}
              cows={filteredCows}
              completions={completions}
              onToggle={handleToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ActiveWorkdayPage;
