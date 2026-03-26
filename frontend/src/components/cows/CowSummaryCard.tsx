type CowSummaryCardProps = {
  ownerName: string | null | undefined;
  subtitle: string;
  purchasePrice: string;
  salePrice: string;
};

function getOwnerInitial(name: string | null | undefined) {
  if (!name?.trim()) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function CowSummaryCard({
  ownerName,
  subtitle,
  purchasePrice,
  salePrice,
}: CowSummaryCardProps) {
  return (
    <section className="dashboardCard rightSummaryCard">
      <div className="dataCardHeader">
        <h2 className="cardTitle">Profile Summary</h2>
        <span className="cardSubtle">{subtitle}</span>
      </div>

      <div className="ownerRow">
        <div className="ownerAvatar">{getOwnerInitial(ownerName)}</div>
        <div className="ownerMeta">
          <div className="ownerName">{ownerName || "No owner yet"}</div>
          <div className="ownerRole">Primary owner</div>
        </div>
      </div>

      <div className="kpiStack">
        <div className="kpiRow">
          <span className="kpiLabel">Purchase Price</span>
          <span className="kpiValue">{purchasePrice}</span>
        </div>

        <div className="kpiRow">
          <span className="kpiLabel">Sale Price</span>
          <span className="kpiValue">{salePrice}</span>
        </div>
      </div>
    </section>
  );
}

export default CowSummaryCard;
