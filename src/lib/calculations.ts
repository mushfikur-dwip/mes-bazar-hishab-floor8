export interface MealWeight {
  breakfast_weight: number;
  lunch_weight: number;
  dinner_weight: number;
}

export interface MealEntry {
  user_id: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface MemberSummary {
  userId: string;
  fullName: string;
  mealUnits: number;
  mealCost: number;
  extraShare: number;
  totalCost: number;
  paid: number;
  thisMonthNet: number;
  openingBalance: number;
  closingBalance: number;
}

export const DEFAULT_WEIGHTS: MealWeight = {
  breakfast_weight: 0.5,
  lunch_weight: 1.0,
  dinner_weight: 1.0,
};

export function calcMealUnits(entry: MealEntry, weights: MealWeight): number {
  let units = 0;
  if (entry.breakfast) units += weights.breakfast_weight;
  if (entry.lunch) units += weights.lunch_weight;
  if (entry.dinner) units += weights.dinner_weight;
  return units;
}

export function calcUserMealUnits(entries: MealEntry[], weights: MealWeight): number {
  return entries.reduce((sum, e) => sum + calcMealUnits(e, weights), 0);
}

export function calcMealRate(totalBazar: number, totalMealUnits: number): number {
  if (totalMealUnits === 0) return 0;
  return totalBazar / totalMealUnits;
}

export function calcMonthSummaries(
  memberIds: string[],
  memberNames: Record<string, string>,
  mealEntries: MealEntry[],
  weights: MealWeight,
  totalBazar: number,
  totalExtraCosts: number,
  activeCount: number,
  payments: { user_id: string; amount: number }[],
  openingBalances: Record<string, number>,
): MemberSummary[] {
  const totalMealUnits = mealEntries.reduce((s, e) => s + calcMealUnits(e, weights), 0);
  const mealRate = calcMealRate(totalBazar, totalMealUnits);
  const extraPerPerson = activeCount > 0 ? totalExtraCosts / activeCount : 0;

  return memberIds.map(userId => {
    const userEntries = mealEntries.filter(e => e.user_id === userId);
    const userMealUnits = calcUserMealUnits(userEntries, weights);
    const mealCost = userMealUnits * mealRate;
    const totalCost = mealCost + extraPerPerson;
    const paid = payments.filter(p => p.user_id === userId).reduce((s, p) => s + Number(p.amount), 0);
    const thisMonthNet = paid - totalCost;
    const opening = openingBalances[userId] || 0;
    const closing = opening + thisMonthNet;

    return {
      userId,
      fullName: memberNames[userId] || 'Unknown',
      mealUnits: Math.round(userMealUnits * 100) / 100,
      mealCost: Math.round(mealCost * 100) / 100,
      extraShare: Math.round(extraPerPerson * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      thisMonthNet: Math.round(thisMonthNet * 100) / 100,
      openingBalance: Math.round(opening * 100) / 100,
      closingBalance: Math.round(closing * 100) / 100,
    };
  });
}
