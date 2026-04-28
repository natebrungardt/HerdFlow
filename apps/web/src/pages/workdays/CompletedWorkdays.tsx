import { useEffect, useState } from "react";
import WorkdayListView from "../../components/workdays/WorkdayListView";
import Modal from "../../components/shared/Modal";
import {
  bulkDeleteWorkdays,
  bulkDuplicateWorkdays,
  getCompletedWorkdays,
} from "../../services/workdayService";
import type { Workday } from "../../types/workday";
import "../../styles/AllCows.css";

function formatCompletedDate(dateValue: string) {
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

function CompletedWorkdays() {
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedWorkdayIds, setSelectedWorkdayIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function loadCompletedWorkdays() {
      try {
        setError("");
        const data = await getCompletedWorkdays();
        setWorkdays(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load workdays";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadCompletedWorkdays();
  }, []);

  async function refreshWorkdays() {
    const data = await getCompletedWorkdays();
    setWorkdays(data);
  }

  function handleToggleSelect(id: string) {
    setSelectedWorkdayIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
    );
  }

  function handleSelectAll() {
    if (selectedWorkdayIds.length === workdays.length) {
      setSelectedWorkdayIds([]);
    } else {
      setSelectedWorkdayIds(workdays.map((w) => w.id));
    }
  }

  function handleCancelSelect() {
    setIsSelecting(false);
    setSelectedWorkdayIds([]);
  }

  async function handleBulkDuplicate() {
    try {
      await bulkDuplicateWorkdays(selectedWorkdayIds);
      setIsSelecting(false);
      setSelectedWorkdayIds([]);
      await refreshWorkdays();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to duplicate workdays";
      setError(message);
    }
  }

  async function handleConfirmDelete() {
    try {
      await bulkDeleteWorkdays(selectedWorkdayIds);
      setIsDeleteModalOpen(false);
      setIsSelecting(false);
      setSelectedWorkdayIds([]);
      await refreshWorkdays();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete workdays";
      setError(message);
      setIsDeleteModalOpen(false);
    }
  }

  const deleteCount = selectedWorkdayIds.length;
  const deleteModalTitle =
    deleteCount === 1 ? "Delete Workday" : "Delete Workdays";
  const deleteModalMessage =
    `Are you sure you want to delete ${deleteCount === 1 ? "this workday" : `these ${deleteCount} workdays`}? ` +
    "All assigned cows and actions will be permanently removed. This cannot be undone.";

  return (
    <>
      <WorkdayListView
        workdays={workdays}
        loading={loading}
        error={error}
        title="Completed Workdays"
        subtitle="Review completed workdays and revisit the plans your crew finished."
        getWorkdayHref={(workday) => `/completed-workdays/${workday.id}`}
        emptyMessage="No completed workdays found."
        showScheduledDateLabel={false}
        getWorkdaySupplementaryMeta={(workday) => {
          const formattedDate = formatCompletedDate(workday.date);
          return formattedDate ? `Completed For: ${formattedDate}` : null;
        }}
        isSelecting={isSelecting}
        selectedWorkdayIds={selectedWorkdayIds}
        onEnterSelect={() => setIsSelecting(true)}
        onCancelSelect={handleCancelSelect}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkDuplicate={handleBulkDuplicate}
        onBulkDelete={() => setIsDeleteModalOpen(true)}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        title={deleteModalTitle}
        message={deleteModalMessage}
        confirmText={deleteCount === 1 ? "Delete Workday" : "Delete Workdays"}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}

export default CompletedWorkdays;
