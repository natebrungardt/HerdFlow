import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/shared/Modal";
import WorkdayAddCowsPanel from "../../components/workdays/WorkdayAddCowsPanel";
import WorkdaySetupWorkspacePanel from "../../components/workdays/WorkdaySetupWorkspacePanel";
import {
  livestockGroupOptions,
  pregnancyStatusOptions,
  sexOptions,
} from "../../constants/cowFormOptions";
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
import { usePendingWorkdaySelection } from "../../context/usePendingWorkdaySelection";
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

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function WorkdayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setHasPendingSelections } = usePendingWorkdaySelection();
  const [workday, setWorkday] = useState<Workday | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [actions, setActions] = useState<WorkdayAction[]>([]);
  const [actionName, setActionName] = useState("");
  const [allCows, setAllCows] = useState<Cow[]>([]);
  const [selectedCowIds, setSelectedCowIds] = useState<string[]>([]);
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
  const [addingCows, setAddingCows] = useState(false);
  const [addingAction, setAddingAction] = useState(false);
  const [startingWorkday, setStartingWorkday] = useState(false);
  const [removingActionId, setRemovingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [removingAssignedCowId, setRemovingAssignedCowId] = useState<
    string | null
  >(null);
  const [pendingAssignedCowRemoval, setPendingAssignedCowRemoval] =
    useState<Cow | null>(null);
  const [pendingCowRemoval, setPendingCowRemoval] = useState<Cow | null>(null);
  const [pendingPageAction, setPendingPageAction] = useState<
    "delete" | "back" | null
  >(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const healthStatusFilters = ["Healthy", "Needs Treatment"];
  const livestockGroupFilters = livestockGroupOptions.map(
    (option) => option.value,
  );
  const sexFilters = sexOptions
    .filter((option) => option.value !== "")
    .map((option) => option.value);
  const pregnancyStatusFilters = pregnancyStatusOptions
    .filter((option) => option.value !== "N/A")
    .map((option) => option.value);

  useEffect(() => {
    async function loadPage() {
      if (!id) return;

      try {
        setError("");
        const [workdayData, cowsData] = await Promise.all([
          getWorkdayById(id),
          getCows(),
        ]);

        setWorkday(workdayData);
        setActions(workdayData.actions ?? []);
        setTitle(workdayData.title);
        setDate(formatDateInput(workdayData.date));
        setSummary(workdayData.summary ?? "");
        setSaveStatus("Saved");
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
        activeLivestockGroups.includes(cow.livestockGroup);

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

  const selectedCows = useMemo(
    () => availableCows.filter((cow) => selectedCowIds.includes(cow.id)),
    [availableCows, selectedCowIds],
  );
  const assignedCows = useMemo(
    () => (workday?.workdayCows ?? []).map((assignment) => assignment.cow),
    [workday],
  );
  const canStartWorkday =
    workday?.status !== "Completed" &&
    (workday?.workdayCows?.length ?? 0) > 0 &&
    actions.length > 0;

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

  function toggleCow(cowId: string) {
    setSelectedCowIds((current) =>
      current.includes(cowId)
        ? current.filter((idValue) => idValue !== cowId)
        : [...current, cowId],
    );
  }

  function promptSelectedCowRemoval(cowId: string) {
    const cowToRemove = selectedCows.find((cow) => cow.id === cowId) ?? null;
    setPendingCowRemoval(cowToRemove);
  }

  function promptAssignedCowRemoval(cowId: string) {
    const cowToRemove = assignedCows.find((cow) => cow.id === cowId) ?? null;
    setPendingAssignedCowRemoval(cowToRemove);
  }

  const hasPendingSelectedCows = selectedCowIds.length > 0;

  useEffect(() => {
    setHasPendingSelections(hasPendingSelectedCows);

    return () => {
      setHasPendingSelections(false);
    };
  }, [hasPendingSelectedCows, setHasPendingSelections]);

  async function refreshWorkday() {
    if (!id) return;
    const data = await getWorkdayById(id);
    setWorkday(data);
    setActions(data.actions ?? []);
    setTitle(data.title);
    setDate(formatDateInput(data.date));
    setSummary(data.summary ?? "");
    setSaveStatus("Saved");
  }

  async function handleSaveDetails() {
    if (!workday) return;

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

  async function handleAddSelectedCows() {
    if (!workday || selectedCowIds.length === 0) return;

    setAddingCows(true);
    setError("");

    const pendingCowIds = [...selectedCowIds];
    let stopped = false;
    let completed = false;

    const monitorAssignedCows = async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await delay(attempt === 0 ? 4000 : 2500);

        if (stopped || completed) {
          return;
        }

        const refreshedWorkday = await getWorkdayById(workday.id);
        const assignedCowIds = new Set(
          (refreshedWorkday.workdayCows ?? []).map(
            (assignment) => assignment.cowId,
          ),
        );
        const allAssigned = pendingCowIds.every((cowId) =>
          assignedCowIds.has(cowId),
        );

        if (allAssigned) {
          completed = true;
          setWorkday(refreshedWorkday);
          setTitle(refreshedWorkday.title);
          setDate(formatDateInput(refreshedWorkday.date));
          setSummary(refreshedWorkday.summary ?? "");
          setSelectedCowIds([]);
          return;
        }
      }
    };

    const monitorPromise = monitorAssignedCows().catch(() => {
      // Ignore polling errors and let the main save result drive the fallback message.
    });

    try {
      await addCowsToWorkday(workday.id, pendingCowIds);

      if (!completed) {
        setSelectedCowIds([]);
        await refreshWorkday();
        completed = true;
      }
    } catch (err) {
      if (!completed) {
        const message =
          err instanceof Error ? err.message : "Failed to add cows to workday";
        setError(message);
      }
    } finally {
      stopped = true;
      await monitorPromise;
      setAddingCows(false);
    }
  }

  async function handleRemoveCow(cowId: string) {
    if (!workday) return;

    setError("");
    setRemovingAssignedCowId(cowId);

    try {
      await removeCowFromWorkday(workday.id, cowId);
      await refreshWorkday();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove cow from workday";
      setError(message);
    } finally {
      setRemovingAssignedCowId(null);
    }
  }

  async function handleAddAction() {
    if (!workday || actionName.trim().length === 0) return;

    setAddingAction(true);
    setActionError("");
    setError("");

    try {
      await addWorkdayAction(workday.id, { name: actionName.trim() });
      setActionName("");
      await refreshWorkday();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add workday action";
      setActionError(message);
    } finally {
      setAddingAction(false);
    }
  }

  async function handleRemoveAction(actionId: string) {
    if (!workday) return;

    setRemovingActionId(actionId);
    setActionError("");
    setError("");

    try {
      await removeWorkdayAction(workday.id, actionId);
      await refreshWorkday();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove workday action";
      setActionError(message);
    } finally {
      setRemovingActionId(null);
    }
  }

  function handleActionInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void handleAddAction();
  }

  async function handleStartWorkday() {
    if (!workday || !canStartWorkday) return;

    setStartingWorkday(true);
    setError("");
    setActionError("");

    try {
      await startWorkday(workday.id);
      navigate(`/workdays/${workday.id}/active`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start workday";
      setError(message);
    } finally {
      setStartingWorkday(false);
    }
  }

  async function handleDelete() {
    if (!workday) return;

    try {
      await deleteWorkday(workday.id);
      navigate("/workdays");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete workday";
      setError(message);
    }
  }

  function handleBackClick() {
    if (hasPendingSelectedCows) {
      setPendingPageAction("back");
      return;
    }

    navigate("/workdays");
  }

  function handleDeleteClick() {
    if (hasPendingSelectedCows) {
      setPendingPageAction("delete");
      return;
    }

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
              <button
                type="button"
                className="addCowButton workdayStartButton"
                onClick={handleStartWorkday}
                disabled={!canStartWorkday || startingWorkday}
              >
                {startingWorkday ? "Starting..." : "Start Workday"}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteClick}
              >
                Delete Workday
              </button>
            </div>
          </div>

          <div className="workdaySetupColumns workday-container">
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
                onChange={(event) => {
                  const { name, value } = event.target;
                  setError("");
                  setSaveStatus("Unsaved changes");
                  if (name === "title") setTitle(value);
                  if (name === "date") setDate(value);
                  if (name === "summary") setSummary(value);
                }}
                onCommit={handleSaveDetails}
                onKeyDown={handleWorkdayFieldKeyDown}
              />
            </div>

            <div className="workdaySetupColumn">
              <WorkdaySetupWorkspacePanel
                actions={actions}
                actionName={actionName}
                addError={actionError}
                addingAction={addingAction}
                removingActionId={removingActionId}
                assignments={workday.workdayCows ?? []}
                removingCowId={removingAssignedCowId}
                onActionNameChange={setActionName}
                onAddAction={handleAddAction}
                onRemoveAction={handleRemoveAction}
                onActionInputKeyDown={handleActionInputKeyDown}
                onRemoveCow={promptAssignedCowRemoval}
              />
            </div>
          </div>

          <WorkdayAddCowsPanel
            selectedCows={selectedCows}
            filteredAvailableCows={filteredAvailableCows}
            loading={cowLoading}
            searchTerm={searchTerm}
            selectedCowIds={selectedCowIds}
            activeHealthStatuses={activeHealthStatuses}
            activeLivestockGroups={activeLivestockGroups}
            activeSexes={activeSexes}
            activePregnancyStatuses={activePregnancyStatuses}
            healthStatusFilters={healthStatusFilters}
            livestockGroupFilters={livestockGroupFilters}
            sexFilters={sexFilters}
            pregnancyStatusFilters={pregnancyStatusFilters}
            addingCows={addingCows}
            onRemoveSelectedCow={promptSelectedCowRemoval}
            onAddSelectedCows={handleAddSelectedCows}
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
            onToggleCow={toggleCow}
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

      <Modal
        isOpen={pendingPageAction !== null}
        title="Pending Cows to Add"
        message="You have cows pending to be added to this workday. Add them before leaving, or continue without adding them."
        confirmText="Continue"
        onCancel={() => setPendingPageAction(null)}
        onConfirm={() => {
          if (!pendingPageAction) return;

          const nextAction = pendingPageAction;
          setPendingPageAction(null);

          if (nextAction === "back") {
            navigate("/workdays");
            return;
          }

          setShowDeleteModal(true);
        }}
      />

      <Modal
        isOpen={pendingCowRemoval !== null}
        title="Remove Selected Cow"
        message={`Are you sure you want to remove cow #${pendingCowRemoval?.tagNumber ?? ""} from this workday selection?`}
        confirmText="Remove Cow"
        onCancel={() => setPendingCowRemoval(null)}
        onConfirm={() => {
          if (!pendingCowRemoval) return;
          toggleCow(pendingCowRemoval.id);
          setPendingCowRemoval(null);
        }}
      />

      <Modal
        isOpen={pendingAssignedCowRemoval !== null}
        title="Remove Assigned Cow"
        message={`Are you sure you want to remove cow #${pendingAssignedCowRemoval?.tagNumber ?? ""} from this workday?`}
        confirmText="Remove Cow"
        onCancel={() => setPendingAssignedCowRemoval(null)}
        onConfirm={async () => {
          if (!pendingAssignedCowRemoval) return;
          const cowId = pendingAssignedCowRemoval.id;
          setPendingAssignedCowRemoval(null);
          await handleRemoveCow(cowId);
        }}
      />
    </div>
  );
}

export default WorkdayPage;
