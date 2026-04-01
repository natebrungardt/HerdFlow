import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCows, getRemovedCows } from "../services/cowService";
import {
  getActiveWorkdays,
  getArchivedWorkdays,
} from "../services/workdayService";
import type { Cow } from "../types/cow";
import type { Workday } from "../types/workday";
import "../styles/AllCows.css";
import "../styles/CowDetailPage.css";

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

function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function Dashboard() {
  const [cows, setCows] = useState<Cow[]>([]);
  const [archivedCows, setArchivedCows] = useState<Cow[]>([]);
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [archivedWorkdays, setArchivedWorkdays] = useState<Workday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");
        const [activeCows, removedCows, activeWorkdays, removedWorkdays] =
          await Promise.all([
            getCows(),
            getRemovedCows(),
            getActiveWorkdays(),
            getArchivedWorkdays(),
          ]);

        setCows(activeCows);
        setArchivedCows(removedCows);
        setWorkdays(activeWorkdays);
        setArchivedWorkdays(removedWorkdays);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Needs Treatment",
        value: cows.filter((cow) => cow.healthStatus !== "Healthy").length,
        to: "/cows?filter=Needs%20Treatment",
      },
      { label: "Active Herd", value: cows.length, to: "/cows" },
      {
        label: "Calf Counter",
        value: cows.filter((cow) => cow.hasCalf).length,
        to: "/cows",
      },
      {
        label: "Breeding",
        value: cows.filter((cow) => cow.livestockGroup === "Breeding").length,
        to: "/cows?filter=Breeding",
      },
      { label: "Active Workdays", value: workdays.length, to: "/workdays" },
      { label: "Archived Cows", value: archivedCows.length, to: "/removed" },
    ],
    [archivedCows.length, cows, workdays.length],
  );

  const upcomingWorkdays = useMemo(() => {
    return [...workdays].sort((leftWorkday, rightWorkday) => {
      return (
        new Date(leftWorkday.date).getTime() -
        new Date(rightWorkday.date).getTime()
      );
    });
  }, [workdays]);

  const attentionCows = useMemo(() => {
    return cows.filter((cow) => cow.healthStatus !== "Healthy");
  }, [cows]);

  const recentArchivedWorkdays = useMemo(() => {
    return [...archivedWorkdays].sort((leftWorkday, rightWorkday) => {
      return (
        new Date(rightWorkday.date).getTime() -
        new Date(leftWorkday.date).getTime()
      );
    });
  }, [archivedWorkdays]);

  const recentArchivedCows = useMemo(() => {
    return [...archivedCows].sort((leftCow, rightCow) => {
      return leftCow.tagNumber.localeCompare(rightCow.tagNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [archivedCows]);

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Herd Summary</h1>
              <p className="pageSubtitle">
                Get a quick view of herd health, workday activity, and the
                records that need attention.
              </p>
            </div>
          </div>

          {error ? <div className="pageErrorBanner">{error}</div> : null}

          {loading ? (
            <div className="dashboardCard">
              <p className="emptyState">Loading dashboard...</p>
            </div>
          ) : (
            <>
              <div className="statsGrid">
                {dashboardStats.map((stat) => (
                  <Link
                    key={stat.label}
                    className="statsCard statsLinkCard"
                    to={stat.to}
                  >
                    <div className="statLabel">{stat.label}</div>
                    <div className="statValue">{stat.value}</div>
                  </Link>
                ))}
              </div>

              <div className="dashboardQuickActions">
                <Link className="addCowButton" to="/cows">
                  View Herd
                </Link>
                <Link className="addCowButton" to="/workdays">
                  View Workdays
                </Link>
                <Link className="addCowButton" to="/add-cow">
                  Add Cow
                </Link>
                <Link className="addCowButton" to="/workdays/new">
                  Add Workday
                </Link>
              </div>

              <div className="dashboardSplitGrid">
                <section className="dashboardCard">
                  <div className="dataCardHeader">
                    <h2 className="cardTitle">Upcoming Workdays</h2>
                    <span className="cardSubtle">
                      {upcomingWorkdays.length} scheduled
                    </span>
                  </div>

                  {upcomingWorkdays.length === 0 ? (
                    <p className="emptyState">No active workdays scheduled.</p>
                  ) : (
                    <div className="dashboardList dashboardListScrollable">
                      {upcomingWorkdays.map((workday) => (
                        <Link
                          key={workday.id}
                          className="cowRowCard"
                          to={`/workdays/${workday.id}`}
                        >
                          <div className="cowRowMain">
                            <div className="cowRowTitle">{workday.title}</div>
                            <div className="cowRowMeta">
                              {workday.summary?.trim() || "No summary yet."}
                            </div>
                            <div className="cowRowOwner">
                              Scheduled for {formatDateLabel(workday.date)}
                            </div>
                          </div>

                          <div className="cowRowActions">
                            <div className="statusPill">
                              {formatDateLabel(workday.date)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboardCard">
                  <div className="dataCardHeader">
                    <h2 className="cardTitle">Needs Attention</h2>
                    <span className="cardSubtle">
                      {attentionCows.length} cows
                    </span>
                  </div>

                  {attentionCows.length === 0 ? (
                    <p className="emptyState">All active cows are healthy.</p>
                  ) : (
                    <div className="dashboardList dashboardListScrollable">
                      {attentionCows.map((cow) => (
                        <Link
                          key={cow.id}
                          className="cowRowCard"
                          to={`/cows/${cow.id}`}
                        >
                          <div className="cowRowMain">
                            <div className="cowRowTitle">
                              Tag #{cow.tagNumber}
                            </div>
                            <div className="cowRowMeta">
                              {cow.livestockGroup || "Unassigned"} •{" "}
                              {cow.healthStatus
                                ? formatLabel(cow.healthStatus)
                                : "Unknown health status"}
                            </div>
                            <div className="cowRowOwner">
                              Owner: {cow.ownerName || "Unknown owner"}
                            </div>
                          </div>

                          <div className="cowRowActions">
                            <div className="statusPill needsTreatment">
                              {cow.healthStatus
                                ? formatLabel(cow.healthStatus)
                                : "Needs attention"}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="dashboardSplitGrid">
                <section className="dashboardCard">
                  <div className="dataCardHeader">
                    <h2 className="cardTitle">Archived Workdays</h2>
                    <span className="cardSubtle">
                      {archivedWorkdays.length} archived
                    </span>
                  </div>

                  {recentArchivedWorkdays.length === 0 ? (
                    <p className="emptyState">No archived workdays found.</p>
                  ) : (
                    <div className="dashboardList dashboardListScrollable">
                      {recentArchivedWorkdays.map((workday) => (
                        <Link
                          key={workday.id}
                          className="cowRowCard"
                          to={`/workdays/${workday.id}`}
                        >
                          <div className="cowRowMain">
                            <div className="cowRowTitle">{workday.title}</div>
                            <div className="cowRowMeta">
                              {workday.summary?.trim() || "No summary yet."}
                            </div>
                            <div className="cowRowOwner">
                              Archived workday record
                            </div>
                          </div>

                          <div className="cowRowActions">
                            <div className="statusPill">Archived</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboardCard">
                  <div className="dataCardHeader">
                    <h2 className="cardTitle">Archived Herd</h2>
                    <span className="cardSubtle">
                      {archivedCows.length} archived
                    </span>
                  </div>

                  {recentArchivedCows.length === 0 ? (
                    <p className="emptyState">No archived cows found.</p>
                  ) : (
                    <div className="dashboardList dashboardListScrollable">
                      {recentArchivedCows.map((cow) => (
                        <Link
                          key={cow.id}
                          className="cowRowCard"
                          to={`/cows/${cow.id}`}
                        >
                          <div className="cowRowMain">
                            <div className="cowRowTitle">
                              Tag #{cow.tagNumber}
                            </div>
                            <div className="cowRowMeta">
                              {cow.livestockGroup || "Unassigned"} •{" "}
                              {cow.healthStatus || "Unknown health status"}
                            </div>
                            <div className="cowRowOwner">
                              Owner: {cow.ownerName || "Unknown owner"}
                            </div>
                          </div>

                          <div className="cowRowActions">
                            <div className="statusPill">Archived</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
