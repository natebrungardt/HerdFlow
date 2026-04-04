export type Cow = {
  id: string;
  tagNumber: string;
  ownerName: string;
  livestockGroup: string;
  sex: string;
  breed: string;
  dateOfBirth?: string | null;
  healthStatus: string;
  heatStatus: string;
  pregnancyStatus: string;
  hasCalf: boolean;
  purchasePrice?: number | null;
  salePrice?: number | null;
  purchaseDate?: string | null;
  saleDate?: string | null;
  notes?: string | null;
  isRemoved: boolean;
};
