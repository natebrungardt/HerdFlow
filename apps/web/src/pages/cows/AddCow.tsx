import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CowDetailsSection from "../../components/cows/CowDetailsSection";
import CowHeroCard from "../../components/cows/CowHeroCard";
import HasCalfToggle from "../../components/cows/HasCalfToggle";
import CowSummaryCard from "../../components/cows/CowSummaryCard";
import HealthStatusToggle from "../../components/cows/HealthStatusToggle";
import {
  heatStatusOptions,
  livestockGroupOptions,
  pregnancyStatusOptions,
  sexOptions,
} from "../../constants/cowFormOptions";
import { createCow, getCows } from "../../services/cowService";
import "../../styles/CowDetailPage.css";

type FormState = {
  tagNumber: string;
  ownerName: string;
  breed: string;
  sex: string;
  healthStatus: string;
  heatStatus: string;
  pregnancyStatus: string;
  hasCalf: boolean;
  livestockGroup: string;
  dateOfBirth: string;
  purchaseDate: string;
  saleDate: string;
  purchasePrice: string;
  salePrice: string;
  notes: string;
};

const TAG_NUMBER_PATTERN = /^[A-Za-z0-9-]+$/;

const initialFormState: FormState = {
  tagNumber: "",
  ownerName: "",
  breed: "",
  sex: "",
  healthStatus: "Healthy",
  heatStatus: "",
  pregnancyStatus: "N/A",
  hasCalf: false,
  livestockGroup: "",
  dateOfBirth: "",
  purchaseDate: "",
  saleDate: "",
  purchasePrice: "",
  salePrice: "",
  notes: "",
};

