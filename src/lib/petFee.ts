/**
 * Pet fee rules — Vila Santa Rosa
 * High season (September → March): R$ 80 per pet per night
 * Low season (April → August):     R$ 50 per pet per night
 */
export const PET_FEE_HIGH = 80
export const PET_FEE_LOW = 50
export const MAX_PETS = 3

/** monthIndex: 0 = January … 8 = September */
export function isHighSeasonMonth(monthIndex: number): boolean {
  return monthIndex >= 8 || monthIndex <= 2
}

/** Count how many nights of the stay fall in high vs low season. */
export function splitNightsBySeason(checkIn: Date, checkOut: Date): {
  high: number
  low: number
} {
  let high = 0
  let low = 0
  const cursor = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate())
  const end = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate())
  let guard = 0
  while (cursor.getTime() < end.getTime() && guard < 3700) {
    if (isHighSeasonMonth(cursor.getMonth())) high += 1
    else low += 1
    cursor.setDate(cursor.getDate() + 1)
    guard += 1
  }
  return { high, low }
}

export function petFeeTotal(high: number, low: number, pets: number): number {
  return (high * PET_FEE_HIGH + low * PET_FEE_LOW) * pets
}

/** Parse "YYYY-MM-DD" as a local date (avoids UTC off-by-one). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}
