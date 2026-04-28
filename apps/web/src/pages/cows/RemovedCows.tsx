import { useEffect, useState } from "react";
import HerdListView from "../../components/cows/HerdListView";
import Modal from "../../components/shared/Modal";
import {
  bulkDeleteCows,
  bulkRestoreCows,
  getRemovedCows,
} from "../../services/cowService";
import type { Cow } from "../../types/cow";
import "../../styles/AllCows.css";

function formatRemovedDate(dateValue: string | null | undefined) {
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

function sortRemovedCowsByDate(cows: Cow[]) {
  return [...cows].sort((leftCow, rightCow) => {
    const leftRemovedAt = leftCow.removedAt
      ? new Date(leftCow.removedAt).getTime()
      : null;
    const rightRemovedAt = rightCow.removedAt
      ? new Date(rightCow.removedAt).getTime()
      : null;

    if (leftRemovedAt === null && rightRemovedAt !== null) {
      return 1;
    }

    if (leftRemovedAt !== null && rightRemovedAt === null) {
      return -1;
    }

    if (
      leftRemovedAt !== null &&
      rightRemovedAt !== null &&
      leftRemovedAt !== rightRemovedAt
    ) {
      return rightRemovedAt - leftRemovedAt;
    }

    return leftCow.tagNumber.localeCompare(rightCow.tagNumber, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

function RemovedCows() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCowIds, setSelectedCowIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  async function refreshCows() {
    const data = await getRemovedCows();
    setCows(data);
  }

  function handleToggleSelect(id: string) {
    setSelectedCowIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
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

  async function handleBulkRestore() {
    try {
      await bulkRestoreCows(selectedCowIds);
      setIsSelecting(false);
      setSelectedCowIds([]);
      await refreshCows();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to restore cows";
      setError(message);
    }
  }

  async function handleConfirmDelete() {
    try {
      await bulkDeleteCows(selectedCowIds);
      setIsDeleteModalOpen(false);
      setIsSelecting(false);
      setSelectedCowIds([]);
      await refreshCows();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete cows";
      setError(message);
      setIsDeleteModalOpen(false);
    }
  }

  const deleteCount = selectedCowIds.length;
  const deleteModalTitle = deleteCount === 1 ? "Delete Cow" : "Delete Cows";
  const deleteModalMessage =
    `Are you sure you want to permanently delete ${deleteCount === 1 ? "this cow" : `these ${deleteCount} cows`}? ` +
    "All records will be permanently removed. This cannot be undone.";

  return (
    <>
      <HerdListView
        cows={cows}
        loading={loading}
        error={error}
        title="Archived Cows"
        subtitle="Review archived herd records and jump back into individual histories."
        getCowHref={(cow) => `/cows/${cow.id}`}
        emptyMessage="No archived cows found."
        sortCows={sortRemovedCowsByDate}
        getCowSupplementaryMeta={(cow) => {
          const formattedDate = formatRemovedDate(cow.removedAt);
          return formattedDate ? `Date Removed: ${formattedDate}` : null;
        }}
        isSelecting={isSelecting}
        selectedCowIds={selectedCowIds}
        onEnterSelect={() => setIsSelecting(true)}
        onCancelSelect={handleCancelSelect}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkRestore={handleBulkRestore}
        onBulkDelete={() => setIsDeleteModalOpen(true)}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        title={deleteModalTitle}
        message={deleteModalMessage}
        confirmText={deleteCount === 1 ? "Delete Cow" : "Delete Cows"}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}

export default RemovedCows;
