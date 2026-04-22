import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CowRowCard from "./CowRowCard";
import type { Cow } from "../../types/cow";

type CalfHistorySectionProps = {
  cow: Cow;
  existingCows: Cow[];
  onAddCalf: () => void;
};

function formatDateInputValue(value: string | null | undefined) {
  return value?.split("T")[0] ?? "";
}

function formatDateDisplay(value: string | null | undefined) {
  return value ? formatDateInputValue(value) : "—";
}

function CalfHistorySection({
  cow,
  existingCows,
  onAddCalf,
}: CalfHistorySectionProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCalfHistoryModal, setShowCalfHistoryModal] = useState(false);

  useEffect(() => {
    setShowCalfHistoryModal(false);
  }, [location.pathname]);

  const calves = existingCows
    .filter(
      (existingCow) =>
        existingCow.damId === cow.id || existingCow.sireId === cow.id,
    )
    .sort((left, right) => {
      const leftDate = left.dateOfBirth ?? left.createdAt;
      const rightDate = right.dateOfBirth ?? right.createdAt;
      return new Date(rightDate).getTime() - new Date(leftDate).getTime();
    });
  const recentCalves = calves.slice(0, 4);

  return (
    <>
      <section className="dashboardCard calvesCard">
        <div className="dataCardHeader">
          <h2 className="cardTitle">Calves</h2>
          <div className="detailInlineActions">
            {(cow.sex === "Cow" || cow.sex === "Heifer") && (
              <button
                type="button"
                className="detailActionButton"
                onClick={onAddCalf}
              >
                <span className="detailActionIcon" aria-hidden="true">
                  +
                </span>
                <span>Add Calf</span>
              </button>
            )}
            {calves.length > 0 ? (
              <button
                type="button"
                className="calvesViewAllButton"
                onClick={() => setShowCalfHistoryModal(true)}
              >
                View all
              </button>
            ) : (
              <span className="cardSubtle">No history yet</span>
            )}
          </div>
        </div>

        {calves.length > 0 ? (
          <>
            <div className="calvesCount">{calves.length} total</div>
            <div className="calvesList">
              {recentCalves.map((calf) => (
                <div key={calf.id} className="calfListItem">
                  <div className="calfListPrimary">
                    {calf.tagNumber}
                    {calf.isRemoved ? (
                      <span className="calfArchivedBadge">Archived</span>
                    ) : null}
                  </div>
                  <div className="calfListSecondary">
                    DOB {formatDateDisplay(calf.dateOfBirth)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="calvesEmptyState">
            <p className="emptyState">No calves yet</p>
          </div>
        )}
      </section>

      {showCalfHistoryModal ? (
        <div
          className="modalOverlay"
          onClick={() => setShowCalfHistoryModal(false)}
        >
          <div
            className="modalCard calfHistoryModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dataCardHeader calfHistoryHeader">
              <div>
                <h3>Calf History ({calves.length})</h3>
                <p className="cardSubtle">Full calf relationship history</p>
              </div>
              <button
                type="button"
                className="calvesViewAllButton"
                onClick={() => setShowCalfHistoryModal(false)}
              >
                Close
              </button>
            </div>

            <div className="calfHistoryList">
              {calves.map((calf) => (
                <CowRowCard
                  key={calf.id}
                  cow={calf}
                  variant="calf-history"
                  secondaryText={`DOB: ${formatDateDisplay(calf.dateOfBirth)}`}
                  onClick={() => {
                    setShowCalfHistoryModal(false);
                    navigate(`/cows/${calf.id}`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default CalfHistorySection;
