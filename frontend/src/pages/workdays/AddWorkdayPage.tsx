import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SelectedCowsSummary from "../../components/workdays/SelectedCowsSummary";
import WorkdayComposerCard from "../../components/workdays/WorkdayComposerCard";
import WorkdayCowSelector from "../../components/workdays/WorkdayCowSelector";
import { getCows } from "../../services/cowService";
import {
  createWorkday,
  type CreateWorkdayInput,
} from "../../services/workdayService";
import type { Cow } from "../../types/cow";
import "../../styles/AllCows.css";

function AddWorkdayPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cows, setCows] = useState<Cow[]>([]);
  const [selectedCowIds, setSelectedCowIds] = useState<number[]>([]);
  const [loadingCows, setLoadingCows] = useState(true);
  const [cowError, setCowError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

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

    if (!normalizedSearch) {
      return cows;
    }

    return cows.filter((cow) => {
      return (
        cow.tagNumber.toLowerCase().includes(normalizedSearch) ||
        (cow.ownerName ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [cows, searchTerm]);

  const selectedCows = useMemo(() => {
    return cows.filter((cow) => selectedCowIds.includes(cow.id));
  }, [cows, selectedCowIds]);

  function handleFieldChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setSaveError("");

    if (name === "title") setTitle(value);
    if (name === "date") setDate(value);
    if (name === "summary") setSummary(value);
  }

  function toggleCow(cowId: number) {
    setSelectedCowIds((current) =>
      current.includes(cowId)
        ? current.filter((id) => id !== cowId)
        : [...current, cowId],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");

    const payload: CreateWorkdayInput = {
      title,
      date: date || null,
      summary: summary.trim() ? summary : null,
      cowIds: selectedCowIds,
    };

    try {
      await createWorkday(payload);
      navigate("/workdays");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create workday";
      setSaveError(message);
      setSaving(false);
      return;
    }

    setSaving(false);
  }

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Add Workday</h1>
              <p className="pageSubtitle">
                Build a workday plan, add general notes, and select the cows
                that belong on this crew list.
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
                onChange={handleFieldChange}
                onSubmit={handleSubmit}
                onCancel={() => navigate("/workdays")}
              />

              <SelectedCowsSummary
                selectedCows={selectedCows}
                onRemove={toggleCow}
              />
            </div>

            <WorkdayCowSelector
              cows={filteredCows}
              loading={loadingCows}
              error={cowError}
              searchTerm={searchTerm}
              selectedCowIds={selectedCowIds}
              onSearchChange={setSearchTerm}
              onToggleCow={toggleCow}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWorkdayPage;
