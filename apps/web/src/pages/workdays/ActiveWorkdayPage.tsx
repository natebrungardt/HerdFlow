import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
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
import { preserveWorkdayGridOrder } from "../../utils/workdayGridOrder";
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
  activeCows: WorkdayCowAssignment[];
  completedCows: WorkdayCowAssignment[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
  hoveredActionId: string | null;
  onColumnHover: (actionId: string) => void;
  onColumnLeave: () => void;
};

type GridHeaderProps = {
  actions: WorkdayAction[];
  hoveredActionId: string | null;
  onColumnHover: (actionId: string) => void;
};

type GridBodyProps = {
  activeCows: WorkdayCowAssignment[];
  completedCows: WorkdayCowAssignment[];
  actions: WorkdayAction[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
  hoveredActionId: string | null;
  onColumnHover: (actionId: string) => void;
};

type RowProps = {
  cow: WorkdayCowAssignment;
  actions: WorkdayAction[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
  hoveredActionId: string | null;
  onColumnHover: (actionId: string) => void;
};

type CellProps = {
  cowId: string;
  cowTag: string;
  actionId: string;
  complete: boolean;
  onToggle: (cowId: string, actionId: string) => void;
  highlighted: boolean;
  onColumnHover: (actionId: string) => void;
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

function GridHeader({
  actions,
  hoveredActionId,
  onColumnHover,
}: GridHeaderProps) {
  return (
    <div className="active-grid-header" role="row">
      <div className="active-grid-done-header" role="columnheader">
        Complete
      </div>
      <div className="active-grid-all-actions-header" role="columnheader">
        All Actions
      </div>
      <div className="active-grid-cow-header" role="columnheader">
        Tag #
      </div>
      {actions.map((action) => (
        <div
          key={action.id}
          className={`active-grid-header-cell${
            hoveredActionId === action.id ? " column-highlighted" : ""
          }`}
          role="columnheader"
          title={action.name}
          onMouseEnter={() => onColumnHover(action.id)}
        >
          <span>{action.name}</span>
        </div>
      ))}
    </div>
  );
}

function Cell({
  cowId,
  cowTag,
  actionId,
  complete,
  onToggle,
  highlighted,
  onColumnHover,
}: CellProps) {
  return (
    <div
      className={`active-grid-cell${highlighted ? " column-highlighted" : ""}`}
      role="gridcell"
      onMouseEnter={() => onColumnHover(actionId)}
    >
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

function Row({
  cow,
  actions,
  completions,
  onToggle,
  hoveredActionId,
  onColumnHover,
}: RowProps) {
  const isComplete = actions.every(
    (action) => completions[cow.cowId]?.[action.id],
  );

  function handleDoneToggle() {
    for (const action of actions) {
      const isActionComplete = completions[cow.cowId]?.[action.id] ?? false;

      if (isActionComplete !== !isComplete) {
        onToggle(cow.cowId, action.id);
      }
    }
  }

  function handleAllActions() {
    for (const action of actions) {
      if (!completions[cow.cowId]?.[action.id]) {
        onToggle(cow.cowId, action.id);
      }
    }
  }

  return (
    <div className="active-grid-row" role="row">
      <div className="active-grid-done">
        <button
          type="button"
          aria-label={
            isComplete
              ? `Mark all actions incomplete for cow ${cow.cow.tagNumber}`
              : `Mark all actions complete for cow ${cow.cow.tagNumber}`
          }
          className={`active-grid-circle${isComplete ? " complete" : ""}`}
          onClick={handleDoneToggle}
        />
      </div>
      <div className="active-grid-all-actions">
        <button
          type="button"
          className="active-grid-all-actions-btn"
          onClick={handleAllActions}
        >
          Select
        </button>
      </div>
      <div
        className="active-grid-cow"
        role="rowheader"
        title={cow.cow.tagNumber}
      >
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
          highlighted={hoveredActionId === action.id}
          onColumnHover={onColumnHover}
        />
      ))}
    </div>
  );
}

function GridBody({
  activeCows,
  completedCows,
  actions,
  completions,
  onToggle,
  hoveredActionId,
  onColumnHover,
}: GridBodyProps) {
  return (
    <div role="rowgroup">
      {activeCows.map((cow) => (
        <Row
          key={cow.id}
          cow={cow}
          actions={actions}
          completions={completions}
          onToggle={onToggle}
          hoveredActionId={hoveredActionId}
          onColumnHover={onColumnHover}
        />
      ))}
      {completedCows.length > 0 ? (
        <div className="active-grid-row active-grid-divider-row" role="row">
          <div className="active-grid-done active-grid-divider-sticky" />
          <div className="active-grid-all-actions active-grid-divider-sticky" />
          <div className="active-grid-cow active-grid-divider-label" role="rowheader">
            Completed ({completedCows.length})
          </div>
          {actions.map((action) => (
            <div key={action.id} className="active-grid-cell" role="gridcell" />
          ))}
        </div>
      ) : null}
      {completedCows.map((cow) => (
        <Row
          key={cow.id}
          cow={cow}
          actions={actions}
          completions={completions}
          onToggle={onToggle}
          hoveredActionId={hoveredActionId}
          onColumnHover={onColumnHover}
        />
      ))}
    </div>
  );
}

function GridContainer({
  actions,
  activeCows,
  completedCows,
  completions,
  onToggle,
  hoveredActionId,
  onColumnHover,
  onColumnLeave,
}: GridContainerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  function handleMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !containerRef.current) {
      return;
    }

    setIsDragging(true);
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = containerRef.current.scrollLeft;
  }

  function handleMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!isDragging || !containerRef.current) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - dragStartXRef.current;
    containerRef.current.scrollLeft = dragStartScrollLeftRef.current - deltaX;
  }

  function stopDragging() {
    setIsDragging(false);
  }

  function handleMouseLeave() {
    stopDragging();
    onColumnLeave();
  }

  return (
    <div
      ref={containerRef}
      className="active-grid-container"
      role="grid"
      aria-label="Active workday grid"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={handleMouseLeave}
    >
      <GridHeader
        actions={actions}
        hoveredActionId={hoveredActionId}
        onColumnHover={onColumnHover}
      />
      <GridBody
        activeCows={activeCows}
        completedCows={completedCows}
        actions={actions}
        completions={completions}
        onToggle={onToggle}
        hoveredActionId={hoveredActionId}
        onColumnHover={onColumnHover}
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
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);
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
        const workdayData = preserveWorkdayGridOrder(await getWorkdayById(id));
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

  const actions = useMemo(() => workday?.actions ?? [], [workday?.actions]);
  const cows = useMemo(
    () => workday?.workdayCows ?? [],
    [workday?.workdayCows],
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCows = useMemo(
    () =>
      cows.filter((assignment) =>
        assignment.cow.tagNumber.toLowerCase().includes(normalizedSearch),
      ),
    [cows, normalizedSearch],
  );
  const activeCows = useMemo(
    () =>
      filteredCows.filter((cow) =>
        actions.some((action) => !completions[cow.cowId]?.[action.id]),
      ),
    [actions, completions, filteredCows],
  );
  const completedCows = useMemo(
    () =>
      filteredCows.filter((cow) =>
        actions.every((action) => completions[cow.cowId]?.[action.id]),
      ),
    [actions, completions, filteredCows],
  );

  function handleToggle(cowId: string, actionId: string) {
    if (!isGuid(id)) {
      return;
    }

    setCompletions((prev) => {
      const current = prev[cowId]?.[actionId] ?? false;
      const nextCompleted = !current;

      void toggleWorkdayEntry(id, {
        cowId,
        actionId,
        completed: nextCompleted,
      }).catch((err) => {
        setCompletions((prev2) => ({
          ...prev2,
          [cowId]: {
            ...prev2[cowId],
            [actionId]: current,
          },
        }));

        const message =
          err instanceof Error ? err.message : "Failed to save completion";
        setError(message);
      });

      return {
        ...prev,
        [cowId]: {
          ...prev[cowId],
          [actionId]: nextCompleted,
        },
      };
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
            <div className="active-workday-state">
              Loading active workday...
            </div>
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
              <h1 className="pageTitle">
                {workday?.title ?? "Active Workday"}
              </h1>
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
              Add at least one cow and one action in setup before using the live
              grid.
            </div>
          ) : filteredCows.length === 0 ? (
            <div className="active-workday-state">
              No cows match your search
            </div>
          ) : (
            <GridContainer
              actions={actions}
              activeCows={activeCows}
              completedCows={completedCows}
              completions={completions}
              onToggle={handleToggle}
              hoveredActionId={hoveredActionId}
              onColumnHover={setHoveredActionId}
              onColumnLeave={() => setHoveredActionId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ActiveWorkdayPage;
