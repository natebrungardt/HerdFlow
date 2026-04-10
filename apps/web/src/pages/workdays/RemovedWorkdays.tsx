import { useEffect, useState } from "react";
import WorkdayListView from "../../components/workdays/WorkdayListView";
import { getArchivedWorkdays } from "../../services/workdayService";
import type { Workday } from "../../types/workday";
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

function RemovedWorkdays() {
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadArchivedWorkdays() {
      try {
        setError("");
        const data = await getArchivedWorkdays();
        setWorkdays(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load workdays";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadArchivedWorkdays();
  }, []);

  return (
    <WorkdayListView
      workdays={workdays}
      loading={loading}
      error={error}
      title="Archived Workdays"
      subtitle="Review archived workdays and jump back into individual records."
      getWorkdayHref={(workday) => `/workdays/${workday.id}`}
      emptyMessage="No archived workdays found."
      showScheduledDateLabel={false}
      getWorkdaySupplementaryMeta={(workday) => {
        const formattedDate = formatRemovedDate(workday.removedAt);
        return formattedDate ? `Date Removed: ${formattedDate}` : null;
      }}
    />
  );
}

export default RemovedWorkdays;
