type HealthStatusToggleProps = {
  value: string;
  onChange: (value: "Healthy" | "NeedsTreatment") => void | Promise<void>;
  disabled?: boolean;
};

function HealthStatusToggle({
  value,
  onChange,
  disabled = false,
}: HealthStatusToggleProps) {
  return (
    <div className="metricCard">
      <div className="metricLabel">Health Status</div>

      <div className="metricToggleRow">
        <button
          type="button"
          className={`metricToggleButton ${value === "Healthy" ? "isActive isHealthy" : ""}`.trim()}
          disabled={disabled}
          onClick={() => void onChange("Healthy")}
        >
          Healthy
        </button>

        <button
          type="button"
          className={`metricToggleButton ${value === "NeedsTreatment" ? "isActive isNeedsTreatment" : ""}`.trim()}
          disabled={disabled}
          onClick={() => void onChange("NeedsTreatment")}
        >
          Needs Treatment
        </button>
      </div>
    </div>
  );
}

export default HealthStatusToggle;
