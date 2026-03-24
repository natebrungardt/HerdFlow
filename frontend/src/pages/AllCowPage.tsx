import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCows } from "../services/cowService";
import type { Cow } from "../types/cow";

function AllCowPage() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {
    async function loadCows() {
      try {
        setError("");
        const data = await getCows();
        setCows(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load cows";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCows();
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
    <div
      style={{
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>All Cows</h1>

        <button
          onClick={() => navigate("/add-cow")}
          style={{
            padding: "15px 25px",
            borderRadius: "8px",
            border: "none",
            background: "#5da475ff",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "1.25rem",
          }}
        >
          + Add Cow
        </button>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by tag number or owner name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            boxSizing: "border-box",
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "#151717",
            color: "white",
            marginBottom: "12px",
          }}
        />

        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          {["All", "Breeding", "Feeder", "Market", "Needs Treatment"].map(
            (group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                style={{
                  padding: "12px 20px",
                  borderRadius: "200px",
                  border:
                    selectedGroup === group
                      ? "1px solid #4c7a5b"
                      : "1px solid #444",
                  background:
                    selectedGroup === group ? "#4c7a5b" : "transparent",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {group}
              </button>
            ),
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              background: "#151717",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "1.4rem", color: "#9aa5b1" }}>
              Total Cows
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
              {cows.length}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              background: "#151717",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "1.4rem", color: "#9aa5b1" }}>Healthy</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
              {healthyCount}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              background: "#151717",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "1.4rem", color: "#9aa5b1" }}>
              Needs Treatment
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
              {needsAttentionCount}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              background: "#151717",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "1.4rem", color: "#9aa5b1" }}>Breeding</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
              {breedingCount}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              background: "#151717",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "1.4rem", color: "#9aa5b1" }}>Feeder</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
              {feederCount}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              background: "#151717",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "1.4rem", color: "#9aa5b1" }}>Market</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
              {marketCount}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading cows...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : filteredCows.length === 0 ? (
        <p>No cows found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredCows.map((cow) => (
            <div
              key={cow.id}
              onClick={() => navigate(`/cows/${cow.id}`)}
              style={{
                padding: "15px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold", fontSize: "1.75rem" }}>
                  Tag #{cow.tagNumber}
                </div>

                <div style={{ color: "#c5cdd5ff", fontSize: "1.2rem" }}>
                  {cow.livestockGroup} • {cow.sex} • {cow.breedingStatus}
                </div>

                <div style={{ marginTop: "4px", fontSize: "1.25rem" }}>
                  Owner: {cow.ownerName}
                </div>
              </div>

              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background:
                    cow.healthStatus === "Healthy" ? "#22c55e" : "#ef4444",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                {cow.healthStatus.replace(/([A-Z])/g, " $1").trim()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllCowPage;
