import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/shared/Modal";
import SelectedCowsSummary from "../../components/workdays/SelectedCowsSummary";
import WorkdayCowSelector from "../../components/workdays/WorkdayCowSelector";
import {
  livestockGroupOptions,
  pregnancyStatusOptions,
  sexOptions,
} from "../../constants/cowFormOptions";
import { getCows } from "../../services/cowService";
import {
  addCowsToWorkday,
  archiveWorkday,
  getWorkdayById,
  removeCowFromWorkday,
  restoreWorkday,
  updateWorkday,
} from "../../services/workdayService";
import type { Cow } from "../../types/cow";
import type { Workday } from "../../types/workday";
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
  const [pendingAssignedCowRemoval, setPendingAssignedCowRemoval] =
    useState<Cow | null>(null);
  const [pendingCowRemoval, setPendingCowRemoval] = useState<Cow | null>(null);
  const [pendingPageAction, setPendingPageAction] = useState<
    "archive" | "back" | null
  >(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

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

    try {
      await removeCowFromWorkday(workday.id, cowId);
      await refreshWorkday();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to remove cow from workday";
      setError(message);
    }
  }

  async function handleArchive() {
    if (!workday) return;

    try {
      await archiveWorkday(workday.id);
      navigate("/workdays");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to archive workday";
      setError(message);
    }
  }

  async function handleRestore() {
    if (!workday) return;

    try {
      await restoreWorkday(workday.id);
      navigate("/workdays");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to restore workday";
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

  function handleArchiveClick() {
    if (hasPendingSelectedCows) {
      setPendingPageAction("archive");
      return;
    }

    setShowArchiveModal(true);
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
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Workday Details</h1>
              <p className="pageSubtitle">
                Update scheduling details, maintain assigned cows, and manage
                this workday from one place.
              </p>
            </div>

            {workday.isArchived ? (
              <button
                type="button"
                className="restoreButton"
                onClick={() => setShowRestoreModal(true)}
              >
                Restore Workday
              </button>
            ) : (
              <button
                type="button"
                className="deleteButton deleteButtonCompact"
                onClick={handleArchiveClick}
              >
                Archive Workday
              </button>
            )}
          </div>

          <div className="workdayCreateLayout">
            <div className="workdayCreateTopGrid">
              <WorkdayComposerCard
                title={title}
                date={date}
                summary={summary}
                error={error}
                saving={saving}
                saveStatus={saveStatus}
                heading="Workday Details"
                subtle="Edits save automatically when you press Enter or click away"
                cancelLabel="Back to Workdays"
                cancelButtonClassName="addCowButton"
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
                onCancel={handleBackClick}
              />

              <SelectedCowsSummary
                selectedCows={assignedCows}
                onRemove={promptAssignedCowRemoval}
              />
            </div>

            <section className="dashboardCard workdayAddCowsCard">
              <div className="dataCardHeader">
                <h2 className="cardTitle">Add More Cows</h2>
                <span className="cardSubtle">Search the active herd</span>
              </div>

              <div className="workdayCreateLayout">
                <SelectedCowsSummary
                  selectedCows={selectedCows}
                  onRemove={promptSelectedCowRemoval}
                  title="Selected Cows"
                  emptyMessage="Select cows from the list below to add them to this workday."
                />

                <div className="workdayDetailActionRow">
                  <button
                    type="button"
                    className="addCowButton"
                    onClick={handleAddSelectedCows}
                    disabled={addingCows || selectedCowIds.length === 0}
                  >
                    {addingCows ? "Adding..." : "Add Selected Cows"}
                  </button>
                </div>

                <WorkdayCowSelector
                  cows={filteredAvailableCows}
                  loading={cowLoading}
                  error=""
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
            </section>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showArchiveModal}
        title="Archive Workday"
        message={`Are you sure you want to archive ${workday.title}?`}
        confirmText="Archive Workday"
        onCancel={() => setShowArchiveModal(false)}
        onConfirm={async () => {
          setShowArchiveModal(false);
          await handleArchive();
        }}
      />

      <Modal
        isOpen={showRestoreModal}
        title="Restore Workday"
        message={`Are you sure you want to restore ${workday.title}?`}
        confirmText="Restore Workday"
        onCancel={() => setShowRestoreModal(false)}
        onConfirm={async () => {
          setShowRestoreModal(false);
          await handleRestore();
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

          setShowArchiveModal(true);
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
