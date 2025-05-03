function calculatePercentageChange(
  previousValue: number,
  currentValue: number,
): number {
  const percentageChange = (currentValue / previousValue - 1) * 100;
  return percentageChange;
}

function toSafeInteger(value: any) {
  return Number.isNaN(Number.parseInt(value)) ? 0 : Number.parseInt(value);
}

export { calculatePercentageChange, toSafeInteger };