function formatCurrencyPreview(value: string) {
  if (!value) return "—";

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function AddCowPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setError("");

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const normalizedTagNumber = formData.tagNumber.trim();

    if (!TAG_NUMBER_PATTERN.test(normalizedTagNumber)) {
      setError("Tag number can only include letters, numbers, and dashes.");
      setSaving(false);
      return;
    }

    let stopped = false;
    let completed = false;

    const monitorCreatedCow = async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await delay(attempt === 0 ? 4000 : 2500);

        if (stopped || completed) {
          return;
        }

        const cows = await getCows();
        const wasCreated = cows.some(
          (cow: { tagNumber: string }) => cow.tagNumber === normalizedTagNumber,
        );

        if (wasCreated) {
          completed = true;
          navigate("/cows");
          return;
        }
      }
    };

    const monitorPromise = monitorCreatedCow().catch(() => {
      // Ignore polling errors and let the main save result drive the fallback message.
    });

    try {
      await createCow({
        tagNumber: normalizedTagNumber,
        ownerName: formData.ownerName,
        breed: formData.breed,
        sex: formData.sex,
        healthStatus: formData.healthStatus || "Healthy",
        heatStatus: formData.heatStatus === "" ? null : formData.heatStatus,
        pregnancyStatus: formData.pregnancyStatus || "N/A",
        hasCalf: formData.hasCalf,
        livestockGroup: formData.livestockGroup,
        dateOfBirth: formData.dateOfBirth || null,
        purchaseDate: formData.purchaseDate || null,
        saleDate: formData.saleDate || null,
        purchasePrice: formData.purchasePrice
          ? Number(formData.purchasePrice)
          : null,
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        notes: formData.notes || null,
      });

      if (!completed) {
        completed = true;
        navigate("/cows");
      }
    } catch (err) {
      if (completed) {
        return;
      }

      const message =
        err instanceof Error ? err.message : "Failed to create cow";
      setError(message);
      setSaving(false);
      stopped = true;
      await monitorPromise;
      return;
    }

    stopped = true;
    await monitorPromise;
    setSaving(false);
  }

  const detailFields = [
    {
      key: "ownerName",
      label: "Owner",
      content: (
        <input
          id="ownerName"
          name="ownerName"
          className="cardInput"
          value={formData.ownerName}
          onChange={handleChange}
          placeholder="Enter owner name"
          required
        />
      ),
    },
    {
      key: "breed",
      label: "Breed",
      content: (
        <input
          id="breed"
          name="breed"
          className="cardInput"
          value={formData.breed}
          onChange={handleChange}
          placeholder="Enter breed"
        />
      ),
    },
    {
      key: "sex",
      label: "Sex",
      content: (
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
      ),
    },
    {
      key: "heatStatus",
      label: "Heat Status",
      content: (
        <select
          id="heatStatus"
          name="heatStatus"
          className="cardInput"
          value={formData.heatStatus}
          onChange={handleChange}
        >
          {heatStatusOptions.map((option) => (
            <option key={option.value || "empty"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "dateOfBirth",
      label: "Date of Birth",
      content: (
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          className="cardInput"
          value={formData.dateOfBirth}
          onChange={handleChange}
        />
      ),
    },
    {
      key: "purchaseDate",
      label: "Purchase Date",
      content: (
        <input
          id="purchaseDate"
          name="purchaseDate"
          type="date"
          className="cardInput"
          value={formData.purchaseDate}
          onChange={handleChange}
        />
      ),
    },
    {
      key: "saleDate",
      label: "Sale Date",
      content: (
        <input
          id="saleDate"
          name="saleDate"
          type="date"
          className="cardInput"
          value={formData.saleDate}
          onChange={handleChange}
        />
      ),
    },
    {
      key: "purchasePrice",
      label: "Purchase Price",
      content: (
        <input
          id="purchasePrice"
          name="purchasePrice"
          type="number"
          className="cardInput"
          value={formData.purchasePrice}
          onChange={handleChange}
          placeholder="Enter purchase price"
        />
      ),
    },
    {
      key: "salePrice",
      label: "Sale Price",
      content: (
        <input
          id="salePrice"
          name="salePrice"
          type="number"
          className="cardInput"
          value={formData.salePrice}
          onChange={handleChange}
          placeholder="Enter sale price"
        />
      ),
    },
    {
      key: "hasCalf",
      label: "Has Calf",
      content: (
        <HasCalfToggle
          compact
          value={formData.hasCalf}
          onChange={(value) =>
            setFormData((current) => ({
              ...current,
              hasCalf: value,
            }))
          }
        />
      ),
    },
  ];

  return (
    <div className="cowDetailPage">
      {error && <div className="pageErrorBanner">{error}</div>}

      <div className="cowDetailShell">
        <form className="cowDashboardGrid" onSubmit={handleSubmit}>
          <div className="leftColumn">
            <CowHeroCard
              eyebrow="New Herd Record"
              title={
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
              }
              subtitle="Create a new herd record with ownership, lifecycle, and status details."
              action={
                <div className="heroActions">
                  <button
                    type="button"
                    className="addCowButton addCowButtonGhost"
                    onClick={() => navigate("/cows")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="addCowButton addCowButtonSuccess"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Cow"}
                  </button>
                </div>
              }
            >
              <div className="metricsGrid">
                <HealthStatusToggle
                  value={formData.healthStatus}
                  onChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      healthStatus: value,
                    }))
                  }
                />

                <div className="metricCard">
                  <label className="metricLabel" htmlFor="livestockGroup">
                    Livestock Group
                  </label>
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
                  <div />
                </div>

                <div className="metricCard">
                  <label className="metricLabel" htmlFor="pregnancyStatus">
                    Pregnancy Status
                  </label>
                  <select
                    id="pregnancyStatus"
                    name="pregnancyStatus"
                    className="metricFieldInput"
                    value={formData.pregnancyStatus}
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
                  <div />
                </div>
              </div>
            </CowHeroCard>

            <CowDetailsSection
              title="Cow Details"
              subtitle="Enter profile information"
              fields={detailFields}
            />

            <section className="dashboardCard activityCard">
              <div className="dataCardHeader">
                <h2 className="cardTitle">Form Tips</h2>
                <span className="cardSubtle">Before saving</span>
              </div>

              <div className="activityList">
                <div className="activityItem">
                  <div className="activityDot" />
                  <div>
                    <div className="activityText">
                      Tag number, owner, breed, sex, and health status should be
                      filled out.
                    </div>
                    <div className="activityMeta">Required fields</div>
                  </div>
                </div>

                <div className="activityItem">
                  <div className="activityDot" />
                  <div>
                    <div className="activityText">
                      Add notes for treatment history, breeding context, or any
                      special handling details.
                    </div>
                    <div className="activityMeta">Recommended</div>
                  </div>
                </div>

                <div className="activityItem">
                  <div className="activityDot" />
                  <div>
                    <div className="activityText">
                      Review the live summary on the right before saving the
                      record.
                    </div>
                    <div className="activityMeta">Quality check</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="rightColumn">
            <CowSummaryCard
              ownerName={formData.ownerName}
              subtitle="Live preview"
              purchasePrice={formatCurrencyPreview(formData.purchasePrice)}
              salePrice={formatCurrencyPreview(formData.salePrice)}
            />

            <section className="dashboardCard">
              <div className="dataCardHeader">
                <h2 className="cardTitle">Notes</h2>
                <span className="cardSubtle">Internal record</span>
              </div>

              <div className="notesPlaceholder">
                Notes are available after creating this cow.
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCowPage;
