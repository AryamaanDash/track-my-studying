export function getExclusiveUtcDayEnd(referenceDate: Date) {
  return new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate() + 1
    )
  );
}
