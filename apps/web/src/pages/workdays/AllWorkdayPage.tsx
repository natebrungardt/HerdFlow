import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkdayListView from "../../components/workdays/WorkdayListView";
import Modal from "../../components/shared/Modal";
import {
  bulkCompleteWorkdays,
  bulkDeleteWorkdays,
  getActiveWorkdays,
} from "../../services/workdayService";
import type { Workday } from "../../types/workday";
import "../../styles/AllCows.css";

function AllWorkdayPage() {
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedWorkdayIds, setSelectedWorkdayIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadWorkdays() {
      try {
        setError("");
        const data = await getActiveWorkdays();
        setWorkdays(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load workdays";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadWorkdays();
  }, []);

  async function refreshWorkdays() {
    const data = await getActiveWorkdays();
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

  async function handleBulkComplete() {
    try {
      await bulkCompleteWorkdays(selectedWorkdayIds);
      setIsSelecting(false);
      setSelectedWorkdayIds([]);
      await refreshWorkdays();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete workdays";
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
      const message = err instanceof Error ? err.message : "Failed to delete workdays";
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
        title="All Workdays"
        subtitle="View scheduled workdays across your operation and quickly search upcoming plans."
        ctaLabel="+ Add Workday"
        onCtaClick={() => navigate("/workdays/new")}
        getWorkdayHref={(workday) => `/workdays/${workday.id}`}
        isSelecting={isSelecting}
        selectedWorkdayIds={selectedWorkdayIds}
        onEnterSelect={() => setIsSelecting(true)}
        onCancelSelect={handleCancelSelect}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkComplete={handleBulkComplete}
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

export default AllWorkdayPage;
