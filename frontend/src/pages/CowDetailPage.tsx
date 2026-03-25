import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteCow,
  getCowById,
  restoreCow,
  updateCow,
} from "../services/cowService";
import type { Cow } from "../types/cow";
import "../styles/CowDetailPage.css";
import Notes from "../components/Notes";

const editableFields = [
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

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
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

function getOwnerInitial(name: string | null | undefined) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
}

function CowDetailPage() {
  const { id } = useParams();
  const [cow, setCow] = useState<Cow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Cow | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    async function loadCow() {
      try {
        if (!id) return;
        const data = await getCowById(Number(id));
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

    loadCow();
  }, [id]);

  async function handleDelete() {
    if (!cow) return;

    const confirmed = window.confirm(
      `Delete cow with tag #${cow.tagNumber}? If removed, this cow's record will be moved to the removed cows archive.`,
    );

    if (!confirmed) return;

    try {
      await deleteCow(cow.id);
      navigate("/cows");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete cow";
      setError(message);
    }
  }
  async function handleRestore() {
    if (!cow) return;

    const confirmed = window.confirm(
      `Restore cow with tag #${cow.tagNumber}? This cow will be moved back to your active herd.`,
    );

    if (!confirmed) return;

    try {
      await restoreCow(cow.id);
      navigate("/removed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to restore cow";
      setError(message);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;

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
    if (!formData || !cow) return;

    const prev = cow; // store previous state

    try {
      const updated = await updateCow(cow.id, formData);
      setCow(updated);
      setFormData(updated);
    } catch (err) {
      let message = "Failed to update cow";
      const apiErr = err as any;
      // If backend returned 400 (duplicate tag)
      if (apiErr?.status === 400) {
        message = "Tag number already exists";
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);

      // 🔥 rollback
      setFormData(prev);
    }
  }

  if (loading) return <p>Loading cow...</p>;
  if (!cow) return <p>Cow not found</p>;

  return (
    <div className="cowDetailPage">
      {error && (
        <div
          style={{
            color: "#ff6b6b",
            background: "rgba(255, 0, 0, 0.08)",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "0.9rem",
            border: "1px solid rgba(255, 0, 0, 0.2)",
          }}
        >
          {error}
        </div>
      )}
      <div className="cowDetailShell">
        <div className="cowDashboardGrid">
          <div className="leftColumn">
            <section className="dashboardCard heroCard">
              <div className="eyebrow">Cow Overview</div>

              <div className="heroHeader">
                <div className="titleBlock">
                  <h1
                    className="cowTitle"
                    onDoubleClick={() => {
                      if (editingField !== "tagNumber")
                        setEditingField("tagNumber");
                    }}
                  >
                    {editingField === "tagNumber" ? (
                      <input
                        name="tagNumber"
                        value={formData?.tagNumber || ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }
                        }}
                        autoFocus
                        style={{
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "inherit",
                          font: "inherit",
                        }}
                      />
                    ) : (
                      <>{formatValue(formData?.tagNumber)}</>
                    )}
                  </h1>
                  <p className="cowSubtitle">
                    Detailed record for herd tracking, ownership, and lifecycle
                    data.
                  </p>
                </div>

                {cow.isRemoved ? (
                  <button className="restoreButton" onClick={handleRestore}>
                    Restore Cow
                  </button>
                ) : (
                  <button className="deleteButton" onClick={handleDelete}>
                    Remove Cow
                  </button>
                )}
              </div>

              <div className="metricsGrid">
                <div className="metricCard">
                  <div className="metricLabel">Health Status</div>
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      gap: "8px",
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData || !cow) return;
                        const next = {
                          ...formData,
                          healthStatus: "Healthy",
                        } as any;
                        setFormData(next);
                        const updated = await updateCow(cow.id, next);
                        setCow(updated);
                        setFormData(updated);
                      }}
                      style={{
                        height: "60px",
                        flex: 1,
                        padding: "8px 1px",
                        borderRadius: "12px",
                        border: "none",
                        minWidth: "100px",
                        background:
                          (formData?.healthStatus || cow.healthStatus) ===
                          "Healthy"
                            ? "linear-gradient(180deg, #4caf50 0%, #3d8b40 100%)"
                            : "rgba(255,255,255,0.12)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow:
                          (formData?.healthStatus || cow.healthStatus) ===
                          "Healthy"
                            ? "0 10px 25px rgba(76, 175, 80, 0.22)"
                            : "none",
                        transition:
                          "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
                      }}
                    >
                      Healthy
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData || !cow) return;
                        const next = {
                          ...formData,
                          healthStatus: "NeedsTreatment",
                        } as any;
                        setFormData(next);
                        const updated = await updateCow(cow.id, next);
                        setCow(updated);
                        setFormData(updated);
                      }}
                      style={{
                        height: "60px",
                        flex: 1,
                        padding: "8px 1px",
                        borderRadius: "12px",
                        border: "none",
                        minWidth: "100px",
                        background:
                          (formData?.healthStatus || cow.healthStatus) ===
                          "NeedsTreatment"
                            ? "linear-gradient(180deg, #c74652 0%, #9f2e39 100%)"
                            : "rgba(255,255,255,0.12)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow:
                          (formData?.healthStatus || cow.healthStatus) ===
                          "NeedsTreatment"
                            ? "0 10px 25px rgba(217, 76, 87, 0.22)"
                            : "none",
                        transition:
                          "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
                      }}
                    >
                      Needs Treatment
                    </button>
                  </div>
                  <div />
                </div>

                <div className="metricCard">
                  <div className="metricLabel">Livestock Group</div>
                  <div
                    className="metricValue"
                    onDoubleClick={() => {
                      if (editingField !== "livestockGroup")
                        setEditingField("livestockGroup");
                    }}
                  >
                    {editingField === "livestockGroup" ? (
                      <select
                        name="livestockGroup"
                        value={formData?.livestockGroup || ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        autoFocus
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "inherit",
                          font: "inherit",
                        }}
                      >
                        <option value="Breeding">Breeding</option>
                        <option value="Market">Market</option>
                        <option value="Feeder">Feeder</option>
                      </select>
                    ) : (
                      <span>{formatValue(formData?.livestockGroup)}</span>
                    )}
                  </div>
                  <div className="metricAccent" />
                </div>

                <div className="metricCard">
                  <div className="metricLabel">Breeding Status</div>
                  <div
                    className="metricValue"
                    onDoubleClick={() => {
                      if (editingField !== "breedingStatus")
                        setEditingField("breedingStatus");
                    }}
                  >
                    {editingField === "breedingStatus" ? (
                      <select
                        name="breedingStatus"
                        value={formData?.breedingStatus || ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        autoFocus
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "inherit",
                          font: "inherit",
                        }}
                      >
                        <option value="">Select</option>
                        <option value="Open">Open</option>
                        <option value="Bred">Bred</option>
                        <option value="Pregnant">Pregnant</option>
                        <option value="N/A">N/A</option>
                      </select>
                    ) : (
                      <span>{formatValue(formData?.breedingStatus)}</span>
                    )}
                  </div>
                  <div className="metricAccent" />
                </div>
              </div>
            </section>

            <section className="dashboardCard">
              <div className="dataCardHeader">
                <h2 className="cardTitle">Cow Details</h2>
                <span className="cardSubtle">Profile information</span>
              </div>

              <div className="infoGrid">
                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "ownerName") {
                      setEditingField("ownerName");
                    }
                  }}
                >
                  <div className="infoLabel">Owner</div>
                  <div className="infoValue">
                    {editingField === "ownerName" ? (
                      <input
                        name="ownerName"
                        value={formData?.ownerName || ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }

                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                        autoFocus
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "inherit",
                          font: "inherit",
                        }}
                      />
                    ) : (
                      <span>{formatValue(formData?.ownerName)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "breed") setEditingField("breed");
                  }}
                >
                  <div className="infoLabel">Breed</div>
                  <div className="infoValue">
                    {editingField === "breed" ? (
                      <input
                        name="breed"
                        value={formData?.breed || ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }

                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                        autoFocus
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "inherit",
                          font: "inherit",
                        }}
                      />
                    ) : (
                      <span>{formatValue(formData?.breed)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "sex") setEditingField("sex");
                  }}
                >
                  <div className="infoLabel">Sex</div>
                  <div className="infoValue">
                    {editingField === "sex" ? (
                      <select
                        name="sex"
                        value={formData?.sex || ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "inherit",
                          font: "inherit",
                        }}
                        autoFocus
                      >
                        <option value="">Select</option>
                        <option value="Cow">Cow</option>
                        <option value="Bull">Bull</option>
                        <option value="Heifer">Heifer</option>
                        <option value="Steer">Steer</option>
                      </select>
                    ) : (
                      <span>{formatValue(formData?.sex)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "heatStatus")
                      setEditingField("heatStatus");
                  }}
                >
                  <div className="infoLabel">Heat Status</div>
                  <div className="infoValue">
                    {editingField === "heatStatus" ? (
                      <select
                        name="heatStatus"
                        value={formData?.heatStatus || ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                        autoFocus
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "inherit",
                          font: "inherit",
                        }}
                      >
                        <option value="">Select</option>
                        <option value="WatchHeat">Watch Heat</option>
                        <option value="InHeat">In Heat</option>
                        <option value="NotInHeat">Not in Heat</option>
                      </select>
                    ) : (
                      <span>{formatValue(formData?.heatStatus)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "dateOfBirth")
                      setEditingField("dateOfBirth");
                  }}
                >
                  <div className="infoLabel">Date of Birth</div>
                  <div className="infoValue">
                    {editingField === "dateOfBirth" ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={
                          (formData?.dateOfBirth || "")
                            .toString()
                            .split("T")[0] || ""
                        }
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }

                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                      />
                    ) : (
                      <span>{formatValue(formData?.dateOfBirth)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "purchaseDate")
                      setEditingField("purchaseDate");
                  }}
                >
                  <div className="infoLabel">Purchase Date</div>
                  <div className="infoValue">
                    {editingField === "purchaseDate" ? (
                      <input
                        type="date"
                        name="purchaseDate"
                        value={
                          (formData?.purchaseDate || "")
                            .toString()
                            .split("T")[0] || ""
                        }
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }

                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                      />
                    ) : (
                      <span>{formatValue(formData?.purchaseDate)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "saleDate")
                      setEditingField("saleDate");
                  }}
                >
                  <div className="infoLabel">Sale Date</div>
                  <div className="infoValue">
                    {editingField === "saleDate" ? (
                      <input
                        type="date"
                        name="saleDate"
                        value={
                          (formData?.saleDate || "").toString().split("T")[0] ||
                          ""
                        }
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }

                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                      />
                    ) : (
                      <span>{formatValue(formData?.saleDate)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "purchasePrice")
                      setEditingField("purchasePrice");
                  }}
                >
                  <div className="infoLabel">Purchase Price</div>
                  <div className="infoValue">
                    {editingField === "purchasePrice" ? (
                      <input
                        type="number"
                        name="purchasePrice"
                        value={formData?.purchasePrice ?? ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }

                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span>{formatCurrency(formData?.purchasePrice)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="infoTile"
                  onDoubleClick={() => {
                    if (editingField !== "salePrice")
                      setEditingField("salePrice");
                  }}
                >
                  <div className="infoLabel">Sale Price</div>
                  <div className="infoValue">
                    {editingField === "salePrice" ? (
                      <input
                        type="number"
                        name="salePrice"
                        value={formData?.salePrice ?? ""}
                        onChange={handleChange}
                        onBlur={async () => {
                          setEditingField(null);
                          await saveCowUpdates();
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setEditingField(null);
                            await saveCowUpdates();
                          }

                          if (e.key === "Tab") {
                            e.preventDefault();
                            const currentIndex = editableFields.indexOf(
                              editingField!,
                            );
                            const nextField = editableFields[currentIndex + 1];
                            setEditingField(nextField || null);
                            await saveCowUpdates();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span>{formatCurrency(formData?.salePrice)}</span>
                    )}
                  </div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Record ID</div>
                  <div className="infoValue">#{cow.id}</div>
                </div>
              </div>
            </section>
          </div>

          <div className="rightColumn">
            <section className="dashboardCard rightSummaryCard">
              <div className="dataCardHeader">
                <h2 className="cardTitle">Profile Summary</h2>
                <span className="cardSubtle">At a glance</span>
              </div>

              <div className="ownerRow">
                <div className="ownerAvatar">
                  {getOwnerInitial(cow.ownerName)}
                </div>
                <div className="ownerMeta">
                  <div className="ownerName">{formatValue(cow.ownerName)}</div>
                  <div className="ownerRole">Primary owner</div>
                </div>
              </div>

              <div className="kpiStack">
                <div className="kpiRow">
                  <span className="kpiLabel">Purchase Price</span>
                  <span className="kpiValue">
                    {formatCurrency(cow.purchasePrice)}
                  </span>
                </div>

                <div className="kpiRow">
                  <span className="kpiLabel">Sale Price</span>
                  <span className="kpiValue">
                    {formatCurrency(cow.salePrice)}
                  </span>
                </div>
              </div>
            </section>
            <Notes cowId={cow.id} />
          </div>
        </div>
        <div className="fullWidthRow" style={{ marginTop: "20px" }}>
          <section className="dashboardCard activityCard">
            <div className="dataCardHeader" style={{ marginTop: "10px" }}>
              <h2 className="cardTitle">Activity Log</h2>
              <span className="cardSubtle">Recent timeline</span>
            </div>

            <div className="activityList">
              <div className="activityItem">
                <div className="activityDot" />
                <div>
                  <div className="activityText">
                    Cow record created in HerdFlow.
                  </div>
                  <div className="activityMeta">System event</div>
                </div>
              </div>

              <div className="activityItem">
                <div className="activityDot" />
                <div>
                  <div className="activityText">
                    Health status saved as {formatLabel(cow.healthStatus)}.
                  </div>
                  <div className="activityMeta">Current profile value</div>
                </div>
              </div>

              <div className="activityItem">
                <div className="activityDot" />
                <div>
                  <div className="activityText">
                    Livestock group assigned to{" "}
                    {formatValue(cow.livestockGroup)}.
                  </div>
                  <div className="activityMeta">
                    Current herd classification
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CowDetailPage;
