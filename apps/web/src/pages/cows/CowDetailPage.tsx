import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CowDetailsSection from "../../components/cows/CowDetailsSection";
import CowHeroCard from "../../components/cows/CowHeroCard";
import HasCalfToggle from "../../components/cows/HasCalfToggle";
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

type EditableFieldName =
  | "ownerName"
  | "breed"
  | "sex"
  | "heatStatus"
  | "dateOfBirth"
  | "purchaseDate"
  | "purchasePrice"
  | "saleDate"
  | "salePrice";

type EditingFieldName =
  | EditableFieldName
  | "tagNumber"
  | "livestockGroup"
  | "pregnancyStatus";

type ApiError = Error & {
  status?: number;
};

const editableFields: EditableFieldName[] = [
  "ownerName",
  "breed",
  "sex",
  "heatStatus",
  "dateOfBirth",
  "purchaseDate",
  "purchasePrice",
  "saleDate",
  "salePrice",
];

const TAG_NUMBER_PATTERN = /^[A-Za-z0-9-]+$/;

function formatValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return formatBoolean(value);
  return String(value);
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/([A-Z])/g, " $1").trim();
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBoolean(value: boolean | null | undefined) {
  return value ? "Yes" : "No";
}

function toCreateCowInput(cow: Cow): CreateCowInput {
  return {
    tagNumber: cow.tagNumber,
    ownerName: cow.ownerName,
    livestockGroup: cow.livestockGroup,
    breed: cow.breed,
    sex: cow.sex,
    healthStatus: cow.healthStatus,
    heatStatus: cow.heatStatus ?? null,
    pregnancyStatus: cow.pregnancyStatus ?? "N/A",
    hasCalf: cow.hasCalf,
    dateOfBirth: cow.dateOfBirth ?? null,
    purchaseDate: cow.purchaseDate ?? null,
    saleDate: cow.saleDate ?? null,
    purchasePrice: cow.purchasePrice ?? null,
    salePrice: cow.salePrice ?? null,
    notes: cow.notes ?? null,
  };
}

