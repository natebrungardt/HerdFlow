import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HerdListView from "../../components/cows/HerdListView";
import { getRemovedCows } from "../../services/cowService";
import type { Cow } from "../../types/cow";
import "../../styles/AllCows.css";

function RemovedCows() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  return (
    <HerdListView
      cows={cows}
      loading={loading}
      error={error}
      title="Removed Cows"
      subtitle="Review archived herd records and jump back into individual histories."
      ctaLabel="+ Add Cow"
      onCtaClick={() => navigate("/add-cow")}
      getCowHref={(cow) => `/cows/${cow.id}`}
      emptyMessage="No removed cows found."
    />
  );
}

export default RemovedCows;
