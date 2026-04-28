import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HerdListView from "../../components/cows/HerdListView";
import Modal from "../../components/shared/Modal";
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
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    function handleHerdImported() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener("herd:imported", handleHerdImported);
    return () => window.removeEventListener("herd:imported", handleHerdImported);
  }, []);

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
  }, [refreshKey]);

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
    action: "markHealthy" | "markNeedsTreatment",
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

  async function handleConfirmRemove() {
    try {
      await bulkUpdateCows(selectedCowIds, "archive");
      setIsRemoveModalOpen(false);
      setIsSelecting(false);
      setSelectedCowIds([]);
      const data = await getCows();
      setCows(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove cows";
      setError(message);
      setIsRemoveModalOpen(false);
    }
  }

  const removeCount = selectedCowIds.length;
  const removeModalMessage =
    removeCount === 1
      ? "Are you sure you want to remove this cow from the herd? It will be moved to Archived Cows."
      : `Are you sure you want to remove ${removeCount} cows from the herd? They will be moved to Archived Cows.`;

  return (
    <>
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
        onBulkRemove={() => setIsRemoveModalOpen(true)}
      />

      <Modal
        isOpen={isRemoveModalOpen}
        title="Remove from Herd"
        message={removeModalMessage}
        confirmText="Remove from Herd"
        confirmVariant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setIsRemoveModalOpen(false)}
      />
    </>
  );
}

export default AllCowPage;
