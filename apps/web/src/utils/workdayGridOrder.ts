import type {
  Workday,
  WorkdayAction,
  WorkdayCowAssignment,
} from "../types/workday";

const WORKDAY_GRID_ORDER_STORAGE_KEY = "herdflow.workdayGridOrder";

type WorkdayGridOrder = {
  cowIds: string[];
  actionIds: string[];
};

type StoredWorkdayGridOrders = Record<string, WorkdayGridOrder>;

function readStoredOrders(): StoredWorkdayGridOrders {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(WORKDAY_GRID_ORDER_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    if (parsedValue && typeof parsedValue === "object") {
      return parsedValue as StoredWorkdayGridOrders;
    }
  } catch {
    try {
      window.localStorage.removeItem(WORKDAY_GRID_ORDER_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }

  return {};
}

function writeStoredOrder(workdayId: string, order: WorkdayGridOrder) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const storedOrders = readStoredOrders();
    storedOrders[workdayId] = order;
    window.localStorage.setItem(
      WORKDAY_GRID_ORDER_STORAGE_KEY,
      JSON.stringify(storedOrders),
    );
  } catch {
    // Display order is a UI enhancement; storage failures should not block work.
  }
}

function applySavedOrder<T>(
  items: T[],
  savedIds: string[],
  getId: (item: T) => string,
) {
  const itemsById = new Map(items.map((item) => [getId(item), item]));
  const orderedItems: T[] = [];

  for (const savedId of savedIds) {
    const savedItem = itemsById.get(savedId);
    if (savedItem) {
      orderedItems.push(savedItem);
      itemsById.delete(savedId);
    }
  }

  for (const item of items) {
    const itemId = getId(item);
    if (itemsById.has(itemId)) {
      orderedItems.push(item);
      itemsById.delete(itemId);
    }
  }

  return orderedItems;
}

export function preserveWorkdayGridOrder(workday: Workday): Workday {
  const savedOrder = readStoredOrders()[workday.id] ?? {
    cowIds: [],
    actionIds: [],
  };

  const workdayCows = applySavedOrder<WorkdayCowAssignment>(
    workday.workdayCows ?? [],
    savedOrder.cowIds,
    (assignment) => assignment.cowId,
  );
  const actions = applySavedOrder<WorkdayAction>(
    workday.actions ?? [],
    savedOrder.actionIds,
    (action) => action.id,
  );

  writeStoredOrder(workday.id, {
    cowIds: workdayCows.map((assignment) => assignment.cowId),
    actionIds: actions.map((action) => action.id),
  });

  return {
    ...workday,
    workdayCows,
    actions,
  };
}
