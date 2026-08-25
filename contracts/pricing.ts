export const PLATFORM_DISCOUNT_BPS = 500;
export const PAYMENT_FEE_BPS = 799;

export type PaymentMethod = "pix" | "card" | "paypal";

export type NightlyDirectPrice = {
  date: string;
  price: number;
};

export type PricingInput = {
  nightlyDirectPrices: NightlyDirectPrice[];
  pets: number;
  petFee: number;
  couponPercent?: number | null;
  paymentMethod?: PaymentMethod | null;
};

export type NightlyPricingLine = {
  date: string;
  directCents: number;
  platformCents: number;
};

export type BookingPricing = {
  nights: number;
  lines: NightlyPricingLine[];
  platformSubtotalCents: number;
  lodgingSubtotalCents: number;
  petFeeCents: number;
  couponDiscountCents: number;
  totalCents: number;
  directSavingsCents: number;
  depositBaseCents: number;
  paymentFeeCents: number;
  depositDueCents: number;
};

export function reaisToCents(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function centsToReais(value: number) {
  return Math.round(value / 100);
}

export function basisPointsOfCents(amountCents: number, basisPoints: number) {
  return Math.floor((amountCents * basisPoints + 5_000) / 10_000);
}

export function percentOfCents(amountCents: number, percent: number) {
  return Math.floor((amountCents * percent + 50) / 100);
}

export function platformReferenceFromDirect(directCents: number) {
  return Math.round(directCents / (1 - PLATFORM_DISCOUNT_BPS / 10_000));
}

export function paymentFeeApplies(method?: PaymentMethod | null) {
  return method === "card" || method === "paypal";
}

export function calculateBookingPricing(input: PricingInput): BookingPricing {
  const lines = input.nightlyDirectPrices.map((night) => {
    const directCents = reaisToCents(night.price);
    return {
      date: night.date,
      directCents,
      platformCents: platformReferenceFromDirect(directCents),
    };
  });

  const lodgingSubtotalCents = sum(lines.map((line) => line.directCents));
  const platformSubtotalCents = sum(lines.map((line) => line.platformCents));
  const petFeeCents = reaisToCents(input.pets > 0 ? input.petFee : 0);
  const couponPercent =
    input.couponPercent && input.couponPercent > 0 ? Math.trunc(input.couponPercent) : 0;
  const couponDiscountCents =
    couponPercent > 0 ? percentOfCents(lodgingSubtotalCents + petFeeCents, couponPercent) : 0;
  const totalCents = Math.max(0, lodgingSubtotalCents + petFeeCents - couponDiscountCents);
  const depositBaseCents = Math.floor((totalCents + 1) / 2);
  const paymentFeeCents = paymentFeeApplies(input.paymentMethod)
    ? basisPointsOfCents(depositBaseCents, PAYMENT_FEE_BPS)
    : 0;

  return {
    nights: lines.length,
    lines,
    platformSubtotalCents,
    lodgingSubtotalCents,
    petFeeCents,
    couponDiscountCents,
    totalCents,
    directSavingsCents: Math.max(0, platformSubtotalCents - lodgingSubtotalCents),
    depositBaseCents,
    paymentFeeCents,
    depositDueCents: depositBaseCents + paymentFeeCents,
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
