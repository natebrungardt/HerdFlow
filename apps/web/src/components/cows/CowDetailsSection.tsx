import type { ReactNode } from "react";

type CowDetailsField = {
  key: string;
  label: string;
  content: ReactNode;
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
          <div key={field.key} className="infoTile">
            <div className="infoLabel">{field.label}</div>
            <div className="infoValue">{field.content}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CowDetailsSection;
