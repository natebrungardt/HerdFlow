import type { ReactNode } from "react";

type CowDetailsField = {
  key: string;
  label: string;
  content: ReactNode;
  onDoubleClick?: () => void;
};

type CowDetailsSectionProps = {
  title: string;
  subtitle: string;
  fields: CowDetailsField[];
};

function CowDetailsSection({
  title,
  subtitle,
  fields,
}: CowDetailsSectionProps) {
  return (
    <section className="dashboardCard">
      <div className="dataCardHeader">
        <h2 className="cardTitle">{title}</h2>
        <span className="cardSubtle">{subtitle}</span>
      </div>

      <div className="infoGrid">
        {fields.map((field) => (
          <div
            key={field.key}
            className={`infoTile ${field.onDoubleClick ? "infoTileInteractive" : ""}`.trim()}
            onDoubleClick={field.onDoubleClick}
          >
            <div className="infoLabel">{field.label}</div>
            <div className="infoValue">{field.content}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CowDetailsSection;
