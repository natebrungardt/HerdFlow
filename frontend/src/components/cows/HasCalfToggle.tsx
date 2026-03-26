type HasCalfToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void | Promise<void>;
  compact?: boolean;
};

function HasCalfToggle({
  value,
  onChange,
  compact = false,
}: HasCalfToggleProps) {
  const content = (
    <div className={`metricToggleRow ${compact ? "metricToggleRowCompact" : ""}`.trim()}>
      <button
        type="button"
        className={`metricToggleButton ${!value ? "isActive isHasCalfNo" : ""}`.trim()}
        onClick={() => void onChange(false)}
      >
        No
      </button>

      <button
        type="button"
        className={`metricToggleButton ${value ? "isActive isHasCalfYes" : ""}`.trim()}
        onClick={() => void onChange(true)}
      >
        Yes
      </button>
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <div className="metricCard">
      <div className="metricLabel">Has Calf</div>
      {content}
    </div>
  );
}

export default HasCalfToggle;
