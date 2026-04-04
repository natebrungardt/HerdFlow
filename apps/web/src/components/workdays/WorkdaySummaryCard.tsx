type WorkdaySummaryCardProps = {
  scheduledDate: string;
  createdAt: string;
  cowCount: number;
  isArchived: boolean;
};

function formatDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function WorkdaySummaryCard({
  scheduledDate,
  createdAt,
  cowCount,
  isArchived,
}: WorkdaySummaryCardProps) {
  return (
    <div className="dashboardCard">
      <div className="dataCardHeader">
        <h2 className="cardTitle">Workday Summary</h2>
        <span className="cardSubtle">Current snapshot</span>
      </div>

      <div className="infoGrid workdaySummaryGrid">
        <div className="infoTile">
          <div className="infoLabel">Scheduled Date</div>
          <div className="infoValue">{formatDate(scheduledDate)}</div>
        </div>
        <div className="infoTile">
          <div className="infoLabel">Created</div>
          <div className="infoValue">{formatDate(createdAt)}</div>
        </div>
        <div className="infoTile">
          <div className="infoLabel">Total Cows</div>
          <div className="infoValue">{cowCount}</div>
        </div>
        <div className="infoTile">
          <div className="infoLabel">Status</div>
          <div className="infoValue">{isArchived ? "Archived" : "Active"}</div>
        </div>
      </div>
    </div>
  );
}

export default WorkdaySummaryCard;
