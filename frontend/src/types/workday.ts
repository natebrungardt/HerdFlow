export type Workday = {
  id: number;
  title: string;
  date: string;
  summary?: string | null;
  createdAt: string;
  isArchived: boolean;
};
