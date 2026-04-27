import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkday } from "../../services/workdayService";
import "../../styles/AllCows.css";

const DEFAULT_WORKDAY_TITLE = "";

function AddWorkdayPage() {
  const navigate = useNavigate();
  const hasStartedCreating = useRef(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(true);
  const [createAttempt, setCreateAttempt] = useState(0);

  useEffect(() => {
    if (hasStartedCreating.current) {
      return;
    }

    hasStartedCreating.current = true;

    async function createDraftWorkday() {
      try {
        setError("");
        setCreating(true);

        const createdWorkday = await createWorkday({
          title: DEFAULT_WORKDAY_TITLE,
          date: null,
          summary: null,
        });

        navigate(`/workdays/${createdWorkday.id}`, { replace: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create workday";
        setError(message);
        setCreating(false);
        hasStartedCreating.current = false;
      }
    }

    void createDraftWorkday();
  }, [createAttempt, navigate]);

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Add Workday</h1>
              <p className="pageSubtitle">
                Creating a new draft workday and opening the full Workday
                Details view.
              </p>
            </div>
          </div>

          <div className="card workdayComposerCard">
            {error ? <div className="pageErrorBanner">{error}</div> : null}

            <div className="workdayCreateLayout">
              <p className="emptyState">
                {creating ? "Creating workday..." : "Unable to create workday."}
              </p>

              {!creating ? (
                <div className="workdayComposerActions">
                  <button
                    type="button"
                    className="workdaySecondaryButton"
                    onClick={() => navigate("/workdays")}
                  >
                    Back to Workdays
                  </button>
                  <button
                    type="button"
                    className="addCowButton"
                    onClick={() => {
                      setCreateAttempt((current) => current + 1);
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddWorkdayPage;
