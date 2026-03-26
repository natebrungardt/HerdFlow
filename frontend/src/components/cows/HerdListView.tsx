import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Cow } from "../../types/cow";
import { herdFilterOptions } from "../../constants/cowFormOptions";

const RECENTLY_VIEWED_COW_IDS_KEY = "recentlyViewedCowIds";

type HerdListViewProps = {
  cows: Cow[];
  loading: boolean;
  error: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  getCowHref: (cow: Cow) => string;
  emptyMessage?: string;
  sectionTitle?: string;
};

function formatHealthStatus(status: string | null | undefined) {
  return (status ?? "Unknown").replace(/([A-Z])/g, " $1").trim();
}

function HerdListView({
  cows,
  loading,
  error,
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  getCowHref,
  emptyMessage = "No cows found.",
  sectionTitle = "Herd Records",
}: HerdListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [recentlyViewedCowIds, setRecentlyViewedCowIds] = useState<number[]>(
    () => {
      if (typeof window === "undefined") {
        return [];
      }

      const storedValue = window.localStorage.getItem(
        RECENTLY_VIEWED_COW_IDS_KEY,
      );

      if (!storedValue) {
        return [];
      }

      try {
        const parsedValue = JSON.parse(storedValue);
        return Array.isArray(parsedValue)
          ? parsedValue.filter(
              (value): value is number => typeof value === "number",
            )
          : [];
      } catch {
        return [];
      }
    },
  );

  const filteredCows = useMemo(() => {
    const matchingCows = cows.filter((cow) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const normalizedGroup = (cow.livestockGroup ?? "").trim().toLowerCase();
      const normalizedSelectedGroup = selectedGroup.trim().toLowerCase();

      const matchesSearch =
        cow.tagNumber.toLowerCase().includes(normalizedSearch) ||
        (cow.ownerName ?? "").toLowerCase().includes(normalizedSearch);

      let matchesGroup = false;

      if (normalizedSelectedGroup === "all") {
        matchesGroup = true;
      } else if (normalizedSelectedGroup === "needs treatment") {
        matchesGroup =
          (cow.healthStatus ?? "").trim().toLowerCase() !== "healthy";
      } else {
        matchesGroup = normalizedGroup === normalizedSelectedGroup;
      }

      return matchesSearch && matchesGroup;
    });

    return [...matchingCows].sort((leftCow, rightCow) => {
      const leftIndex = recentlyViewedCowIds.indexOf(leftCow.id);
      const rightIndex = recentlyViewedCowIds.indexOf(rightCow.id);
      const leftWasViewed = leftIndex !== -1;
      const rightWasViewed = rightIndex !== -1;

      if (leftWasViewed && rightWasViewed) {
        return leftIndex - rightIndex;
      }

      if (leftWasViewed) {
        return -1;
      }

      if (rightWasViewed) {
        return 1;
      }

      return 0;
    });
  }, [cows, searchTerm, selectedGroup, recentlyViewedCowIds]);

  function markCowAsRecentlyViewed(cowId: number) {
    setRecentlyViewedCowIds((currentIds) => {
      const nextIds = [cowId, ...currentIds.filter((id) => id !== cowId)];

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          RECENTLY_VIEWED_COW_IDS_KEY,
          JSON.stringify(nextIds),
        );
      }

      return nextIds;
    });
  }

  const stats = useMemo(
    () => [
      { label: "Total Cows", value: cows.length },
      {
        label: "Healthy",
        value: cows.filter((cow) => cow.healthStatus === "Healthy").length,
      },
      {
        label: "Needs Treatment",
        value: cows.filter((cow) => cow.healthStatus !== "Healthy").length,
      },
      {
        label: "Breeding",
        value: cows.filter((cow) => cow.livestockGroup === "Breeding").length,
      },
      {
        label: "Feeder",
        value: cows.filter((cow) => cow.livestockGroup === "Feeder").length,
      },
      {
        label: "Market",
        value: cows.filter((cow) => cow.livestockGroup === "Market").length,
      },
    ],
    [cows],
  );

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">{title}</h1>
              <p className="pageSubtitle">{subtitle}</p>
            </div>

            {ctaLabel && onCtaClick ? (
              <button className="addCowButton" onClick={onCtaClick}>
                {ctaLabel}
              </button>
            ) : null}
          </div>

          <div className="toolbarCard">
            <input
              className="searchInput"
              type="text"
              placeholder="Search by tag number or owner name..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className="filterRow">
              {herdFilterOptions.map((group) => (
                <button
                  key={group}
                  className={`filterChip ${selectedGroup === group ? "active" : ""}`.trim()}
                  onClick={() => setSelectedGroup(group)}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div className="statsGrid">
            {stats.map((stat) => (
              <div key={stat.label} className="statsCard">
                <div className="statLabel">{stat.label}</div>
                <div className="statValue">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="cowListCard">
            <div className="sectionHeader">
              <h2 className="sectionTitle">{sectionTitle}</h2>
              <span className="sectionSubtle">{filteredCows.length} shown</span>
            </div>

            {loading ? (
              <p className="emptyState">Loading cows...</p>
            ) : error ? (
              <p className="emptyState">{error}</p>
            ) : filteredCows.length === 0 ? (
              <p className="emptyState">{emptyMessage}</p>
            ) : (
              filteredCows.map((cow) => {
                const statusClassName =
                  cow.healthStatus === "Healthy"
                    ? "statusPill"
                    : "statusPill needsTreatment";

                return (
                  <Link
                    key={cow.id}
                    className="cowRowCard"
                    to={getCowHref(cow)}
                    onClick={() => markCowAsRecentlyViewed(cow.id)}
                  >
                    <div className="cowRowMain">
                      <div className="cowRowTitle">Tag #{cow.tagNumber}</div>
                      <div className="cowRowMeta">
                        {cow.livestockGroup || "Unassigned"} •{" "}
                        {cow.healthStatus || "Unknown health status"} •{" "}
                        {cow.sex || "Unknown sex"} •{" "}
                        {cow.pregnancyStatus || "No pregnancy status"}
                      </div>
                      <div className="cowRowOwner">
                        Owner: {cow.ownerName || "Unknown owner"}
                      </div>
                    </div>

                    <div className="cowRowActions">
                      <div className={statusClassName}>
                        {formatHealthStatus(cow.healthStatus)}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HerdListView;
