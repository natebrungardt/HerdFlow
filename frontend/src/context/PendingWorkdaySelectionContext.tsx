import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PendingWorkdaySelectionContextValue = {
  hasPendingSelections: boolean;
  setHasPendingSelections: (value: boolean) => void;
};

const PendingWorkdaySelectionContext =
  createContext<PendingWorkdaySelectionContextValue | null>(null);

type PendingWorkdaySelectionProviderProps = {
  children: ReactNode;
};

export function PendingWorkdaySelectionProvider({
  children,
}: PendingWorkdaySelectionProviderProps) {
  const [hasPendingSelections, setHasPendingSelections] = useState(false);

  const value = useMemo(
    () => ({ hasPendingSelections, setHasPendingSelections }),
    [hasPendingSelections],
  );

  return (
    <PendingWorkdaySelectionContext.Provider value={value}>
      {children}
    </PendingWorkdaySelectionContext.Provider>
  );
}

export function usePendingWorkdaySelection() {
  const context = useContext(PendingWorkdaySelectionContext);

  if (!context) {
    throw new Error(
      "usePendingWorkdaySelection must be used within a PendingWorkdaySelectionProvider",
    );
  }

  return context;
}
