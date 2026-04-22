import type { Cow } from "./cow";

export type WorkdayAction = {
  id: string;
  workdayId: string;
  name: string;
  createdAt: string;
};

export type WorkdayCowAssignment = {
  id: string;
  workdayId: string;
  cowId: string;
  status?: string | null;
  cow: Cow;
};

export type Workday = {
  id: string;
  title: string;
  date: string;
  summary?: string | null;
  status: "Draft" | "InProgress" | "Completed";
  createdAt: string;
  removedAt?: string | null;
  isRemoved: boolean;
  workdayCows?: WorkdayCowAssignment[];
  actions?: WorkdayAction[];
};
