import { useEffect, useState } from "react";
import WorkdayListView from "../../components/workdays/WorkdayListView";
import { getCompletedWorkdays } from "../../services/workdayService";
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

  return (
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
    />
  );
}

export default CompletedWorkdays;
