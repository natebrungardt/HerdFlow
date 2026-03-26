import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkdayListView from "../../components/workdays/WorkdayListView";
import { getActiveWorkdays } from "../../services/workdayService";
import type { Workday } from "../../types/workday";
import "../../styles/AllCows.css";

function AllWorkdayPage() {
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  return (
    <WorkdayListView
      workdays={workdays}
      loading={loading}
      error={error}
      title="All Workdays"
      subtitle="View scheduled workdays across your operation and quickly search upcoming plans."
      ctaLabel="+ Add Workday"
      onCtaClick={() => navigate("/workdays/new")}
      getWorkdayHref={(workday) => `/workdays/${workday.id}`}
    />
  );
}

export default AllWorkdayPage;
