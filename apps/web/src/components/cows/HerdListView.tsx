import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CowRowCard from "./CowRowCard";
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
  isSelecting?: boolean;
  selectedCowIds?: string[];
  onEnterSelect?: () => void;
  onCancelSelect?: () => void;
  onToggleSelect?: (cowId: string) => void;
  onSelectAll?: () => void;
  onBulkAction?: (action: "markHealthy" | "markNeedsTreatment") => void;
  onBulkRemove?: () => void;
};

type HerdStatFilter =
  | "All"
  | "Healthy"
  | "Needs Treatment"
  | "Breeding"
  | "Feeder"
  | "Market"
  | "Calf";

const HERD_FILTER_VALUES: HerdStatFilter[] = [
  "All",
  "Healthy",
  "Needs Treatment",
  "Breeding",
  "Feeder",
  "Market",
  "Calf",
];

function getFilterFromSearchParams(
  searchParams: URLSearchParams,
): HerdStatFilter {
  const filter = searchParams.get("filter");

  if (!filter) {
    return "All";
  }

  return HERD_FILTER_VALUES.includes(filter as HerdStatFilter)
    ? (filter as HerdStatFilter)
    : "All";
}

function getNormalizedTagNumber(tagNumber: string) {
  const digits = tagNumber.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return Number(digits);
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "");
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
  isSelecting = false,
  selectedCowIds = [],
  onEnterSelect,
  onCancelSelect,
  onToggleSelect,
  onSelectAll,
  onBulkAction,
  onBulkRemove,
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

  const stats: { label: string; value: number; filter: HerdStatFilter }[] =
    useMemo(
      () => [
        { label: "Total Cows", filter: "All", value: cows.length },
        {
          label: "Healthy",
          filter: "Healthy",
          value: cows.filter((cow) => cow.healthStatus === "Healthy").length,
        },
        {
          label: "Needs Treatment",
          filter: "Needs Treatment",
          value: cows.filter((cow) => cow.healthStatus !== "Healthy").length,
        },
        {
          label: "Breeding",
          filter: "Breeding",
          value: cows.filter((cow) => cow.livestockGroup === "Breeding").length,
        },
        {
          label: "Feeder",
          filter: "Feeder",
          value: cows.filter((cow) => cow.livestockGroup === "Feeder").length,
        },
        {
          label: "Market",
          filter: "Market",
          value: cows.filter((cow) => cow.livestockGroup === "Market").length,
        },
        {
          label: "Calves",
          filter: "Calf",
          value: cows.filter((cow) => cow.livestockGroup === "Calf").length,
        },
      ],
      [cows],
    );

  const showActionBar = isSelecting && selectedCowIds.length > 0;

  return (
    <div className="allCowsPage">
      <div className={`allCowsShell${showActionBar ? " hasActionBar" : ""}`}>
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">
                {isSelecting
                  ? selectedCowIds.length === 0
                    ? "Select cows"
                    : `${selectedCowIds.length} selected`
                  : title}
              </h1>
              {!isSelecting && <p className="pageSubtitle">{subtitle}</p>}
            </div>

            <div className="headerActions">
              {isSelecting ? (
                <>
                  {onSelectAll ? (
                    <button className="selectButton" onClick={onSelectAll}>
                      {selectedCowIds.length === cows.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  ) : null}
                  <button className="cancelSelectButton" onClick={onCancelSelect}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {ctaLabel && onCtaClick ? (
                    <button className="addCowButton" onClick={onCtaClick}>
                      {ctaLabel}
                    </button>
                  ) : null}
                  {onEnterSelect ? (
                    <button className="selectButton" onClick={onEnterSelect}>
                      Select
                    </button>
                  ) : null}
                </>
              )}
            </div>
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
                className={`statsCard statsFilterButton ${selectedFilter === stat.filter ? "active" : ""}`.trim()}
                onClick={() => updateSelectedFilter(stat.filter)}
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
                const supplementaryMeta = getCowSupplementaryMeta?.(cow);
                const isSelected = selectedCowIds.includes(cow.id);

                return (
                  <CowRowCard
                    key={cow.id}
                    cow={cow}
                    supplementaryMeta={supplementaryMeta}
                    to={isSelecting ? undefined : getCowHref(cow)}
                    onClick={isSelecting ? undefined : undefined}
                    isSelecting={isSelecting}
                    isSelected={isSelected}
                    onToggle={
                      isSelecting
                        ? () => onToggleSelect?.(cow.id)
                        : undefined
                    }
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {showActionBar && (
        <div className="bulkActionBar">
          <span className="bulkActionCount">
            {selectedCowIds.length} selected
          </span>
          <div className="bulkActionButtons">
            <button
              className="bulkActionButton bulkActionHealthy"
              onClick={() => onBulkAction?.("markHealthy")}
            >
              Mark Healthy
            </button>
            <button
              className="bulkActionButton bulkActionTreatment"
              onClick={() => onBulkAction?.("markNeedsTreatment")}
            >
              Needs Treatment
            </button>
            <button
              className="bulkActionButton danger"
              onClick={onBulkRemove}
            >
              Remove from Herd
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HerdListView;
