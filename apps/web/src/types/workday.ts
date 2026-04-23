import type { Cow } from "./cow";

export type WorkdayAction = {
  id: string;
  workdayId: string;
  name: string;
  createdAt: string;
};

export type WorkdayEntry = {
  workdayId: string;
  cowId: string;
  actionId: string;
  isCompleted: boolean;
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
  workdayCows?: WorkdayCowAssignment[];
  actions?: WorkdayAction[];
  entries?: WorkdayEntry[];
};
