import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/shared/Modal";
import { createNote } from "../../services/noteService";
import {
  completeWorkday,
  getWorkdayById,
  resetWorkday,
  setEntryCompletion,
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
  onResetProgress: () => void;
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
  openNoteCowId: string | null;
  noteText: string;
  savingNote: boolean;
  onToggleNote: (cowId: string) => void;
  onNoteTextChange: (value: string) => void;
  onSaveNote: (cowId: string) => void;
  onCancelNote: () => void;
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
  openNoteCowId: string | null;
  noteText: string;
  savingNote: boolean;
  onToggleNote: (cowId: string) => void;
  onNoteTextChange: (value: string) => void;
  onSaveNote: (cowId: string) => void;
  onCancelNote: () => void;
  hoveredActionId: string | null;
  onColumnHover: (actionId: string) => void;
};

type RowProps = {
  cow: WorkdayCowAssignment;
  actions: WorkdayAction[];
  completions: CompletionMap;
  onToggle: (cowId: string, actionId: string) => void;
  onDoneToggle: (cowId: string, nextDone: boolean) => void;
  isNoteOpen: boolean;
  noteText: string;
  savingNote: boolean;
  onToggleNote: (cowId: string) => void;
  onNoteTextChange: (value: string) => void;
  onSaveNote: (cowId: string) => void;
  onCancelNote: () => void;
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
  onResetProgress,
  completing,
  onCompleteWorkday,
}: HeaderBarProps) {
  return (
    <div className="header-bar">
      <div className="header-left">
        <Link className="btn btn-outline" to={backHref}>
          Back to Edit
        </Link>
        <input
          aria-label="Search cows by tag"
          className="searchInput active-grid-search"
          placeholder="Search by cow tag"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="header-right">
        <button
          type="button"
          className="btn btn-ghost danger-text"
          onClick={onResetProgress}
        >
          Reset Progress
        </button>
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
  isNoteOpen,
  noteText,
  savingNote,
  onToggleNote,
  onNoteTextChange,
  onSaveNote,
  onCancelNote,
  isDone,
  hoveredActionId,
  onColumnHover,
}: RowProps) {
  const rowContainerRef = useRef<HTMLDivElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const noteButtonRef = useRef<HTMLButtonElement>(null);
  const notePopoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!isNoteOpen) {
      setPopoverPosition(null);
      return;
    }

    noteTextareaRef.current?.focus();

    if (noteButtonRef.current) {
      const rect = noteButtonRef.current.getBoundingClientRect();

      setPopoverPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        rowContainerRef.current &&
        !rowContainerRef.current.contains(event.target as Node) &&
        (!notePopoverRef.current ||
          !notePopoverRef.current.contains(event.target as Node))
      ) {
        onCancelNote();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancelNote();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNoteOpen, onCancelNote]);

  function handleDoneToggle() {
    onDoneToggle(cow.cowId, !isDone);
  }

  return (
    <div className="active-grid-row-shell" ref={rowContainerRef}>
      <div
        className={`active-grid-row${isDone ? " completed-row" : ""}${isNoteOpen ? " note-open" : ""}`}
        role="row"
      >
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
        <div
          className="active-grid-cow"
          role="rowheader"
          title={cow.cow.tagNumber}
        >
          <div className="active-grid-cow-content">
            <span>{cow.cow.tagNumber}</span>
            <div className="note-button-wrapper">
              <button
                type="button"
                className="cowNoteButton"
                aria-label={`Add note for cow ${cow.cow.tagNumber}`}
                ref={noteButtonRef}
                onClick={() => onToggleNote(cow.cowId)}
              >
                📝
              </button>
            </div>
          </div>
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
      {isNoteOpen && popoverPosition
        ? createPortal(
            <div
              ref={notePopoverRef}
              className="active-grid-note-popover"
              role="dialog"
              aria-label={`Add note for cow ${cow.cow.tagNumber}`}
              style={{
                position: "absolute",
                top: popoverPosition.top,
                left: popoverPosition.left,
                width: "340px",
                zIndex: 9999,
              }}
            >
              <div className="active-grid-note-card">
                <div className="active-grid-note-title">
                  Add Note - Tag #{cow.cow.tagNumber}
                </div>
                <textarea
                  ref={noteTextareaRef}
                  value={noteText}
                  onChange={(event) => onNoteTextChange(event.target.value)}
                  placeholder="Add a note for this cow..."
                  rows={3}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.metaKey || event.ctrlKey) &&
                      noteText.trim() &&
                      !savingNote
                    ) {
                      event.preventDefault();
                      onSaveNote(cow.cowId);
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      onCancelNote();
                    }
                  }}
                />
                <div className="active-grid-note-actions">
                  <button
                    type="button"
                    className="addCowButton"
                    disabled={savingNote || !noteText.trim()}
                    onClick={() => onSaveNote(cow.cowId)}
                  >
                    {savingNote ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={savingNote}
                    onClick={onCancelNote}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
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
  openNoteCowId,
  noteText,
  savingNote,
  onToggleNote,
  onNoteTextChange,
  onSaveNote,
  onCancelNote,
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
          isNoteOpen={openNoteCowId === cow.cowId}
          noteText={noteText}
          savingNote={savingNote}
          onToggleNote={onToggleNote}
          onNoteTextChange={onNoteTextChange}
          onSaveNote={onSaveNote}
          onCancelNote={onCancelNote}
          isDone={false}
          hoveredActionId={hoveredActionId}
          onColumnHover={onColumnHover}
        />
      ))}
      {completedCows.length > 0 ? (
        <div className="active-grid-divider-row" role="separator">
          <span className="active-grid-divider-label">
            Completed ({completedCows.length})
          </span>
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
          isNoteOpen={openNoteCowId === cow.cowId}
          noteText={noteText}
          savingNote={savingNote}
          onToggleNote={onToggleNote}
          onNoteTextChange={onNoteTextChange}
          onSaveNote={onSaveNote}
          onCancelNote={onCancelNote}
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
  openNoteCowId,
  noteText,
  savingNote,
  onToggleNote,
  onNoteTextChange,
  onSaveNote,
  onCancelNote,
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
      <div className="active-grid-inner">
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
          openNoteCowId={openNoteCowId}
          noteText={noteText}
          savingNote={savingNote}
          onToggleNote={onToggleNote}
          onNoteTextChange={onNoteTextChange}
          onSaveNote={onSaveNote}
          onCancelNote={onCancelNote}
          hoveredActionId={hoveredActionId}
          onColumnHover={onColumnHover}
        />
      </div>
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
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [openNoteCowId, setOpenNoteCowId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
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

      void setEntryCompletion(id, cowId, actionId, nextCompleted).catch((err) => {
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

  function handleToggleNote(cowId: string) {
    setOpenNoteCowId((current) => {
      if (current === cowId) {
        setNoteText("");
        return null;
      }

      setNoteText("");
      return cowId;
    });
  }

  async function handleSaveNote(cowId: string) {
    if (!isGuid(id) || !noteText.trim()) {
      return;
    }

    try {
      setSavingNote(true);
      setError("");
      await createNote(cowId, {
        content: noteText.trim(),
        source: "workday",
        workdayId: id,
      });
      setOpenNoteCowId(null);
      setNoteText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add note";
      setError(message);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleConfirmReset() {
    if (!isGuid(id)) {
      return;
    }

    setShowResetModal(false);
    setError("");

    try {
      await resetWorkday(id);

      setCompletions({});
      setDoneCowIds(new Set());
      setDoneOrder([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset progress";
      setError(message);
    }
  }

  async function handleConfirmComplete() {
    if (!isGuid(id)) {
      return;
    }

    setShowCompleteModal(false);
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
            onResetProgress={() => setShowResetModal(true)}
            completing={completing}
            onCompleteWorkday={() => setShowCompleteModal(true)}
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
              openNoteCowId={openNoteCowId}
              noteText={noteText}
              savingNote={savingNote}
              onToggleNote={handleToggleNote}
              onNoteTextChange={setNoteText}
              onSaveNote={(cowId) => void handleSaveNote(cowId)}
              onCancelNote={() => {
                setOpenNoteCowId(null);
                setNoteText("");
              }}
              hoveredActionId={hoveredActionId}
              onColumnHover={setHoveredActionId}
              onColumnLeave={() => setHoveredActionId(null)}
            />
          )}
          <Modal
            isOpen={showResetModal}
            title="Reset Progress"
            message="This will clear all progress for this workday. This cannot be undone."
            confirmText="Reset"
            onCancel={() => setShowResetModal(false)}
            onConfirm={handleConfirmReset}
          />
          <Modal
            isOpen={showCompleteModal}
            title="Complete Workday?"
            message={`This will move the workday to completed.\n\n${doneCowIds.size} of ${cows.length} cows completed.`}
            confirmText="Complete Workday"
            confirmVariant="success"
            onCancel={() => setShowCompleteModal(false)}
            onConfirm={handleConfirmComplete}
          />
        </div>
      </div>
    </div>
  );
}

export default ActiveWorkdayPage;
