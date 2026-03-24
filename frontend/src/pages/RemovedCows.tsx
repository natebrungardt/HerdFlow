import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRemovedCows } from "../services/cowService";
import type { Cow } from "../types/cow";
import "../styles/allCows.css";

function RemovedCows() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {
    async function loadRemovedCows() {
      try {
        setError("");
        const data = await getRemovedCows();
        setCows(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load cows";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadRemovedCows();
  }, []);

  const filteredCows = cows.filter((cow) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedGroup = (cow.livestockGroup ?? "").trim().toLowerCase();
    const normalizedSelectedGroup = selectedGroup.trim().toLowerCase();

    const matchesSearch =
      cow.tagNumber.toLowerCase().includes(normalizedSearch) ||
      (cow.ownerName ?? "").toLowerCase().includes(normalizedSearch);

    let matchesGroup = false;

    if (normalizedSelectedGroup === "all") {
      matchesGroup = true;
    } else if (normalizedSelectedGroup === "needs treatment") {
      matchesGroup =
        (cow.healthStatus ?? "").trim().toLowerCase() !== "healthy";
    } else {
      matchesGroup = normalizedGroup === normalizedSelectedGroup;
    }

    return matchesSearch && matchesGroup;
  });

  const healthyCount = cows.filter(
    (cow) => cow.healthStatus === "Healthy",
  ).length;

  const breedingCount = cows.filter(
    (cow) => cow.livestockGroup === "Breeding",
  ).length;
  const feederCount = cows.filter(
    (cow) => cow.livestockGroup === "Feeder",
  ).length;
  const marketCount = cows.filter(
    (cow) => cow.livestockGroup === "Market",
  ).length;

  const needsAttentionCount = cows.filter(
    (cow) => cow.healthStatus !== "Healthy",
  ).length;

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">All Cows</h1>
              <p className="pageSubtitle">
                View, search, and manage herd records across your operation.
              </p>
            </div>

            <button
              className="addCowButton"
              onClick={() => navigate("/add-cow")}
            >
              + Add Cow
            </button>
          </div>

          <div className="toolbarCard">
            <input
              className="searchInput"
              type="text"
              placeholder="Search by tag number or owner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="filterRow">
              {["All", "Breeding", "Feeder", "Market", "Needs Treatment"].map(
                (group) => (
                  <button
                    key={group}
                    className={`filterChip ${selectedGroup === group ? "active" : ""}`.trim()}
                    onClick={() => setSelectedGroup(group)}
                  >
                    {group}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="statsGrid">
            <div className="statsCard">
              <div className="statLabel">Total Cows</div>
              <div className="statValue">{cows.length}</div>
            </div>

            <div className="statsCard">
              <div className="statLabel">Healthy</div>
              <div className="statValue">{healthyCount}</div>
            </div>

            <div className="statsCard">
              <div className="statLabel">Needs Treatment</div>
              <div className="statValue">{needsAttentionCount}</div>
            </div>

            <div className="statsCard">
              <div className="statLabel">Breeding</div>
              <div className="statValue">{breedingCount}</div>
            </div>

            <div className="statsCard">
              <div className="statLabel">Feeder</div>
              <div className="statValue">{feederCount}</div>
            </div>

            <div className="statsCard">
              <div className="statLabel">Market</div>
              <div className="statValue">{marketCount}</div>
            </div>
          </div>

          <div className="cowListCard">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Herd Records</h2>
              <span className="sectionSubtle">{filteredCows.length} shown</span>
            </div>

            {loading ? (
              <p className="emptyState">Loading cows...</p>
            ) : error ? (
              <p className="emptyState">{error}</p>
            ) : filteredCows.length === 0 ? (
              <p className="emptyState">No cows found.</p>
            ) : (
              filteredCows.map((cow) => {
                const healthStatus = (cow.healthStatus ?? "Unknown")
                  .replace(/([A-Z])/g, " $1")
                  .trim();
                const statusClassName =
                  cow.healthStatus === "Healthy"
                    ? "statusPill"
                    : "statusPill needsTreatment";

                return (
                  <div
                    key={cow.id}
                    className="cowRowCard"
                    onClick={() => navigate(`/cows/${cow.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate(`/cows/${cow.id}`);
                      }
                    }}
                  >
                    <div className="cowRowMain">
                      <div className="cowRowTitle">Tag #{cow.tagNumber}</div>
                      <div className="cowRowMeta">
                        {cow.livestockGroup || "Unassigned"} •{" "}
                        {cow.sex || "Unknown sex"} •{" "}
                        {cow.breedingStatus || "No breeding status"}
                      </div>
                      <div className="cowRowOwner">
                        Owner: {cow.ownerName || "Unknown owner"}
                      </div>
                    </div>

                    <div className="cowRowActions">
                      <div className={statusClassName}>{healthStatus}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RemovedCows;
