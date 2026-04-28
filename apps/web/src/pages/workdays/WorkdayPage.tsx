import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/shared/Modal";
import WorkdayAddCowsPanel from "../../components/workdays/WorkdayAddCowsPanel";
import WorkdaySetupWorkspacePanel from "../../components/workdays/WorkdaySetupWorkspacePanel";
import { useUnsavedChangesGuard } from "../../context/UnsavedChangesContext";
import { getCows } from "../../services/cowService";
import {
  addCowsToWorkday,
  addWorkdayAction,
  deleteWorkday,
  getWorkdayById,
  removeCowFromWorkday,
  removeWorkdayAction,
  startWorkday,
  updateWorkday,
} from "../../services/workdayService";
import type { Cow } from "../../types/cow";
import type { Workday, WorkdayAction } from "../../types/workday";
import { preserveWorkdayGridOrder } from "../../utils/workdayGridOrder";
import "../../styles/AllCows.css";
import "../../styles/CowDetailPage.css";
import WorkdayComposerCard from "../../components/workdays/WorkdayComposerCard";

function formatDateInput(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function normalizeWorkdayDetails(details: {
  title: string;
  date: string;
  summary: string;
}) {
  return {
    title: details.title.trim(),
    date: details.date,
    summary: details.summary.trim(),
  };
}

function logWorkdayMutation(step: string, details: Record<string, unknown>) {
  console.info(`[WorkdayPage] ${step}`, details);
}

function WorkdayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workday, setWorkday] = useState<Workday | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [actionName, setActionName] = useState("");
  const [allCows, setAllCows] = useState<Cow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeHealthStatuses, setActiveHealthStatuses] = useState<string[]>(
    [],
  );
  const [activeLivestockGroups, setActiveLivestockGroups] = useState<string[]>(
    [],
  );
  const [activeSexes, setActiveSexes] = useState<string[]>([]);
  const [activePregnancyStatuses, setActivePregnancyStatuses] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [cowLoading, setCowLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [addingAction, setAddingAction] = useState(false);
  const [startingWorkday, setStartingWorkday] = useState(false);
  const [removingActionId, setRemovingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [removingAssignedCowId, setRemovingAssignedCowId] = useState<
    string | null
  >(null);
  const [removeSuccessMessage, setRemoveSuccessMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCowIds, setSelectedCowIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const actionInputRef = useRef<HTMLInputElement>(null);
  const titleDebounceRef = useRef<number | null>(null);

  const healthStatusFilters = ["Healthy", "Needs Treatment"];
  const livestockGroupFilters = ["Calf", "Breeding", "Feeder", "Market"];
  const sexFilters = ["Cow", "Heifer", "Bull", "Steer"];
  const pregnancyStatusFilters = ["Open", "Bred"];

  useEffect(() => {
    async function loadPage() {
      if (!id) return;

      try {
        setError("");
        const [workdayData, cowsData] = await Promise.all([
          getWorkdayById(id),
          getCows(),
        ]);

        setWorkday(preserveWorkdayGridOrder(workdayData));
        setTitle(workdayData.title);
        setDate(formatDateInput(workdayData.date));
        setSummary(workdayData.summary ?? "");
        setSaveStatus(workdayData.title.trim() ? "Saved" : "Unsaved");
        setAllCows(cowsData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load workday";
        setError(message);
      } finally {
        setLoading(false);
        setCowLoading(false);
      }
    }

    void loadPage();
  }, [id]);

  const assignedCowIds = useMemo(
    () =>
      new Set(
        (workday?.workdayCows ?? []).map((assignment) => assignment.cowId),
      ),
    [workday],
  );

  const availableCows = useMemo(
    () => allCows.filter((cow) => !assignedCowIds.has(cow.id)),
    [allCows, assignedCowIds],
  );

  const filteredAvailableCows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return availableCows.filter((cow) => {
      const matchesSearch =
        cow.tagNumber.toLowerCase().includes(normalizedSearch) ||
        (cow.ownerName ?? "").toLowerCase().includes(normalizedSearch);

      const matchesHealthStatus =
        activeHealthStatuses.length === 0 ||
        activeHealthStatuses.some((status) =>
          status === "Healthy"
            ? cow.healthStatus === "Healthy"
            : cow.healthStatus !== "Healthy",
        );

      const matchesLivestockGroup =
        activeLivestockGroups.length === 0 ||
        (cow.livestockGroup != null && activeLivestockGroups.includes(cow.livestockGroup));

      const matchesSex =
        activeSexes.length === 0 || activeSexes.includes(cow.sex || "");

      const matchesPregnancyStatus =
        activePregnancyStatuses.length === 0 ||
        activePregnancyStatuses.includes(cow.pregnancyStatus || "");

      return (
        matchesSearch &&
        matchesHealthStatus &&
        matchesLivestockGroup &&
        matchesSex &&
        matchesPregnancyStatus
      );
    });
  }, [
    availableCows,
    searchTerm,
    activeHealthStatuses,
    activeLivestockGroups,
    activeSexes,
    activePregnancyStatuses,
  ]);

  const canStartWorkday =
    workday?.status !== "Completed" &&
    (workday?.workdayCows?.length ?? 0) > 0 &&
    (workday?.actions?.length ?? 0) > 0;
  const workdayActionLabel =
    workday?.status === "InProgress" ? "Continue Workday" : "Start Workday";
  const hasUnsavedChanges = useMemo(() => {
    if (!workday) {
      return false;
    }

    const currentDetails = normalizeWorkdayDetails({
      title,
      date,
      summary,
    });
    const savedDetails = normalizeWorkdayDetails({
      title: workday.title,
      date: formatDateInput(workday.date),
      summary: workday.summary ?? "",
    });

    return JSON.stringify(currentDetails) !== JSON.stringify(savedDetails);
  }, [date, summary, title, workday]);
  const isUnsaved = !title.trim();
  const handleDraftConfirm = useCallback(async () => {
    if (workday) {
      await deleteWorkday(workday.id);
    }
  }, [workday]);
  const { allowNavigation } = useUnsavedChangesGuard({
    hasUnsavedChanges: isUnsaved || hasUnsavedChanges,
    title: isUnsaved ? "Unsaved Draft" : undefined,
    message: isUnsaved
      ? "You haven't entered a workday name. This draft will not be saved."
      : undefined,
    confirmText: isUnsaved ? "Leave" : undefined,
    onConfirm: isUnsaved ? handleDraftConfirm : undefined,
  });

  function toggleFilter(
    value: string,
    setState: Dispatch<SetStateAction<string[]>>,
  ) {
    setState((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  useEffect(() => {
    if (!removeSuccessMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setRemoveSuccessMessage("");
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [removeSuccessMessage]);

  async function refreshWorkday() {
    if (!id) return;
    const startedAt = performance.now();
    logWorkdayMutation("refresh:start", { workdayId: id });
    const data = await getWorkdayById(id);
    logWorkdayMutation("refresh:response", {
      workdayId: id,
      elapsedMs: Math.round(performance.now() - startedAt),
      actionCount: data.actions?.length ?? 0,
      assignedCowCount: data.workdayCows?.length ?? 0,
    });
    setWorkday((current) =>
      preserveWorkdayGridOrder(
        current
          ? {
              ...data,
              workdayCows: data.workdayCows ?? current.workdayCows,
              actions: data.actions ?? current.actions,
            }
          : data,
      ),
    );
    setTitle(data.title);
    setDate(formatDateInput(data.date));
    setSummary(data.summary ?? "");
    setSaveStatus("Saved");
  }

  function appendAssignedCow(cowId: string) {
    const cow = allCows.find((candidate) => candidate.id === cowId);
    if (!cow) {
      return false;
    }

    setWorkday((current) => {
      if (!current) {
        return current;
      }

      if (current.workdayCows?.some((assignment) => assignment.cowId === cowId)) {
        return current;
      }

      return preserveWorkdayGridOrder({
        ...current,
        workdayCows: [
          ...(current.workdayCows ?? []),
          {
            id: `temp-${cowId}`,
            workdayId: current.id,
            cowId,
            status: null,
            cow,
          },
        ],
      });
    });

    return true;
  }

  function removeAssignedCow(cowId: string) {
    setWorkday((current) => {
      if (!current) {
        return current;
      }

      return preserveWorkdayGridOrder({
        ...current,
        workdayCows: (current.workdayCows ?? []).filter(
          (assignment) => assignment.cowId !== cowId,
        ),
      });
    });
  }

  function appendAction(action: WorkdayAction) {
    setWorkday((current) => {
      if (!current) {
        return current;
      }

      const nextActions = [...(current.actions ?? []), action];
      return preserveWorkdayGridOrder({
        ...current,
        actions: nextActions,
      });
    });
  }

  function removeAction(actionId: string) {
    setWorkday((current) => {
      if (!current) {
        return current;
      }

      const nextActions = (current.actions ?? []).filter(
        (action) => action.id !== actionId,
      );

      return preserveWorkdayGridOrder({
        ...current,
        actions: nextActions,
      });
    });
  }

  async function handleSaveDetails() {
    if (!workday) return;

    if (titleDebounceRef.current !== null) {
      window.clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }

    const normalizedCurrent = normalizeWorkdayDetails({
      title,
      date,
      summary,
    });
    const normalizedSaved = normalizeWorkdayDetails({
      title: workday.title,
      date: formatDateInput(workday.date),
      summary: workday.summary ?? "",
    });

    if (
      normalizedCurrent.title === normalizedSaved.title &&
      normalizedCurrent.date === normalizedSaved.date &&
      normalizedCurrent.summary === normalizedSaved.summary
    ) {
      setSaveStatus("Saved");
      return;
    }

    setSaveStatus("Saving...");
    setSaving(true);
    setError("");

    try {
      const updated = await updateWorkday(workday.id, {
        title: normalizedCurrent.title,
        date: normalizedCurrent.date,
        summary: normalizedCurrent.summary ? normalizedCurrent.summary : null,
      });
      setWorkday((current) => ({
        ...updated,
        workdayCows: current?.workdayCows ?? updated.workdayCows,
        actions: current?.actions ?? updated.actions,
      }));
      setTitle(updated.title);
      setDate(formatDateInput(updated.date));
      setSummary(updated.summary ?? "");
      setSaveStatus("Saved");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update workday";
      setError(message);
      setSaveStatus("Unsaved changes");
    } finally {
      setSaving(false);
    }
  }

  function handleWorkdayFieldKeyDown(
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    event.currentTarget.blur();
  }

  function handleAddCow(cowId: string) {
    if (!workday || assignedCowIds.has(cowId)) {
      return;
    }

    if (!appendAssignedCow(cowId)) {
      return;
    }

    setError("");
    const startedAt = performance.now();
    logWorkdayMutation("addCow:start", { workdayId: workday.id, cowId });

    void addCowsToWorkday(workday.id, [cowId])
      .then(() => {
        logWorkdayMutation("addCow:mutationResponse", {
          workdayId: workday.id,
          cowId,
          elapsedMs: Math.round(performance.now() - startedAt),
        });
        void refreshWorkday();
      })
      .catch((err) => {
        removeAssignedCow(cowId);
        const message =
          err instanceof Error ? err.message : "Failed to add cow to workday";
        setError(message);
      })
      .finally(() => {
        logWorkdayMutation("addCow:done", {
          workdayId: workday.id,
          cowId,
          elapsedMs: Math.round(performance.now() - startedAt),
        });
      });
  }

  function handleToggleCow(cowId: string) {
    setSelectedCowIds((prev) => {
      const next = new Set(prev);
      if (next.has(cowId)) {
        next.delete(cowId);
      } else {
        next.add(cowId);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedCowIds.size === filteredAvailableCows.length) {
      setSelectedCowIds(new Set());
    } else {
      setSelectedCowIds(new Set(filteredAvailableCows.map((c) => c.id)));
    }
  }

  async function handleAddSelected() {
    if (!workday || selectedCowIds.size === 0) return;

    const ids = [...selectedCowIds];
    setIsAdding(true);
    ids.forEach((id) => appendAssignedCow(id));

    try {
      await addCowsToWorkday(workday.id, ids);
      setSelectedCowIds(new Set());
      await refreshWorkday();
    } catch (err) {
      ids.forEach((id) => removeAssignedCow(id));
      const message =
        err instanceof Error ? err.message : "Failed to add cows to workday";
      setError(message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveCow(cowId: string) {
    if (!workday) return;

    const startedAt = performance.now();
    logWorkdayMutation("removeCow:start", { workdayId: workday.id, cowId });
    setError("");
    setRemoveSuccessMessage("");
    setRemovingAssignedCowId(cowId);

    try {
      await removeCowFromWorkday(workday.id, cowId);
      logWorkdayMutation("removeCow:mutationResponse", {
        workdayId: workday.id,
        cowId,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      removeAssignedCow(cowId);
      void refreshWorkday();
      setRemoveSuccessMessage("Cow removed");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove cow from workday";
      setError(message);
    } finally {
      setRemovingAssignedCowId(null);
      logWorkdayMutation("removeCow:done", {
        workdayId: workday.id,
        cowId,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    }
  }

  async function handleAddAction() {
    if (!workday || addingAction || actionName.trim().length === 0) return;

    const startedAt = performance.now();
    const trimmedActionName = actionName.trim();
    logWorkdayMutation("addAction:start", {
      workdayId: workday.id,
      actionName: trimmedActionName,
    });
    setAddingAction(true);
    setActionError("");
    setError("");

    try {
      const action = await addWorkdayAction(workday.id, { name: trimmedActionName });
      logWorkdayMutation("addAction:mutationResponse", {
        workdayId: workday.id,
        actionId: action.id,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      setActionName("");
      appendAction(action);
      void refreshWorkday();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add workday action";
      setActionError(message);
    } finally {
      setAddingAction(false);
      actionInputRef.current?.focus();
      logWorkdayMutation("addAction:done", {
        workdayId: workday.id,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    }
  }

  async function handleRemoveAction(actionId: string) {
    if (!workday) return;

    const startedAt = performance.now();
    logWorkdayMutation("removeAction:start", { workdayId: workday.id, actionId });
    setRemovingActionId(actionId);
    setActionError("");
    setError("");

    try {
      await removeWorkdayAction(workday.id, actionId);
      logWorkdayMutation("removeAction:mutationResponse", {
        workdayId: workday.id,
        actionId,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      removeAction(actionId);
      void refreshWorkday();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove workday action";
      setActionError(message);
    } finally {
      setRemovingActionId(null);
      logWorkdayMutation("removeAction:done", {
        workdayId: workday.id,
        actionId,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    }
  }

  function handleActionInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void handleAddAction();
  }

  function handleStartWorkday() {
    if (!workday || !canStartWorkday) return;

    setStartingWorkday(true);
    setError("");
    setActionError("");

    // Fire-and-forget: start workday in background to avoid blocking navigation
    startWorkday(workday.id).catch((err: unknown) => {
      console.error("Failed to start workday:", err);
    });

    allowNavigation(() => navigate(`/workdays/${workday.id}/active`));
    setStartingWorkday(false);
  }

  async function handleDelete() {
    if (!workday) return;

    try {
      await deleteWorkday(workday.id);
      allowNavigation(() => navigate("/workdays"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete workday";
      setError(message);
    }
  }

  function handleWorkdayFieldChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setError("");

    if (name === "title") {
      setTitle(value);
      const trimmed = value.trim();
      setSaveStatus(trimmed ? "Saving..." : "Unsaved");

      if (titleDebounceRef.current !== null) {
        window.clearTimeout(titleDebounceRef.current);
      }

      if (trimmed && workday) {
        titleDebounceRef.current = window.setTimeout(() => {
          void updateWorkday(workday.id, {
            title: trimmed,
            date: date || "",
            summary: summary.trim() || null,
          })
            .then((updated) => {
              setWorkday((current) => ({
                ...updated,
                workdayCows: current?.workdayCows ?? updated.workdayCows,
                actions: current?.actions ?? updated.actions,
              }));
              setTitle(updated.title);
              setSaveStatus("Saved");
            })
            .catch(() => {
              setSaveStatus("Unsaved changes");
            });
        }, 400);
      }
    } else {
      setSaveStatus("Unsaved changes");
      if (name === "date") setDate(value);
      if (name === "summary") setSummary(value);
    }
  }

  function handleBackClick() {
    navigate("/workdays");
  }

  function handleDeleteClick() {
    setShowDeleteModal(true);
  }

  if (loading) {
    return (
      <div className="allCowsPage">
        <div className="allCowsShell">
          <p className="emptyState">Loading workday...</p>
        </div>
      </div>
    );
  }

  if (!workday) {
    return (
      <div className="allCowsPage">
        <div className="allCowsShell">
          <p className="emptyState">{error || "Workday not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="allCowsPage">
      {error ? <div className="pageErrorBanner">{error}</div> : null}
      {removeSuccessMessage ? (
        <div className="pageSuccessBanner">{removeSuccessMessage}</div>
      ) : null}

      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="cow-header">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleBackClick}
            >
              ← Back to Workdays
            </button>
          </div>

          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Workday Details</h1>
              <p className="pageSubtitle">
                Plan this workday by confirming assigned cows, setting actions,
                and launching when everything is ready.
              </p>
            </div>

            <div className="workdayHeaderActions workday-actions">
              {workday?.status !== "Completed" ? (
                <button
                  type="button"
                  className="addCowButton workdayStartButton"
                  onClick={handleStartWorkday}
                  disabled={!canStartWorkday || startingWorkday}
                >
                  {startingWorkday ? "Starting..." : workdayActionLabel}
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteClick}
              >
                Delete Workday
              </button>
            </div>
          </div>

          <div className="workdaySetupColumns workday-container items-start">
            <div className="workdaySetupColumn">
              <WorkdayComposerCard
                title={title}
                date={date}
                summary={summary}
                error={error}
                saving={saving}
                saveStatus={saveStatus}
                heading="Workday Details"
                subtle="Update the basics for this workday before the crew heads out."
                onChange={handleWorkdayFieldChange}
                onCommit={handleSaveDetails}
                onKeyDown={handleWorkdayFieldKeyDown}
              />
            </div>

            <div className="workdaySetupColumn">
              <WorkdaySetupWorkspacePanel
                actions={workday.actions ?? []}
                actionName={actionName}
                addError={actionError}
                addingAction={addingAction}
                removingActionId={removingActionId}
                assignments={workday.workdayCows ?? []}
                removingCowId={removingAssignedCowId}
                actionInputRef={actionInputRef}
                onActionNameChange={setActionName}
                onAddAction={handleAddAction}
                onRemoveAction={handleRemoveAction}
                onActionInputKeyDown={handleActionInputKeyDown}
                onRemoveCow={handleRemoveCow}
              />
            </div>
          </div>

          <WorkdayAddCowsPanel
            filteredAvailableCows={filteredAvailableCows}
            loading={cowLoading}
            searchTerm={searchTerm}
            activeHealthStatuses={activeHealthStatuses}
            activeLivestockGroups={activeLivestockGroups}
            activeSexes={activeSexes}
            activePregnancyStatuses={activePregnancyStatuses}
            healthStatusFilters={healthStatusFilters}
            livestockGroupFilters={livestockGroupFilters}
            sexFilters={sexFilters}
            pregnancyStatusFilters={pregnancyStatusFilters}
            onSearchChange={setSearchTerm}
            onToggleHealthStatus={(value) =>
              toggleFilter(value, setActiveHealthStatuses)
            }
            onToggleLivestockGroup={(value) =>
              toggleFilter(value, setActiveLivestockGroups)
            }
            onToggleSex={(value) => toggleFilter(value, setActiveSexes)}
            onTogglePregnancyStatus={(value) =>
              toggleFilter(value, setActivePregnancyStatuses)
            }
            selectedCowIds={selectedCowIds}
            isAdding={isAdding}
            onToggleCow={handleToggleCow}
            onSelectAll={handleSelectAll}
            onAdd={handleAddSelected}
          />
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        title="Delete Workday"
        message={`Are you sure you want to delete this workday?\n\nAll assigned cows and actions will be permanently removed.\nThis action cannot be undone.`}
        confirmText="Delete Workday"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          await handleDelete();
        }}
      />
    </div>
  );
}

export default WorkdayPage;
