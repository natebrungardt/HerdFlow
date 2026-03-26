import type { Cow } from "./cow";

export type WorkdayCowAssignment = {
  id: number;
  workdayId: number;
  cowId: number;
  status?: string | null;
  cow: Cow;
};

export type Workday = {
  id: number;
  title: string;
  date: string;
  summary?: string | null;
  createdAt: string;
  isArchived: boolean;
  workdayCows?: WorkdayCowAssignment[];
};
