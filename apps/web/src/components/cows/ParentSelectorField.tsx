import { useEffect, useId, useState } from "react";
import type { Cow } from "../../types/cow";

type ParentSelectorFieldProps = {
  label: string;
  selectedId: string;
  manualName: string;
  cows: Cow[];
  onChange: (next: { id: string; name: string }) => void;
};

function buildCowOptionLabel(cow: Cow) {
  return cow.name?.trim()
    ? `${cow.tagNumber} (${cow.name.trim()})`
    : cow.tagNumber;
}

function ParentSelectorField({
  label,
  selectedId,
  manualName,
  cows,
  onChange,
}: ParentSelectorFieldProps) {
  const selectId = useId();
  const [mode, setMode] = useState<"herd" | "manual">(
    manualName.trim() ? "manual" : "herd",
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMode(manualName.trim() ? "manual" : "herd");
  }, [manualName]);

  useEffect(() => {
    const selectedCow = cows.find((cow) => cow.id === selectedId);
    setSearch(selectedCow ? buildCowOptionLabel(selectedCow) : "");
  }, [cows, selectedId]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCows = cows.filter((cow) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = `${cow.tagNumber} ${cow.name ?? ""}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  return (
    <div className="parentFieldControl">
      <div className="parentFieldHeader">
        <span className="parentFieldMode">
          {mode === "herd" ? "Select from herd" : "Manual entry"}
        </span>
        <button
          type="button"
          className="parentFieldToggle"
          onClick={() => {
            if (mode === "herd") {
              setMode("manual");
              setSearch("");
              onChange({ id: "", name: manualName });
              return;
            }

            setMode("herd");
            onChange({ id: "", name: "" });
          }}
        >
          {mode === "herd"
            ? "Not in herd? Enter manually"
            : "Choose from herd instead"}
        </button>
      </div>

      {mode === "herd" ? (
        <div className="parentFieldStack">
          <input
            type="text"
            className="parentSearchInput"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${label.toLowerCase()} by tag or name`}
            autoComplete="off"
            aria-label={`Search ${label.toLowerCase()} in herd`}
          />

          <select
            id={selectId}
            className="parentSelectInput"
            value={selectedId}
            onChange={(event) => onChange({ id: event.target.value, name: "" })}
            aria-label={`Select ${label.toLowerCase()} from herd`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {filteredCows.map((cow) => (
              <option key={cow.id} value={cow.id}>
                {buildCowOptionLabel(cow)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input
          id={selectId}
          type="text"
          className="parentSearchInput"
          value={manualName}
          onChange={(event) => onChange({ id: "", name: event.target.value })}
          placeholder={`Enter ${label.toLowerCase()} name`}
          aria-label={`Enter ${label.toLowerCase()} name manually`}
        />
      )}
    </div>
  );
}

export default ParentSelectorField;
