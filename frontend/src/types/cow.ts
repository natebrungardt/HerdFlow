export type Cow = {
  id: number;
  tagNumber: string;
  breed: string;
  healthStatus: string;
  heatStatus: string;
  breedingStatus: string;
  ownerName?: string | null;
  dateOfBirth?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
};
