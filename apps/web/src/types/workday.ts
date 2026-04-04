import type { Cow } from "./cow";

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
  createdAt: string;
  isArchived: boolean;
  workdayCows?: WorkdayCowAssignment[];
};
