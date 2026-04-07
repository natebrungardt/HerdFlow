import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Cow } from "../../types/cow";

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
  getCowSupplementaryMeta?: (cow: Cow) => string | null;
  sortCows?: (cows: Cow[]) => Cow[];
};

type HerdStatFilter =
  | "All"
  | "Healthy"
  | "Needs Treatment"
  | "Breeding"
  | "Feeder"
  | "Market"
  | "Calf";

type HerdStatLabel = "Total Cows" | HerdStatFilter;

const HERD_FILTER_VALUES: HerdStatFilter[] = [
  "All",
  "Healthy",
  "Needs Treatment",
  "Breeding",
  "Feeder",
  "Market",
  "Calf",
];

function getFilterFromSearchParams(searchParams: URLSearchParams): HerdStatFilter {
  const filter = searchParams.get("filter");

  if (!filter) {
    return "All";
  }

  return HERD_FILTER_VALUES.includes(filter as HerdStatFilter)
    ? (filter as HerdStatFilter)
    : "All";
}

function formatHealthStatus(status: string | null | undefined) {
  return (status ?? "Unknown").replace(/([A-Z])/g, " $1").trim();
}

function getNormalizedTagNumber(tagNumber: string) {
  const digits = tagNumber.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return Number(digits);
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

function defaultSortCows(cows: Cow[]) {
  return [...cows].sort((leftCow, rightCow) => {
    const leftCreatedAt = leftCow.createdAt
      ? new Date(leftCow.createdAt).getTime()
      : null;
    const rightCreatedAt = rightCow.createdAt
      ? new Date(rightCow.createdAt).getTime()
      : null;

    if (
      leftCreatedAt !== null &&
      rightCreatedAt !== null &&
      !Number.isNaN(leftCreatedAt) &&
      !Number.isNaN(rightCreatedAt) &&
      leftCreatedAt !== rightCreatedAt
    ) {
      return rightCreatedAt - leftCreatedAt;
    }

    if (
      leftCreatedAt !== null &&
      !Number.isNaN(leftCreatedAt) &&
      (rightCreatedAt === null || Number.isNaN(rightCreatedAt))
    ) {
      return -1;
    }

    if (
      rightCreatedAt !== null &&
      !Number.isNaN(rightCreatedAt) &&
      (leftCreatedAt === null || Number.isNaN(leftCreatedAt))
    ) {
      return 1;
    }

    const leftTagNumber = getNormalizedTagNumber(leftCow.tagNumber);
    const rightTagNumber = getNormalizedTagNumber(rightCow.tagNumber);

    if (leftTagNumber === null && rightTagNumber !== null) {
      return 1;
    }

    if (leftTagNumber !== null && rightTagNumber === null) {
      return -1;
    }

    if (
      leftTagNumber !== null &&
      rightTagNumber !== null &&
      leftTagNumber !== rightTagNumber
    ) {
      return leftTagNumber - rightTagNumber;
    }

    return leftCow.tagNumber.localeCompare(rightCow.tagNumber, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
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
  getCowSupplementaryMeta,
  sortCows = defaultSortCows,
}: HerdListViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<HerdStatFilter>(() =>
    getFilterFromSearchParams(searchParams),
  );

  useEffect(() => {
    setSelectedFilter(getFilterFromSearchParams(searchParams));
  }, [searchParams]);

  function updateSelectedFilter(nextFilter: HerdStatFilter) {
    setSelectedFilter(nextFilter);

    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextFilter === "All") {
      nextSearchParams.delete("filter");
    } else {
      nextSearchParams.set("filter", nextFilter);
    }

    setSearchParams(nextSearchParams, { replace: true });
  }

  const filteredCows = useMemo(() => {
    const matchingCows = cows.filter((cow) => {
      const normalizedSearch = normalizeSearchValue(searchTerm);
      const normalizedTagNumber = normalizeSearchValue(cow.tagNumber);
      const normalizedOwnerName = normalizeSearchValue(cow.ownerName ?? "");

      const matchesSearch =
        normalizedTagNumber.includes(normalizedSearch) ||
        normalizedOwnerName.includes(normalizedSearch);

      const matchesFilter =
        selectedFilter === "All"
          ? true
          : selectedFilter === "Healthy"
            ? cow.healthStatus === "Healthy"
            : selectedFilter === "Needs Treatment"
              ? cow.healthStatus !== "Healthy"
              : cow.livestockGroup === selectedFilter;

      return matchesSearch && matchesFilter;
    });

    return sortCows(matchingCows);
  }, [cows, searchTerm, selectedFilter, sortCows]);

  const stats = useMemo(
    () => [
      { label: "Total Cows" as HerdStatLabel, value: cows.length },
      {
        label: "Healthy" as HerdStatLabel,
        value: cows.filter((cow) => cow.healthStatus === "Healthy").length,
      },
      {
        label: "Needs Treatment" as HerdStatLabel,
        value: cows.filter((cow) => cow.healthStatus !== "Healthy").length,
      },
      {
        label: "Breeding" as HerdStatLabel,
        value: cows.filter((cow) => cow.livestockGroup === "Breeding").length,
      },
      {
        label: "Feeder" as HerdStatLabel,
        value: cows.filter((cow) => cow.livestockGroup === "Feeder").length,
      },
      {
        label: "Market" as HerdStatLabel,
        value: cows.filter((cow) => cow.livestockGroup === "Market").length,
      },
      {
        label: "Calf" as HerdStatLabel,
        value: cows.filter((cow) => cow.livestockGroup === "Calf").length,
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
          </div>

          <div className="statsGrid herdStatsGrid">
            {stats.map((stat) => (
              <button
                key={stat.label}
                type="button"
                className={`statsCard statsFilterButton ${
                  selectedFilter === stat.label ||
                  (stat.label === "Total Cows" && selectedFilter === "All")
                    ? "active"
                    : ""
                }`.trim()}
                onClick={() =>
                  updateSelectedFilter(
                    stat.label === "Total Cows" ? "All" : stat.label,
                  )
                }
              >
                <div className="statLabel">{stat.label}</div>
                <div className="statValue">{stat.value}</div>
              </button>
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
                const supplementaryMeta = getCowSupplementaryMeta?.(cow);

                return (
                  <Link
                    key={cow.id}
                    className="cowRowCard"
                    to={getCowHref(cow)}
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
                      {supplementaryMeta ? (
                        <div className="cowRowOwner">{supplementaryMeta}</div>
                      ) : null}
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
