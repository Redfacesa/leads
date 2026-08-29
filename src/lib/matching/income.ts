const INCOME_MIN: Record<string, number> = {
  "Under R5,000": 0,
  "R5,000 – R10,000": 5000,
  "R10,000 – R15,000": 10000,
  "R15,000 – R20,000": 15000,
  "R20,000 – R35,000": 20000,
  "Over R35,000": 35000,
};

const INCOME_MAX: Record<string, number> = {
  "Under R5,000": 5000,
  "R5,000 – R10,000": 10000,
  "R10,000 – R15,000": 15000,
  "R15,000 – R20,000": 20000,
  "R20,000 – R35,000": 35000,
  "Over R35,000": 999999,
};

export function parseIncomeMin(band?: string | null): number | null {
  if (!band) return null;
  return INCOME_MIN[band] ?? null;
}

export function parseIncomeMax(band?: string | null): number | null {
  if (!band) return null;
  return INCOME_MAX[band] ?? null;
}
