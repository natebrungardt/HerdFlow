import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useBlocker,
  useLocation,
} from "react-router-dom";
import CowDetailsSection from "../../components/cows/CowDetailsSection";
import CowHeroCard from "../../components/cows/CowHeroCard";
import ParentSelectorField from "../../components/cows/ParentSelectorField";
import CowSummaryCard from "../../components/cows/CowSummaryCard";
import HealthStatusToggle from "../../components/cows/HealthStatusToggle";
import Modal from "../../components/shared/Modal";
import Notes from "../../components/cows/Notes";
import {
  heatStatusOptions,
  livestockGroupOptions,
  pregnancyStatusOptions,
  sexOptions,
} from "../../constants/cowFormOptions";
import { getActivities } from "../../services/activityService";
import {
  type CreateCowInput,
  archiveCow,
  getCowById,
  getCows,
  restoreCow,
  updateCow,
} from "../../services/cowService";
import type { Cow } from "../../types/cow";
import "../../styles/CowDetailPage.css";

type ActivityLogEntry = {
  id: string;
  description: string;
  createdAt: string;
};

type ApiError = Error & {
  status?: number;
};

const TAG_NUMBER_PATTERN = /^[A-Za-z0-9-]+$/;
const easeOfBirthOptions = [
  { value: "", label: "Select ease of birth" },
  { value: "Unassisted", label: "Unassisted" },
  { value: "Assisted", label: "Assisted" },
  { value: "Difficult", label: "Difficult" },
  { value: "C-Section", label: "C-Section" },
] as const;

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatDateInputValue(value: string | null | undefined) {
  return value?.split("T")[0] ?? "";
}

function formatDateDisplay(value: string | null | undefined) {
  return value ? formatDateInputValue(value) : "—";
}

function getParentValidationError(cow: Cow) {
  if (cow.sireId && cow.sireName?.trim()) {
    return "Choose either an in-herd sire or a manual sire name.";
  }

  if (cow.damId && cow.damName?.trim()) {
    return "Choose either an in-herd dam or a manual dam name.";
  }

  return "";
}

function formatParentDisplay(
  parent: Cow["sire"] | Cow["dam"],
  fallback?: string | null,
) {
  if (parent) {
    return parent.name?.trim()
      ? `${parent.tagNumber} (${parent.name.trim()})`
      : parent.tagNumber;
  }

  if (fallback?.trim()) {
    return fallback.trim();
  }

  return "—";
}

function toCreateCowInput(cow: Cow): CreateCowInput {
  return {
    tagNumber: cow.tagNumber,
    ownerName: cow.ownerName,
    livestockGroup: cow.livestockGroup,
    breed: cow.breed,
    sex: cow.sex,
    name: cow.name ?? null,
    color: cow.color ?? null,
    healthStatus: cow.healthStatus,
    heatStatus: cow.heatStatus ?? null,
    pregnancyStatus: cow.pregnancyStatus ?? "N/A",
    hasCalf: cow.hasCalf,
    dateOfBirth: cow.dateOfBirth ?? null,
    birthWeight: cow.birthWeight ?? null,
    easeOfBirth: cow.easeOfBirth ?? null,
    sireId: cow.sireId ?? null,
    sireName: cow.sireId ? null : (cow.sireName ?? null),
    damId: cow.damId ?? null,
    damName: cow.damId ? null : (cow.damName ?? null),
    purchaseDate: cow.purchaseDate ?? null,
    saleDate: cow.saleDate ?? null,
    purchasePrice: cow.purchasePrice ?? null,
    salePrice: cow.salePrice ?? null,
    notes: cow.notes ?? null,
  };
}

function getAddCalfParentPreset(cow: Cow): {
  parentCowId: string | null;
  parentType: "sire" | "dam" | null;
} {
  if (cow.sex === "Cow" || cow.sex === "Heifer") {
    return { parentCowId: cow.id, parentType: "dam" };
  }

  if (cow.sex === "Bull") {
    return { parentCowId: cow.id, parentType: "sire" };
  }

  return { parentCowId: null, parentType: null };
}

function CowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cow, setCow] = useState<Cow | null>(null);
  const [originalCow, setOriginalCow] = useState<Cow | null>(null);
  const [formData, setFormData] = useState<Cow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [existingCows, setExistingCows] = useState<Cow[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);
  const [allowNavigation, setAllowNavigation] = useState(false);
  const [confirmedNavigation, setConfirmedNavigation] = useState<
    (() => void) | null
  >(null);

  useEffect(() => {
    async function loadCow() {
      try {
        if (!id) return;
        const data = await getCowById(id);
        setCow(data);
        setOriginalCow(data);
        setFormData(data);
        setError("");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load cow";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadCow();
  }, [id]);

  useEffect(() => {
    async function loadExistingCows() {
      try {
        const cows = await getCows();
        setExistingCows(cows);
      } catch {
        // Keep the detail page usable even if the herd list fails to load.
      }
    }

    void loadExistingCows();
  }, []);

  useEffect(() => {
    async function loadActivities() {
      if (!cow?.id) return;

      setLoadingActivities(true);
      setActivitiesError("");

      try {
        const data = await getActivities(cow.id);
        setActivities(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load activities";
        setActivitiesError(message);
      } finally {
        setLoadingActivities(false);
      }
    }

    void loadActivities();
  }, [cow?.id]);

  const isDirty =
    formData !== null &&
    originalCow !== null &&
    JSON.stringify(formData) !== JSON.stringify(originalCow);
  const blocker = useBlocker(isDirty && !allowNavigation);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }

    setShowUnsavedModal(true);
    setPendingNavigation(() => () => {
      blocker.proceed();
    });
  }, [blocker]);

  useEffect(() => {
    if (!allowNavigation || !confirmedNavigation) {
      return;
    }

    confirmedNavigation();
    setConfirmedNavigation(null);
  }, [allowNavigation, confirmedNavigation]);

  useEffect(() => {
    setAllowNavigation(false);
    setConfirmedNavigation(null);
    setPendingNavigation(null);
  }, [location.key]);

  async function refreshActivities() {
    if (!cow?.id) return;
    setActivitiesError("");

    try {
      const data = await getActivities(cow.id);
      setActivities(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load activities";
      setActivitiesError(message);
    }
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setError("");
    setFormData((current) => {
      if (!current) return current;

      const normalizedValue =
        name === "purchasePrice" ||
        name === "salePrice" ||
        name === "birthWeight"
          ? value === ""
            ? null
            : Number(value)
          : value;

      return {
        ...current,
        [name]: normalizedValue,
      };
    });
  }

  function handleParentChange(
    parent: "sire" | "dam",
    next: { id: string; name: string },
  ) {
    setError("");
    setFormData((current) => {
      if (!current) return current;

      const selectedCow =
        existingCows.find((candidate) => candidate.id === next.id) ?? null;
      const parentSummary = selectedCow
        ? {
            id: selectedCow.id,
            tagNumber: selectedCow.tagNumber,
            name: selectedCow.name ?? null,
          }
        : null;

      return {
        ...current,
        [`${parent}Id`]: next.id || null,
        [`${parent}Name`]: next.id ? null : next.name || null,
        [parent]: parentSummary,
      };
    });
  }

  function handleReset() {
    if (!originalCow) return;
    setFormData(originalCow);
    setError("");
  }

  function requestNavigation(next: () => void) {
    if (isDirty) {
      setPendingNavigation(() => () => {
        setAllowNavigation(true);
        next();
      });
      setShowUnsavedModal(true);
      return;
    }

    next();
  }

  function handleBackClick() {
    requestNavigation(() => navigate("/cows"));
  }

  function handleConfirmLeave() {
    setShowUnsavedModal(false);
    setAllowNavigation(true);

    if (pendingNavigation) {
      setConfirmedNavigation(() => pendingNavigation);
    }
  }

  function handleStay() {
    setShowUnsavedModal(false);
    setAllowNavigation(false);

    if (blocker.state === "blocked") {
      blocker.reset();
    }

    setPendingNavigation(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData || !cow || cow.isRemoved) {
      return;
    }

    const normalizedTagNumber = formData.tagNumber.trim();

    if (!TAG_NUMBER_PATTERN.test(normalizedTagNumber)) {
      setError(
        "Tag number can only include letters, numbers, and dashes. Spaces cannot be used.",
      );
      return;
    }

    const payload = {
      ...formData,
      tagNumber: normalizedTagNumber,
    };

    const parentValidationError = getParentValidationError(payload);
    if (parentValidationError) {
      setError(parentValidationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await updateCow(cow.id, toCreateCowInput(payload));
      setCow(updated);
      setOriginalCow(updated);
      setFormData(updated);
      await refreshActivities();
    } catch (err) {
      let message = "Failed to update cow";
      const apiErr = err as ApiError;
      if (apiErr?.status === 409) {
        message = "Tag number already exists";
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!cow) return;

    try {
      await archiveCow(cow.id);
      navigate("/cows");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to archive cow";
      setError(message);
    }
  }

  async function handleRestore() {
    if (!cow) return;

    try {
      await restoreCow(cow.id);
      await refreshActivities();
      navigate("/removed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to restore cow";
      setError(message);
    }
  }

  if (loading) return <p>Loading cow...</p>;
  if (!cow || !formData) return <p>Cow not found</p>;

  const isEditable = !cow.isRemoved;
  const parentOptions = existingCows.filter(
    (existingCow) => existingCow.id !== cow.id,
  );

  const detailFields = [
    {
      key: "ownerName",
      label: "Owner",
      content: isEditable ? (
        <input
          id="ownerName"
          name="ownerName"
          className="cardInput"
          value={formData.ownerName}
          onChange={handleChange}
          placeholder="Enter owner name"
          required
        />
      ) : (
        <span>{formatValue(formData.ownerName)}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      content: isEditable ? (
        <input
          id="name"
          name="name"
          className="cardInput"
          value={formData.name ?? ""}
          onChange={handleChange}
          placeholder="Enter cow name"
        />
      ) : (
        <span>{formatValue(formData.name)}</span>
      ),
    },
    {
      key: "breed",
      label: "Breed",
      content: isEditable ? (
        <input
          id="breed"
          name="breed"
          className="cardInput"
          value={formData.breed}
          onChange={handleChange}
          placeholder="Enter breed"
        />
      ) : (
        <span>{formatValue(formData.breed)}</span>
      ),
    },
    {
      key: "color",
      label: "Color",
      content: isEditable ? (
        <input
          id="color"
          name="color"
          className="cardInput"
          value={formData.color ?? ""}
          onChange={handleChange}
          placeholder="Enter color"
        />
      ) : (
        <span>{formatValue(formData.color)}</span>
      ),
    },
    {
      key: "sex",
      label: "Sex",
      content: isEditable ? (
        <select
          id="sex"
          name="sex"
          className="cardInput"
          value={formData.sex}
          onChange={handleChange}
        >
          {sexOptions.map((option) => (
            <option key={option.value || "empty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <span>{formatValue(formData.sex)}</span>
      ),
    },
    {
      key: "heatStatus",
      label: "Heat Status",
      content: isEditable ? (
        <select
          id="heatStatus"
          name="heatStatus"
          className="cardInput"
          value={formData.heatStatus ?? ""}
          onChange={handleChange}
        >
          {heatStatusOptions.map((option) => (
            <option key={option.value || "empty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <span>{formatValue(formData.heatStatus)}</span>
      ),
    },
    {
      key: "dateOfBirth",
      label: "Date of Birth",
      content: isEditable ? (
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          className="cardInput"
          value={formatDateInputValue(formData.dateOfBirth)}
          onChange={handleChange}
        />
      ) : (
        <span>{formatDateDisplay(formData.dateOfBirth)}</span>
      ),
    },
    {
      key: "birthWeight",
      label: "Birth Weight",
      content: isEditable ? (
        <input
          id="birthWeight"
          name="birthWeight"
          type="number"
          className="cardInput"
          value={formData.birthWeight ?? ""}
          onChange={handleChange}
          placeholder="Enter birth weight"
        />
      ) : (
        <span>{formatValue(formData.birthWeight)}</span>
      ),
    },
    {
      key: "easeOfBirth",
      label: "Ease of Birth",
      content: isEditable ? (
        <select
          id="easeOfBirth"
          name="easeOfBirth"
          className="cardInput"
          value={formData.easeOfBirth ?? ""}
          onChange={handleChange}
        >
          {easeOfBirthOptions.map((option) => (
            <option key={option.value || "empty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <span>{formatValue(formData.easeOfBirth)}</span>
      ),
    },
    {
      key: "sire",
      label: "Sire (Father)",
      content: isEditable ? (
        <ParentSelectorField
          type="sire"
          cows={parentOptions}
          selectedId={formData.sireId ?? ""}
          manualName={formData.sireName ?? ""}
          onChange={(next) => handleParentChange("sire", next)}
        />
      ) : (
        <span>{formatParentDisplay(formData.sire, formData.sireName)}</span>
      ),
    },
    {
      key: "dam",
      label: "Dam (Mother)",
      content: isEditable ? (
        <ParentSelectorField
          type="dam"
          cows={parentOptions}
          selectedId={formData.damId ?? ""}
          manualName={formData.damName ?? ""}
          onChange={(next) => handleParentChange("dam", next)}
        />
      ) : (
        <span>{formatParentDisplay(formData.dam, formData.damName)}</span>
      ),
    },
    {
      key: "purchaseDate",
      label: "Purchase Date",
      content: isEditable ? (
        <input
          id="purchaseDate"
          name="purchaseDate"
          type="date"
          className="cardInput"
          value={formatDateInputValue(formData.purchaseDate)}
          onChange={handleChange}
        />
      ) : (
        <span>{formatDateDisplay(formData.purchaseDate)}</span>
      ),
    },
    {
      key: "saleDate",
      label: "Sale Date",
      content: isEditable ? (
        <input
          id="saleDate"
          name="saleDate"
          type="date"
          className="cardInput"
          value={formatDateInputValue(formData.saleDate)}
          onChange={handleChange}
        />
      ) : (
        <span>{formatDateDisplay(formData.saleDate)}</span>
      ),
    },
    {
      key: "purchasePrice",
      label: "Purchase Price",
      content: isEditable ? (
        <input
          id="purchasePrice"
          name="purchasePrice"
          type="number"
          className="cardInput"
          value={formData.purchasePrice ?? ""}
          onChange={handleChange}
          placeholder="Enter purchase price"
        />
      ) : (
        <span>{formatCurrency(formData.purchasePrice)}</span>
      ),
    },
    {
      key: "salePrice",
      label: "Sale Price",
      content: isEditable ? (
        <input
          id="salePrice"
          name="salePrice"
          type="number"
          className="cardInput"
          value={formData.salePrice ?? ""}
          onChange={handleChange}
          placeholder="Enter sale price"
        />
      ) : (
        <span>{formatCurrency(formData.salePrice)}</span>
      ),
    },
    {
      key: "hasCalf",
      label: "Calves",
      content: isEditable ? (
        <div className="detailActionStack">
          <button
            type="button"
            className="detailActionButton"
            onClick={() => {
              const preset = getAddCalfParentPreset(cow);

              navigate("/add-cow", {
                state: {
                  openAddCalfModal: true,
                  presetParentCowId: preset.parentCowId,
                  presetParentType: preset.parentType,
                },
              });
            }}
          >
            <span className="detailActionIcon" aria-hidden="true">
              +
            </span>
            <span>Add Calf</span>
          </button>
        </div>
      ) : (
        <span>{formatValue(formData.hasCalf)}</span>
      ),
    },
  ];

  return (
    <div className="cowDetailPage">
      {error && <div className="pageErrorBanner">{error}</div>}

      <div className="cowDetailShell">
        <div className="cow-header">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleBackClick}
          >
            ← Back to Herd
          </button>
        </div>

        <div className="allCowsHeader">
          <div className="titleBlock">
            <h1 className="pageTitle">Cow Details</h1>
            <p className="pageSubtitle">
              {isEditable
                ? "Detailed record for herd tracking, ownership, and lifecycle data."
                : "Archived herd record with historical details and activity."}
            </p>
          </div>

          {cow.isRemoved ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowRestoreModal(true)}
            >
              Restore Cow
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Remove from Herd
            </button>
          )}
        </div>

        <form className="cowDashboardGrid" onSubmit={handleSubmit}>
          <div className="leftColumn">
            <CowHeroCard
              eyebrow={isEditable ? "Cow Overview" : "Archived Cow"}
              headerClassName="cow-overview-header"
              title={
                isEditable ? (
                  <input
                    name="tagNumber"
                    value={formData.tagNumber}
                    onChange={handleChange}
                    required
                    placeholder="Tag #"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="cowTitle heroTitleInput"
                  />
                ) : (
                  <h1 className="cowTitle">
                    {formatValue(formData.tagNumber)}
                  </h1>
                )
              }
              subtitle={
                isEditable
                  ? "Review this record, make any updates, then save once when you're ready."
                  : "This record is archived. Restore it to make changes."
              }
              action={
                isEditable ? (
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                      disabled={!isDirty || saving}
                    >
                      Reset
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!isDirty || saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                ) : null
              }
            >
              <div className="metricsGrid">
                <HealthStatusToggle
                  value={formData.healthStatus || cow.healthStatus}
                  disabled={!isEditable}
                  onChange={(value) => {
                    if (!isEditable) return;
                    setFormData((current) =>
                      current ? { ...current, healthStatus: value } : current,
                    );
                  }}
                />

                <div className="metricCard">
                  <label className="metricLabel" htmlFor="livestockGroup">
                    Livestock Group
                  </label>
                  {isEditable ? (
                    <select
                      id="livestockGroup"
                      name="livestockGroup"
                      className="metricFieldInput"
                      value={formData.livestockGroup}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select group
                      </option>
                      {livestockGroupOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="metricValue">
                      {formatValue(formData.livestockGroup)}
                    </div>
                  )}
                  <div />
                </div>

                <div className="metricCard">
                  <label className="metricLabel" htmlFor="pregnancyStatus">
                    Pregnancy Status
                  </label>
                  {isEditable ? (
                    <select
                      id="pregnancyStatus"
                      name="pregnancyStatus"
                      className="metricFieldInput"
                      value={formData.pregnancyStatus || ""}
                      onChange={handleChange}
                    >
                      {pregnancyStatusOptions.map((option) => (
                        <option
                          key={option.value || "empty"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="metricValue">
                      {formatValue(formData.pregnancyStatus)}
                    </div>
                  )}
                  <div />
                </div>
              </div>
            </CowHeroCard>

            <CowDetailsSection
              title="Cow Details"
              subtitle={
                isEditable
                  ? "Update profile information"
                  : "Profile information"
              }
              fields={detailFields}
            />
          </div>

          <div className="rightColumn cowDetailRightColumnOffset">
            <CowSummaryCard
              ownerName={formData.ownerName}
              subtitle={isEditable ? "Live preview" : "At a glance"}
              purchasePrice={formatCurrency(formData.purchasePrice)}
              salePrice={formatCurrency(formData.salePrice)}
            />
            <Notes cowId={cow.id} />
          </div>
        </form>

        <div className="fullWidthRow">
          <section className="dashboardCard activityCard">
            <div className="dataCardHeader activityCardHeader">
              <h2 className="cardTitle">Activity Log</h2>
              <span className="cardSubtle">Recent timeline</span>
            </div>

            <div className="activityList">
              {loadingActivities ? (
                <p>Loading...</p>
              ) : activitiesError ? (
                <p>{activitiesError}</p>
              ) : activities.length === 0 ? (
                <p>No activity yet</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="activityItem">
                    <div className="activityDot" />
                    <div>
                      <div className="activityText">{activity.description}</div>
                      <div className="activityMeta">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <Modal
        isOpen={showUnsavedModal}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave without saving?"
        confirmText="Leave Without Saving"
        confirmVariant="danger"
        onCancel={handleStay}
        onConfirm={handleConfirmLeave}
      />

      <Modal
        isOpen={showDeleteModal}
        title="Archive Cow"
        message={`Are you sure you want to archive cow #${cow.tagNumber}? This will move it to the archived cows list.`}
        confirmText="Archive Cow"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          handleDelete();
          setShowDeleteModal(false);
        }}
      />

      <Modal
        isOpen={showRestoreModal}
        title="Restore Cow"
        message={`Are you sure you want to restore cow #${cow.tagNumber}? This will move it back to your active herd.`}
        confirmText="Restore Cow"
        confirmVariant="success"
        onCancel={() => setShowRestoreModal(false)}
        onConfirm={async () => {
          await handleRestore();
          setShowRestoreModal(false);
        }}
      />
    </div>
  );
}

export default CowDetailPage;
