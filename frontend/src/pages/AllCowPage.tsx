import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCows } from "../services/cowService";
import type { Cow } from "../types/cow";

function AllCowPage() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>All Cows</h1>

      {loading ? (
        <p>Loading cows...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : cows.length === 0 ? (
        <p>No cows found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {cows.map((cow) => (
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
                <strong>Tag:</strong> {cow.tagNumber}
                <br />
                <strong>Owner:</strong> {cow.ownerName}
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
                {cow.healthStatus}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllCowPage;