function CowDetailPage() {
  const { id } = useParams();
  const [cow, setCow] = useState<Cow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Cow | null>(null);
  const [editingField, setEditingField] = useState<EditingFieldName | null>(
    null,
  );
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    async function loadCow() {
      try {
        if (!id) return;
        const data = await getCowById(id);
        setCow(data);
        setFormData(data);
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

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setFormData((prev) => {
      if (!prev) return prev;

      const normalizedValue =
        name === "purchasePrice" || name === "salePrice"
          ? value === ""
            ? null
            : Number(value)
          : value;

      return {
        ...prev,
        [name]: normalizedValue,
      };
    });
  }

  async function saveCowUpdates() {
    if (!formData || !cow) return false;

    if (!TAG_NUMBER_PATTERN.test(formData.tagNumber.trim())) {
      setError("Tag number can only include letters, numbers, and dashes.");
      return false;
    }

    const prev = cow;

    try {
      const updated = await updateCow(cow.id, toCreateCowInput(formData));
      setCow(updated);
      setFormData(updated);
      await refreshActivities();
      return true;
    } catch (err) {
      let message = "Failed to update cow";
      const apiErr = err as ApiError;
      if (apiErr?.status === 409) {
        message = "Tag number already exists";
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setFormData(prev);
      return false;
    }
  }

  async function commitField(nextField: EditingFieldName | null = null) {
    const didSave = await saveCowUpdates();

    if (didSave) {
      setEditingField(nextField);
    }
  }

  async function handleEditableKeyDown(
    event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    if (!editingField) return;

    if (event.key === "Enter") {
      event.preventDefault();
      await commitField();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const currentIndex = editableFields.indexOf(
        editingField as EditableFieldName,
      );
      const nextField = editableFields[currentIndex + 1] ?? null;
      await commitField(nextField);
    }
  }

  async function updateHealthStatus(value: "Healthy" | "NeedsTreatment") {
    if (!formData || !cow) return;

    const next = { ...formData, healthStatus: value } as Cow;
    setFormData(next);

    const updated = await updateCow(cow.id, toCreateCowInput(next));
    setCow(updated);
    setFormData(updated);
    await refreshActivities();
  }

  async function updateHasCalf(value: boolean) {
    if (!formData || !cow) return;

    const next = { ...formData, hasCalf: value } as Cow;
    setFormData(next);

    const updated = await updateCow(cow.id, toCreateCowInput(next));
    setCow(updated);
    setFormData(updated);
    await refreshActivities();
  }

  function renderEditableField(config: {
    name: EditableFieldName;
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: readonly { value: string; label: string }[];
    displayValue?: string;
  }) {
    const isEditing = editingField === config.name;
    const value = formData?.[config.name];
    const inputValue =
      config.type === "date"
        ? (value?.toString().split("T")[0] ?? "")
        : (value ?? "");

    let content: React.ReactNode;

    if (isEditing) {
      content =
        config.type === "select" ? (
          <select
            name={config.name}
            value={String(inputValue)}
            onChange={handleChange}
            onBlur={async () => commitField()}
            onKeyDown={handleEditableKeyDown}
            autoFocus
            className="inlineFieldInput"
          >
            {config.options?.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={config.type}
            name={config.name}
            value={inputValue as string | number}
            onChange={handleChange}
            onBlur={async () => commitField()}
            onKeyDown={handleEditableKeyDown}
            autoFocus
            className="inlineFieldInput"
          />
        );
    } else {
      content = <span>{config.displayValue ?? formatValue(value)}</span>;
    }

    return {
      key: config.name,
      label: config.label,
      content,
      onDoubleClick: () => {
        if (editingField !== config.name) {
          setEditingField(config.name);
        }
      },
    };
  }

  if (loading) return <p>Loading cow...</p>;
  if (!cow || !formData) return <p>Cow not found</p>;

  const detailFields = [
    renderEditableField({
      name: "ownerName",
      label: "Owner",
      type: "text",
    }),
    renderEditableField({
      name: "breed",
      label: "Breed",
      type: "text",
    }),
    renderEditableField({
      name: "sex",
      label: "Sex",
      type: "select",
      options: sexOptions,
    }),
    renderEditableField({
      name: "heatStatus",
      label: "Heat Status",
      type: "select",
      options: [
        { value: "", label: "Select" },
        ...heatStatusOptions.filter((option) => option.value !== ""),
      ],
      displayValue: formatLabel(formData.heatStatus),
    }),
    renderEditableField({
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
    }),
    renderEditableField({
      name: "purchaseDate",
      label: "Purchase Date",
      type: "date",
    }),
    renderEditableField({
      name: "saleDate",
      label: "Sale Date",
      type: "date",
    }),
    renderEditableField({
      name: "purchasePrice",
      label: "Purchase Price",
      type: "number",
      displayValue: formatCurrency(formData.purchasePrice),
    }),
    renderEditableField({
      name: "salePrice",
      label: "Sale Price",
      type: "number",
      displayValue: formatCurrency(formData.salePrice),
    }),
    {
      key: "hasCalf",
      label: "Has Calf",
      content: (
        <HasCalfToggle
          compact
          value={formData.hasCalf}
          onChange={updateHasCalf}
        />
      ),
    },
  ];

  const groupValue = formData.livestockGroup || "";
  const pregnancyValue = formData.pregnancyStatus || "";

  return (
    <div className="cowDetailPage">
      {error && <div className="pageErrorBanner">{error}</div>}

      <div className="cowDetailShell">
        <div className="allCowsHeader">
          <div className="titleBlock">
            <h1 className="pageTitle">Cow Details</h1>
            <p className="pageSubtitle">
              Detailed record for herd tracking, ownership, and lifecycle data.
            </p>
          </div>

          {cow.isRemoved ? (
            <button
              type="button"
              className="restoreButton"
              onClick={() => setShowRestoreModal(true)}
            >
              Restore Cow
            </button>
          ) : (
            <button
              type="button"
              className="deleteButton deleteButtonCompact"
              onClick={() => setShowDeleteModal(true)}
            >
              Remove Cow
            </button>
          )}
        </div>

        <div className="cowDashboardGrid">
          <div className="leftColumn">
            <CowHeroCard
              eyebrow="Cow Overview"
              title={
                <h1
                  className="cowTitle"
                  onDoubleClick={() => {
                    if (editingField !== "tagNumber") {
                      setEditingField("tagNumber");
                    }
                  }}
                >
                  {editingField === "tagNumber" ? (
                    <input
                      name="tagNumber"
                      value={formData.tagNumber || ""}
                      onChange={handleChange}
                      onBlur={async () => commitField()}
                      onKeyDown={handleEditableKeyDown}
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="heroTitleInput"
                    />
                  ) : (
                    formatValue(formData.tagNumber)
                  )}
                </h1>
              }
              subtitle="Return to the herd list or keep editing this record."
              action={
                <div className="heroActions">
                  <button
                    type="button"
                    className="addCowButton addCowButtonSuccess"
                    onClick={() => navigate("/cows")}
                  >
                    Back to Herd
                  </button>
                </div>
              }
            >
              <div className="metricsGrid">
                <HealthStatusToggle
                  value={formData.healthStatus || cow.healthStatus}
                  onChange={updateHealthStatus}
                />

                <div className="metricCard">
                  <div className="metricLabel">Livestock Group</div>
                  <div
                    className="metricValue"
                    onDoubleClick={() => {
                      if (editingField !== "livestockGroup") {
                        setEditingField("livestockGroup");
                      }
                    }}
                  >
                    {editingField === "livestockGroup" ? (
                      <select
                        name="livestockGroup"
                        value={groupValue}
                        onChange={handleChange}
                        onBlur={async () => commitField()}
                        autoFocus
                        className="metricFieldInput"
                      >
                        {livestockGroupOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{formatValue(formData.livestockGroup)}</span>
                    )}
                  </div>
                  <div className="metricAccent" />
                </div>

                <div className="metricCard">
                  <div className="metricLabel">Pregnancy Status</div>
                  <div
                    className="metricValue"
                    onDoubleClick={() => {
                      if (editingField !== "pregnancyStatus") {
                        setEditingField("pregnancyStatus");
                      }
                    }}
                  >
                    {editingField === "pregnancyStatus" ? (
                      <select
                        name="pregnancyStatus"
                        value={pregnancyValue}
                        onChange={handleChange}
                        onBlur={async () => commitField()}
                        autoFocus
                        className="metricFieldInput"
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
                      <span>{formatValue(formData.pregnancyStatus)}</span>
                    )}
                  </div>
                  <div className="metricAccent" />
                </div>
              </div>
            </CowHeroCard>

            <CowDetailsSection
              title="Cow Details"
              subtitle="Profile information"
              fields={detailFields}
            />
          </div>

          <div className="rightColumn cowDetailRightColumnOffset">
            <CowSummaryCard
              ownerName={cow.ownerName}
              subtitle="At a glance"
              purchasePrice={formatCurrency(cow.purchasePrice)}
              salePrice={formatCurrency(cow.salePrice)}
            />
            <Notes cowId={cow.id} />
          </div>
        </div>

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
