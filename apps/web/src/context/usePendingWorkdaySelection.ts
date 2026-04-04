import { useContext } from "react";
import { PendingWorkdaySelectionContext } from "./PendingWorkdaySelectionContext";

export function usePendingWorkdaySelection() {
  const context = useContext(PendingWorkdaySelectionContext);

  if (!context) {
    throw new Error(
      "usePendingWorkdaySelection must be used within a PendingWorkdaySelectionProvider",
    );
  }

  return context;
}
