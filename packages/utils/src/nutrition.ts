export function caloriesFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}

export function macroRatio(proteinG: number, carbsG: number, fatG: number) {
  const total = proteinG + carbsG + fatG;
  if (total === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: proteinG / total,
    carbs: carbsG / total,
    fat: fatG / total
  };
}
