export const livestockGroupOptions = [
  { value: "Breeding", label: "Breeding" },
  { value: "Market", label: "Market" },
  { value: "Feeder", label: "Feeder" },
] as const;

export const pregnancyStatusOptions = [
  { value: "N/A", label: "N/A" },
  { value: "Open", label: "Open" },
  { value: "Bred", label: "Bred" },
] as const;

export const heatStatusOptions = [
  { value: "", label: "Select heat status" },
  { value: "WatchHeat", label: "Watch Heat" },
  { value: "InHeat", label: "In Heat" },
  { value: "NotInHeat", label: "Not In Heat" },
] as const;

export const sexOptions = [
  { value: "", label: "Select sex" },
  { value: "Cow", label: "Cow" },
  { value: "Bull", label: "Bull" },
  { value: "Heifer", label: "Heifer" },
  { value: "Steer", label: "Steer" },
] as const;

export const herdFilterOptions = [
  "All",
  "Breeding",
  "Feeder",
  "Market",
  "Needs Treatment",
] as const;
