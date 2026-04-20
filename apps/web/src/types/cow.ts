export type Cow = {
  id: string;
  tagNumber: string;
  ownerName: string;
  livestockGroup: string;
  sex: string;
  breed: string;
  name?: string | null;
  color?: string | null;
  dateOfBirth?: string | null;
  birthWeight?: number | null;
  easeOfBirth?: string | null;
  sireId?: string | null;
  sireName?: string | null;
  damId?: string | null;
  damName?: string | null;
  sire?: {
    id: string;
    tagNumber: string;
    name?: string | null;
  } | null;
  dam?: {
    id: string;
    tagNumber: string;
    name?: string | null;
  } | null;
  healthStatus: string;
  heatStatus: string;
  pregnancyStatus: string;
  hasCalf: boolean;
  purchasePrice?: number | null;
  salePrice?: number | null;
  purchaseDate?: string | null;
  saleDate?: string | null;
  createdAt: string;
  removedAt?: string | null;
  notes?: string | null;
  isRemoved: boolean;
};
