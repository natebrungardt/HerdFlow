import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completeWorkday } from "../../services/workdayService";
import "../../styles/AllCows.css";

function ActiveWorkdayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  async function handleCompleteWorkday() {
    if (!id) {
      return;
    }

    setCompleting(true);
    setError("");

    try {
      await completeWorkday(id);
      navigate("/workdays/completed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete workday";
      setError(message);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          {error ? <div className="pageErrorBanner">{error}</div> : null}

          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Active Workday</h1>
              <p className="pageSubtitle">
                The live workday grid is the next step. This setup handoff route
                is ready and linked for workday launch.
              </p>
            </div>
            <div className="workdayHeaderActions">
              <button
                type="button"
                className="addCowButton"
                disabled={completing}
                onClick={() => void handleCompleteWorkday()}
              >
                {completing ? "Completing..." : "Complete Workday"}
              </button>
              <Link className="btn btn-outline" to={`/workdays/${id}`}>
                Back to Setup
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActiveWorkdayPage;
