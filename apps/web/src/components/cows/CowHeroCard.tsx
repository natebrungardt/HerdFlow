import type { ReactNode } from "react";

type CowHeroCardProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  action?: ReactNode;
  children?: ReactNode;
};

function CowHeroCard({
  eyebrow,
  title,
  subtitle,
  action,
  children,
}: CowHeroCardProps) {
  return (
    <section className="dashboardCard heroCard">
      <div className="eyebrow">{eyebrow}</div>

      <div className="heroHeader">
        <div className="titleBlock">
          {title}
          <p className="cowSubtitle">{subtitle}</p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

export default CowHeroCard;
