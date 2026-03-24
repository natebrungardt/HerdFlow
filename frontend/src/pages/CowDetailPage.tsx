import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteCow, getCowById, restoreCow } from "../services/cowService";
import type { Cow } from "../types/cow";
import "../styles/CowDetailPage.css";

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

  useEffect(() => {
    async function loadCow() {
      try {
        if (!id) return;
        const data = await getCowById(Number(id));
        setCow(data);
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
      `Delete cow with tag #${cow.tagNumber}? If removed, this cow's record will be moved to the removed cows archive.'`,
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
      navigate("/removed"); // 👈 better UX (go back to active herd)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to restore cow";
      setError(message);
    }
  }

  if (loading) return <p>Loading cow...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!cow) return <p>Cow not found</p>;

  return (
    <div className="cowDetailPage">
      <div className="cowDetailShell">
        <div className="cowDashboardGrid">
          <div className="leftColumn">
            <section className="dashboardCard heroCard">
              <div className="eyebrow">Cow Overview</div>

              <div className="heroHeader">
                <div className="titleBlock">
                  <h1 className="cowTitle">
                    Tag #{formatValue(cow.tagNumber)}
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
                  <div className="metricValue">
                    {formatLabel(cow.healthStatus)}
                  </div>
                  <div className="metricAccent" />
                </div>

                <div className="metricCard">
                  <div className="metricLabel">Livestock Group</div>
                  <div className="metricValue">
                    {formatValue(cow.livestockGroup)}
                  </div>
                  <div className="metricAccent" />
                </div>

                <div className="metricCard">
                  <div className="metricLabel">Breeding Status</div>
                  <div className="metricValue">
                    {formatValue(cow.breedingStatus)}
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
                <div className="infoTile">
                  <div className="infoLabel">Owner</div>
                  <div className="infoValue">{formatValue(cow.ownerName)}</div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Breed</div>
                  <div className="infoValue">{formatValue(cow.breed)}</div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Sex</div>
                  <div className="infoValue">{formatValue(cow.sex)}</div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Heat Status</div>
                  <div className="infoValue">{formatValue(cow.heatStatus)}</div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Date of Birth</div>
                  <div className="infoValue">
                    {formatValue(cow.dateOfBirth)}
                  </div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Purchase Date</div>
                  <div className="infoValue">
                    {formatValue(cow.purchaseDate)}
                  </div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Sale Date</div>
                  <div className="infoValue">{formatValue(cow.saleDate)}</div>
                </div>

                <div className="infoTile">
                  <div className="infoLabel">Record ID</div>
                  <div className="infoValue">#{cow.id}</div>
                </div>
              </div>
            </section>

            <section className="dashboardCard activityCard">
              <div className="dataCardHeader">
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

                <div className="kpiRow">
                  <span className="kpiLabel">Status</span>
                  <span className="kpiValue">
                    {formatValue(cow.breedingStatus)}
                  </span>
                </div>

                <div className="kpiRow">
                  <span className="kpiLabel">Tag Number</span>
                  <span className="kpiValue">
                    #{formatValue(cow.tagNumber)}
                  </span>
                </div>
              </div>
            </section>

            <section className="dashboardCard">
              <div className="dataCardHeader">
                <h2 className="cardTitle">Notes</h2>
                <span className="cardSubtle">Internal record</span>
              </div>

              <div className="notesBody">
                {cow.notes ? (
                  cow.notes
                ) : (
                  <span className="emptyState">
                    No notes have been added yet.
                  </span>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CowDetailPage;
