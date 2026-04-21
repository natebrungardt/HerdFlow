import { useEffect, useId, useRef, useState } from "react";
import type { Cow } from "../../types/cow";

type ParentType = "sire" | "dam";

type ParentSelectorFieldProps = {
  type: ParentType;
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

function renderHighlightedLabel(label: string, query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return label;
  }

  const startIndex = label.toLowerCase().indexOf(normalizedQuery.toLowerCase());

  if (startIndex < 0) {
    return label;
  }

  const endIndex = startIndex + normalizedQuery.length;

  return (
    <>
      {label.slice(0, startIndex)}
      <mark className="parentAutocompleteMatch">
        {label.slice(startIndex, endIndex)}
      </mark>
      {label.slice(endIndex)}
    </>
  );
}

function ParentSelectorField({
  type,
  selectedId,
  manualName,
  cows,
  onChange,
}: ParentSelectorFieldProps) {
  const selectId = useId();
  const autocompleteId = `${selectId}-autocomplete`;
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"herd" | "manual">(
    manualName.trim() ? "manual" : "herd",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const parentName = type === "sire" ? "sire" : "dam";
  const selectedCow = cows.find((cow) => cow.id === selectedId) ?? null;

  useEffect(() => {
    setMode(manualName.trim() ? "manual" : "herd");
  }, [manualName, selectedId]);

  useEffect(() => {
    setSearchTerm(selectedCow ? buildCowOptionLabel(selectedCow) : "");
  }, [selectedCow]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cows, selectedId]);

  function handleModeChange(nextMode: "herd" | "manual") {
    setMode(nextMode);
    setIsDropdownOpen(false);

    if (nextMode === "herd") {
      setSearchTerm("");
      setDebouncedSearchTerm("");
      onChange({ id: "", name: "" });
      return;
    }

    setSearchTerm("");
    setDebouncedSearchTerm("");
    onChange({ id: "", name: "" });
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);

    if (!value.trim()) {
      setIsDropdownOpen(false);
      onChange({ id: "", name: "" });
      return;
    }

    if (selectedId) {
      onChange({ id: "", name: "" });
    }

    setIsDropdownOpen(true);
  }

  function handleCowSelect(cow: Cow) {
    setSearchTerm(buildCowOptionLabel(cow));
    setDebouncedSearchTerm(buildCowOptionLabel(cow));
    setIsDropdownOpen(false);
    onChange({ id: cow.id, name: "" });
  }

  const normalizedSearch = debouncedSearchTerm.toLowerCase();
  const filteredCows = normalizedSearch
    ? cows
        .filter((cow) => {
          const haystack = `${cow.tagNumber} ${cow.name ?? ""}`.toLowerCase();
          return haystack.includes(normalizedSearch);
        })
        .slice(0, 8)
    : [];
  const showNoMatches = searchTerm.trim().length > 0 && filteredCows.length === 0;
  const showDropdown =
    mode === "herd" &&
    isDropdownOpen &&
    searchTerm.trim().length > 0 &&
    (filteredCows.length > 0 || showNoMatches);

  return (
    <div className="parentFieldControl">
      <div
        className="parentSegmentedControl"
        role="group"
        aria-label={`Choose ${parentName} source`}
      >
        <button
          type="button"
          className={`parentSegmentButton ${mode === "herd" ? "isActive" : ""}`.trim()}
          aria-pressed={mode === "herd"}
          onClick={() => handleModeChange("herd")}
        >
          From Herd
        </button>

        <button
          type="button"
          className={`parentSegmentButton ${mode === "manual" ? "isActive" : ""}`.trim()}
          aria-pressed={mode === "manual"}
          onClick={() => handleModeChange("manual")}
        >
          Manual Entry
        </button>
      </div>

      <p className="parentHelperText">Choose from your herd or enter manually</p>

      {mode === "herd" ? (
        <div className="parentFieldStack" ref={fieldRef}>
          <input
            id={selectId}
            type="text"
            className="parentSearchInput"
            value={searchTerm}
            onChange={(event) => handleSearchChange(event.target.value)}
            onFocus={() => {
              if (searchTerm.trim()) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder={`Search ${parentName} by tag or name`}
            autoComplete="off"
            aria-label={`Search ${parentName} in herd`}
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? autocompleteId : undefined}
          />

          {showDropdown ? (
            <div
              id={autocompleteId}
              className="parentAutocompleteDropdown"
              role="listbox"
              aria-label={`Matching ${parentName} results`}
            >
              {filteredCows.length > 0 ? (
                filteredCows.map((cow) => {
                  const optionLabel = buildCowOptionLabel(cow);

                  return (
                    <button
                      key={cow.id}
                      type="button"
                      className={`parentAutocompleteOption ${selectedId === cow.id ? "isSelected" : ""}`.trim()}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleCowSelect(cow)}
                      role="option"
                      aria-selected={selectedId === cow.id}
                    >
                      {renderHighlightedLabel(optionLabel, debouncedSearchTerm)}
                    </button>
                  );
                })
              ) : (
                <div className="parentAutocompleteEmpty">
                  No matching cows found
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <input
          id={selectId}
          type="text"
          className="parentSearchInput"
          value={manualName}
          onChange={(event) => onChange({ id: "", name: event.target.value })}
          placeholder={`Enter ${parentName} name (if not in herd)`}
          aria-label={`Enter ${parentName} name manually`}
        />
      )}
    </div>
  );
}

export default ParentSelectorField;
