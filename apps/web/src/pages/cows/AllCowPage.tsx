import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HerdListView from "../../components/cows/HerdListView";
import { bulkUpdateCows, getCows } from "../../services/cowService";
import type { Cow } from "../../types/cow";
import "../../styles/AllCows.css";

function formatCreatedDate(dateValue: string | null | undefined) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function AllCowPage() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCowIds, setSelectedCowIds] = useState<string[]>([]);
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

  function handleToggleSelect(cowId: string) {
    setSelectedCowIds((prev) =>
      prev.includes(cowId) ? prev.filter((id) => id !== cowId) : [...prev, cowId],
    );
  }

  function handleSelectAll() {
    if (selectedCowIds.length === cows.length) {
      setSelectedCowIds([]);
    } else {
      setSelectedCowIds(cows.map((c) => c.id));
    }
  }

  function handleCancelSelect() {
    setIsSelecting(false);
    setSelectedCowIds([]);
  }

  async function handleBulkAction(
    action: "markHealthy" | "markNeedsTreatment" | "archive",
  ) {
    try {
      await bulkUpdateCows(selectedCowIds, action);
      setIsSelecting(false);
      setSelectedCowIds([]);
      const data = await getCows();
      setCows(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk action failed";
      setError(message);
    }
  }

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
      getCowSupplementaryMeta={(cow) => {
        const formattedDate = formatCreatedDate(cow.createdAt);
        return formattedDate ? `Date Added: ${formattedDate}` : null;
      }}
      isSelecting={isSelecting}
      selectedCowIds={selectedCowIds}
      onEnterSelect={() => setIsSelecting(true)}
      onCancelSelect={handleCancelSelect}
      onToggleSelect={handleToggleSelect}
      onSelectAll={handleSelectAll}
      onBulkAction={handleBulkAction}
    />
  );
}

export default AllCowPage;
