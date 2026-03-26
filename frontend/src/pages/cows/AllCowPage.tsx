import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HerdListView from "../../components/cows/HerdListView";
import { getCows } from "../../services/cowService";
import type { Cow } from "../../types/cow";
import "../../styles/AllCows.css";

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
    <HerdListView
      cows={cows}
      loading={loading}
      error={error}
      title="All Cows"
      subtitle="View, search, and manage herd records across your operation."
      ctaLabel="+ Add Cow"
      onCtaClick={() => navigate("/add-cow")}
      getCowHref={(cow) => `/cows/${cow.id}`}
    />
  );
}

export default AllCowPage;
