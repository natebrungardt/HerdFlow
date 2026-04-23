import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/shared/Modal";
import { deleteWorkday, getWorkdayById } from "../../services/workdayService";
import type { Workday } from "../../types/workday";
import { preserveWorkdayGridOrder } from "../../utils/workdayGridOrder";
import "../../styles/AllCows.css";
import "../../styles/CowDetailPage.css";

function formatDateLabel(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

function CompletedWorkdayDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workday, setWorkday] = useState<Workday | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadWorkday() {
      if (!id) {
        setError("Completed workday ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setError("");
        const data = await getWorkdayById(id);
        setWorkday(preserveWorkdayGridOrder(data));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load workday";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadWorkday();
  }, [id]);

  const actions = useMemo(() => workday?.actions ?? [], [workday?.actions]);
  const assignments = useMemo(
    () => workday?.workdayCows ?? [],
    [workday?.workdayCows],
  );
  const completedActionsByCowId = useMemo(() => {
    const actionLookup = new Map(actions.map((action) => [action.id, action]));
    const nextMap = new Map<string, typeof actions>();

    for (const entry of workday?.entries ?? []) {
      if (!entry.isCompleted) {
        continue;
      }

      const action = actionLookup.get(entry.actionId);

      if (!action) {
        continue;
      }

      const current = nextMap.get(entry.cowId) ?? [];

      if (!current.some((item) => item.id === action.id)) {
        current.push(action);
        nextMap.set(entry.cowId, current);
      }
    }

    return nextMap;
  }, [actions, workday?.entries]);

  async function handleDelete() {
    if (!workday) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      await deleteWorkday(workday.id);
      navigate("/workdays/completed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete workday";
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="allCowsPage">
        <div className="allCowsShell">
          <div className="allCowsContent">
            <div className="active-workday-state">Loading completed workday...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workday) {
    return (
      <div className="allCowsPage">
        <div className="allCowsShell">
          <div className="allCowsContent">
            <div className="pageErrorBanner">{error || "Completed workday not found."}</div>
            <Link className="btn btn-outline" to="/workdays/completed">
              Back to Completed Workdays
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="allCowsPage">
      {error ? <div className="pageErrorBanner">{error}</div> : null}
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="cow-header">
            <Link className="btn btn-outline" to="/workdays/completed">
              ← Back to Completed Workdays
            </Link>
          </div>

          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">{workday.title}</h1>
              <p className="pageSubtitle">
                {formatDateLabel(workday.date)} • {assignments.length} cows worked
                {" • "}
                {actions.length} actions performed
              </p>
            </div>

            <div className="workdayHeaderActions workday-actions">
              <div className="statusPill workdayStatusPill completed">
                Completed
              </div>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={() => setShowDeleteModal(true)}
              >
                {deleting ? "Deleting..." : "Delete Workday"}
              </button>
            </div>
          </div>

          <div className="cowListCard" style={{ marginBottom: 16 }}>
            <div className="sectionHeader">
              <h2 className="sectionTitle">Actions Performed</h2>
              <span className="sectionSubtle">{actions.length} recorded</span>
            </div>

            {actions.length === 0 ? (
              <p className="emptyState">No actions were recorded for this workday.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {actions.map((action) => (
                  <div key={action.id} className="statusPill">
                    {action.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cowListCard" style={{ marginBottom: 16 }}>
            <div className="sectionHeader">
              <h2 className="sectionTitle">Notes</h2>
              <span className="sectionSubtle">Read-only</span>
            </div>

            <p className="emptyState" style={{ textAlign: "left" }}>
              {workday.summary?.trim() || "No notes were saved for this workday."}
            </p>
          </div>

          <div className="cowListCard">
            <div className="sectionHeader">
              <h2 className="sectionTitle">Cows Worked</h2>
              <span className="sectionSubtle">{assignments.length} assigned</span>
            </div>

            {assignments.length === 0 ? (
              <p className="emptyState">No cows were assigned to this workday.</p>
            ) : (
              assignments.map((assignment) => {
                const completedActions =
                  completedActionsByCowId.get(assignment.cowId) ?? [];
                const hasAllActions =
                  actions.length > 0 && completedActions.length === actions.length;

                return (
                  <div key={assignment.id} className="cowRowCard workdayRowCard">
                    <div className="cowRowMain">
                      <div className="cowRowTitle">Tag #{assignment.cow.tagNumber}</div>
                      <div className="cowRowMeta">
                        {formatLabel(assignment.cow.livestockGroup) || "No group"} •{" "}
                        {formatLabel(assignment.cow.healthStatus) || "Unknown health"}
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {completedActions.length === 0 ? (
                          <div
                            className="cowRowOwner"
                            style={{ fontSize: "0.9rem", opacity: 0.75 }}
                          >
                            No actions
                          </div>
                        ) : (
                          <>
                            {hasAllActions ? (
                              <div
                                className="cowRowOwner"
                                style={{ color: "var(--color-primary)" }}
                              >
                                All actions applied
                              </div>
                            ) : null}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                rowGap: 4,
                              }}
                            >
                              {completedActions.map((action) => (
                                <div key={action.id} className="statusPill">
                                  {action.name}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        title="Delete Workday"
        message={`Are you sure you want to delete this completed workday?\n\nThis action cannot be undone.`}
        confirmText="Delete Workday"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          await handleDelete();
        }}
      />
    </div>
  );
}

export default CompletedWorkdayDetailsPage;
