import { getDb } from "./connection";
import { bookingRequests } from "@db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function createBookingRequest(data: {
  accountId?: number;
  guestName: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets: number;
  phone?: string;
  couponCode?: string;
  paymentMethod?: string;
  platformSubtotalCents?: number;
  lodgingSubtotalCents?: number;
  petFeeCents?: number;
  couponDiscountCents?: number;
  totalCents?: number;
  depositBaseCents?: number;
  paymentFeeCents?: number;
  depositDueCents?: number;
  pricingSnapshot?: string;
}) {
  const [row] = await getDb()
    .insert(bookingRequests)
    .values({
      accountId: data.accountId,
      guestName: data.guestName,
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      pets: data.pets,
      phone: data.phone,
      couponCode: data.couponCode,
      paymentMethod: data.paymentMethod,
      platformSubtotalCents: data.platformSubtotalCents,
      lodgingSubtotalCents: data.lodgingSubtotalCents,
      petFeeCents: data.petFeeCents,
      couponDiscountCents: data.couponDiscountCents,
      totalCents: data.totalCents,
      depositBaseCents: data.depositBaseCents,
      paymentFeeCents: data.paymentFeeCents,
      depositDueCents: data.depositDueCents,
      pricingSnapshot: data.pricingSnapshot,
    })
    .$returningId();
  return row.id;
}

export async function listBookingsByAccount(accountId: number) {
  return getDb().query.bookingRequests.findMany({
    where: eq(bookingRequests.accountId, accountId),
    orderBy: [desc(bookingRequests.createdAt)],
  });
}

export async function listAllBookings() {
  return getDb().query.bookingRequests.findMany({
    orderBy: [desc(bookingRequests.createdAt)],
    limit: 200,
  });
}

export async function setBookingStatus(
  id: number,
  status: "pending" | "confirmed" | "cancelled",
) {
  await getDb()
    .update(bookingRequests)
    .set({ status })
    .where(eq(bookingRequests.id, id));
}

/** Guest cancels his own booking — ownership enforced. */
export async function cancelOwnBooking(id: number, accountId: number) {
  await getDb()
    .update(bookingRequests)
    .set({ status: "cancelled" })
    .where(
      and(eq(bookingRequests.id, id), eq(bookingRequests.accountId, accountId)),
    );
}
