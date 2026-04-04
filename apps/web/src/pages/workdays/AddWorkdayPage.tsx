import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePendingWorkdaySelection } from "../../context/usePendingWorkdaySelection";
import Modal from "../../components/shared/Modal";
import SelectedCowsSummary from "../../components/workdays/SelectedCowsSummary";
import WorkdayComposerCard from "../../components/workdays/WorkdayComposerCard";
import WorkdayCowSelector from "../../components/workdays/WorkdayCowSelector";
import {
  livestockGroupOptions,
  pregnancyStatusOptions,
  sexOptions,
} from "../../constants/cowFormOptions";
import { getCows } from "../../services/cowService";
import {
  createWorkday,
  getActiveWorkdays,
  type CreateWorkdayInput,
} from "../../services/workdayService";
import type { Cow } from "../../types/cow";
import "../../styles/AllCows.css";

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function AddWorkdayPage() {
  const navigate = useNavigate();
  const { setHasPendingSelections } = usePendingWorkdaySelection();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cows, setCows] = useState<Cow[]>([]);
  const [selectedCowIds, setSelectedCowIds] = useState<string[]>([]);
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
  const [loadingCows, setLoadingCows] = useState(true);
  const [cowError, setCowError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingCowRemoval, setPendingCowRemoval] = useState<Cow | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

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
    async function loadCows() {
      try {
        setCowError("");
        const data = await getCows();
        setCows(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load cows";
        setCowError(message);
      } finally {
        setLoadingCows(false);
      }
    }

    void loadCows();
  }, []);

  const filteredCows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return cows.filter((cow) => {
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
    cows,
    searchTerm,
    activeHealthStatuses,
    activeLivestockGroups,
    activeSexes,
    activePregnancyStatuses,
  ]);

  const selectedCows = useMemo(() => {
    return cows.filter((cow) => selectedCowIds.includes(cow.id));
  }, [cows, selectedCowIds]);

  const hasPendingSelectedCows = selectedCowIds.length > 0;

  useEffect(() => {
    setHasPendingSelections(hasPendingSelectedCows);

    return () => {
      setHasPendingSelections(false);
    };
  }, [hasPendingSelectedCows, setHasPendingSelections]);

  function handleFieldChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setSaveError("");

    if (name === "title") setTitle(value);
    if (name === "date") setDate(value);
    if (name === "summary") setSummary(value);
  }

  function toggleCow(cowId: string) {
    setSelectedCowIds((current) =>
      current.includes(cowId)
        ? current.filter((id) => id !== cowId)
        : [...current, cowId],
    );
  }

  function promptSelectedCowRemoval(cowId: string) {
    const cowToRemove = selectedCows.find((cow) => cow.id === cowId) ?? null;
    setPendingCowRemoval(cowToRemove);
  }

  function toggleFilter(
    value: string,
    setState: React.Dispatch<React.SetStateAction<string[]>>,
  ) {
    setState((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");

    const normalizedTitle = title.trim();
    const normalizedSummary = summary.trim();
    const payload: CreateWorkdayInput = {
      title: normalizedTitle,
      date: date || null,
      summary: normalizedSummary ? normalizedSummary : null,
      cowIds: selectedCowIds,
    };

    let stopped = false;
    let completed = false;

    const monitorCreatedWorkday = async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await delay(attempt === 0 ? 4000 : 2500);

        if (stopped || completed) {
          return;
        }

        const workdays = await getActiveWorkdays();
        const wasCreated = workdays.some((workday) => {
          const sameTitle = workday.title.trim() === normalizedTitle;
          const sameDate = date === "" || workday.date.startsWith(date);
          const sameSummary = (workday.summary ?? "").trim() === normalizedSummary;

          return sameTitle && sameDate && sameSummary;
        });

        if (wasCreated) {
          completed = true;
          navigate("/workdays");
          return;
        }
      }
    };

    const monitorPromise = monitorCreatedWorkday().catch(() => {
      // Ignore polling errors and let the main save result drive the fallback message.
    });

    try {
      await createWorkday(payload);

      if (!completed) {
        completed = true;
        navigate("/workdays");
      }
    } catch (err) {
      if (completed) {
        return;
      }

      const message =
        err instanceof Error ? err.message : "Failed to create workday";
      setSaveError(message);
      setSaving(false);
      stopped = true;
      await monitorPromise;
      return;
    }

    stopped = true;
    await monitorPromise;
    setSaving(false);
  }

  function handleCancelClick() {
    if (hasPendingSelectedCows) {
      setShowLeaveModal(true);
      return;
    }

    navigate("/workdays");
  }

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Add Workday</h1>
              <p className="pageSubtitle">
                Build a workday plan, add general notes, and choose the cows
                for this crew list.
              </p>
            </div>
          </div>

          <div className="workdayCreateLayout">
            <div className="workdayCreateTopGrid">
              <WorkdayComposerCard
                title={title}
                date={date}
                summary={summary}
                error={saveError}
                saving={saving}
                heading="Workday Details"
                subtle="Create the workday first, then review the selected cows before saving."
                onChange={handleFieldChange}
                onSubmit={handleSubmit}
                onCancel={handleCancelClick}
              />

              <SelectedCowsSummary
                selectedCows={selectedCows}
                onRemove={promptSelectedCowRemoval}
                title="Selected Cows"
                emptyMessage="Select cows from the list below to include them in this workday."
              />
            </div>

            <WorkdayCowSelector
              cows={filteredCows}
              loading={loadingCows}
              error={cowError}
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
        </div>
      </div>

      <Modal
        isOpen={showLeaveModal}
        title="Pending Cows to Add"
        message="You have cows pending to be added to this workday. Add them before leaving, or continue without adding them."
        confirmText="Leave Page"
        onCancel={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          navigate("/workdays");
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
    </div>
  );
}

export default AddWorkdayPage;
