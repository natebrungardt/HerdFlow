import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getDashboardFarmLabel, getUserFarmName } from "../lib/account";
import { getCows, getRemovedCows } from "../services/cowService";
import {
  getRecentActivity,
  type RecentActivityEntry,
} from "../services/activityService";
import { getActiveWorkdays } from "../services/workdayService";
import type { Cow } from "../types/cow";
import type { Workday } from "../types/workday";
import "../styles/AllCows.css";
import "../styles/CowDetailPage.css";

function formatActivityTime(
  dateStr: string,
  section: "today" | "yesterday" | "last7",
) {
  const date = new Date(dateStr);
  if (section === "last7") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

type ActivityGroups = {
  today: RecentActivityEntry[];
  yesterday: RecentActivityEntry[];
  last7: RecentActivityEntry[];
};

function groupActivities(activities: RecentActivityEntry[]): ActivityGroups {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const groups: ActivityGroups = { today: [], yesterday: [], last7: [] };

  for (const item of activities) {
    const d = new Date(item.createdAt);
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const t = itemDay.getTime();

    if (t === today.getTime()) {
      groups.today.push(item);
    } else if (t === yesterday.getTime()) {
      groups.yesterday.push(item);
    } else if (t >= sevenDaysAgo.getTime()) {
      groups.last7.push(item);
    }
  }

  for (const key of ["today", "yesterday", "last7"] as const) {
    groups[key].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return groups;
}

function parseDateValue(dateValue: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 12);
  }

  return new Date(dateValue);
}

function formatDateLabel(dateValue: string) {
  const date = parseDateValue(dateValue);

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

function getWorkdayStatusLabel(status: Workday["status"]) {
  switch (status) {
    case "InProgress":
      return "In Progress";
    case "Completed":
      return "Completed";
    default:
      return "Planned";
  }
}

function getWorkdayStatusPillClassName(status: Workday["status"]) {
  switch (status) {
    case "InProgress":
      return "statusPill workdayStatusPill inProgress";
    case "Completed":
      return "statusPill workdayStatusPill completed healthy";
    default:
      return "statusPill workdayStatusPill draft";
  }
}

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [cows, setCows] = useState<Cow[]>([]);
  const [archivedCows, setArchivedCows] = useState<Cow[]>([]);
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState({
    today: false,
    yesterday: false,
    last7: false,
  });
  const farmLabel = getDashboardFarmLabel(user);
  const hasFarmName = Boolean(getUserFarmName(user));

  useEffect(() => {
    function handleHerdImported() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener("herd:imported", handleHerdImported);
    return () => window.removeEventListener("herd:imported", handleHerdImported);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");
        const [activeCows, removedCows, activeWorkdays, activity] =
          await Promise.all([
            getCows(),
            getRemovedCows(),
            getActiveWorkdays(),
            getRecentActivity(200),
          ]);

        setCows(activeCows);
        setArchivedCows(removedCows);
        setWorkdays(activeWorkdays);
        setRecentActivity(activity);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [refreshKey]);

  const upcomingWorkdays = useMemo(() => {
    return [...workdays].sort((leftWorkday, rightWorkday) => {
      return (
        parseDateValue(leftWorkday.date).getTime() -
        parseDateValue(rightWorkday.date).getTime()
      );
    });
  }, [workdays]);

  const nextUpcomingWorkday = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    return (
      upcomingWorkdays.find((workday) => {
        return parseDateValue(workday.date).getTime() >= startOfToday.getTime();
      }) ?? upcomingWorkdays[0]
    );
  }, [upcomingWorkdays]);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Needs Treatment",
        value: cows.filter((cow) => cow.healthStatus !== "Healthy").length,
        to: "/cows?filter=Needs%20Treatment",
      },
      { label: "Active Herd", value: cows.length, to: "/cows" },
      {
        label: "Breeding",
        value: cows.filter((cow) => cow.livestockGroup === "Breeding").length,
        to: "/cows?filter=Breeding",
      },
      {
        label: "Calves",
        value: cows.filter((cow) => cow.livestockGroup === "Calf").length,
        to: "/cows?filter=Calf",
      },
      {
        className: "nextWorkdayCard",
        label: "Next Workday",
        value: nextUpcomingWorkday?.title ?? "No workday scheduled",
        detail: nextUpcomingWorkday
          ? formatDateLabel(nextUpcomingWorkday.date)
          : "Create one to get started",
        to: nextUpcomingWorkday
          ? `/workdays/${nextUpcomingWorkday.id}`
          : "/workdays/new",
      },
      { label: "Archived Cows", value: archivedCows.length, to: "/removed" },
    ],
    [archivedCows.length, cows, nextUpcomingWorkday],
  );

  const attentionCows = useMemo(() => {
    return cows.filter((cow) => cow.healthStatus !== "Healthy");
  }, [cows]);

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              {farmLabel && farmLabel !== "Account" ? (
                <p
                  className={
                    hasFarmName ? "dashboardFarmName" : "dashboardFarmFallback"
                  }
                >
                  {farmLabel}
                </p>
              ) : null}
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
                    className={`statsCard statsLinkCard ${stat.className ?? ""}`.trim()}
                    to={stat.to}
                  >
                    <div className="statLabel">{stat.label}</div>
                    <div className="statValue">{stat.value}</div>
                    {"detail" in stat ? (
                      <div className="statMeta">{stat.detail}</div>
                    ) : null}
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
                          to={`/completed-workdays/${workday.id}`}
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
                            <div
                              className={getWorkdayStatusPillClassName(
                                workday.status,
                              )}
                            >
                              {getWorkdayStatusLabel(workday.status)}
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

              <section className="dashboardCard">
                <div className="dataCardHeader">
                  <h2 className="cardTitle">Recent Activity</h2>
                  <span className="cardSubtle">Last 7 days</span>
                </div>

                {(() => {
                  const groups = groupActivities(recentActivity);
                  const PREVIEW = 5;

                  const sections = [
                    { key: "today" as const, label: "Today" },
                    { key: "yesterday" as const, label: "Yesterday" },
                    { key: "last7" as const, label: "Last 7 Days" },
                  ].filter(({ key }) => groups[key].length > 0);

                  if (sections.length === 0) {
                    return (
                      <p className="emptyState">No recent activity yet.</p>
                    );
                  }

                  return (
                    <div className="activityList">
                      {sections.map(({ key, label }) => {
                        const items = groups[key];
                        const isExpanded = expanded[key];
                        const visible = isExpanded
                          ? items
                          : items.slice(0, PREVIEW);
                        const hasMore = items.length > PREVIEW;

                        return (
                          <div key={key}>
                            <div className="activitySectionHeader">
                              {label}
                            </div>
                            {visible.map((item) => (
                              <div key={item.id} className="activityRow">
                                <div className="activityDot" />
                                <div className="cowRowMain">
                                  <div className="cowRowTitle">
                                    {item.description}
                                  </div>
                                </div>
                                <span className="cardSubtle">
                                  {formatActivityTime(item.createdAt, key)}
                                </span>
                              </div>
                            ))}
                            {hasMore && (
                              <button
                                className="activityToggleBtn"
                                onClick={() =>
                                  setExpanded((prev) => ({
                                    ...prev,
                                    [key]: !prev[key],
                                  }))
                                }
                              >
                                {isExpanded
                                  ? "Show less"
                                  : `Show all (${items.length})`}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
