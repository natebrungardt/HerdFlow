import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  completeWorkday,
  getWorkdayById,
  toggleWorkdayEntry,
  updateCowWorkdayStatus,
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
type DoneCowIds = Set<string>;

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
  onDoneToggle: (cowId: string, nextDone: boolean) => void;
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
  onDoneToggle: (cowId: string, nextDone: boolean) => void;
  hoveredActionId: string | null;
  onColumnHover: (actionId: string) => void;
};

type RowProps = {
  cow: WorkdayCowAssignment;
  actions: WorkdayAction[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
  onDoneToggle: (cowId: string, nextDone: boolean) => void;
  isDone: boolean;
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

function buildDoneCowIds(workday: Workday): DoneCowIds {
  return new Set(
    (workday.workdayCows ?? [])
      .filter((assignment) => assignment.status === "Worked")
      .map((assignment) => assignment.cowId),
  );
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
          Back to Edit
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
  onDoneToggle,
  isDone,
  hoveredActionId,
  onColumnHover,
}: RowProps) {
  function handleDoneToggle() {
    onDoneToggle(cow.cowId, !isDone);
  }

  function handleAllActions() {
    for (const action of actions) {
      if (!completions[cow.cowId]?.[action.id]) {
        onToggle(cow.cowId, action.id);
      }
    }

    if (!isDone) {
      onDoneToggle(cow.cowId, true);
    }
  }

  return (
    <div className="active-grid-row" role="row">
      <div className="active-grid-done">
        <button
          type="button"
          aria-label={
            isDone
              ? `Mark cow ${cow.cow.tagNumber} as not done for the workday`
              : `Mark cow ${cow.cow.tagNumber} as done for the workday`
          }
          className={`active-grid-circle${isDone ? " complete" : ""}`}
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
  onDoneToggle,
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
          onDoneToggle={onDoneToggle}
          isDone={false}
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
          onDoneToggle={onDoneToggle}
          isDone={true}
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
  onDoneToggle,
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
        onDoneToggle={onDoneToggle}
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
  const [doneCowIds, setDoneCowIds] = useState<DoneCowIds>(new Set());
  const [doneOrder, setDoneOrder] = useState<string[]>([]);
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
        setDoneCowIds(buildDoneCowIds(workdayData));
        setDoneOrder(
          (workdayData.workdayCows ?? [])
            .filter((c) => c.status === "Worked")
            .map((c) => c.cowId),
        );
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
    () => filteredCows.filter((cow) => !doneCowIds.has(cow.cowId)),
    [doneCowIds, filteredCows],
  );
  const completedCows = useMemo(
    () => {
      const completed = filteredCows.filter((cow) => doneCowIds.has(cow.cowId));

      return [...completed].sort((a, b) => {
        const aIndex = doneOrder.indexOf(a.cowId);
        const bIndex = doneOrder.indexOf(b.cowId);

        const safeA = aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex;
        const safeB = bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex;

        return safeA - safeB;
      });
    },
    [doneCowIds, filteredCows, doneOrder],
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

  function handleDoneToggle(cowId: string, nextDone: boolean) {
    if (!isGuid(id)) {
      return;
    }

    setDoneCowIds((prev) => {
      const next = new Set(prev);

      if (nextDone) {
        next.add(cowId);
      } else {
        next.delete(cowId);
      }

      return next;
    });

    setDoneOrder((prev) => {
      if (nextDone) {
        return [cowId, ...prev.filter((id) => id !== cowId)];
      }

      return prev.filter((id) => id !== cowId);
    });

    void updateCowWorkdayStatus(id, {
      cowId,
      isWorked: nextDone,
    }).catch((err) => {
      setDoneCowIds((prev) => {
        const rollback = new Set(prev);

        if (nextDone) {
          rollback.delete(cowId);
        } else {
          rollback.add(cowId);
        }

        return rollback;
      });

      setDoneOrder((prev) => {
        if (nextDone) {
          return prev.filter((id) => id !== cowId);
        }

        return [cowId, ...prev];
      });

      const message =
        err instanceof Error ? err.message : "Failed to save cow workday status";
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
              onDoneToggle={handleDoneToggle}
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
