import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
  date,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ---------------- Guest accounts (username/password) ---------------- */

export const guestAccounts = mysqlTable("guest_accounts", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 320 }),
  age: int("age").notNull(),
  hasPet: boolean("hasPet").default(false).notNull(),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  petName: varchar("petName", { length: 64 }),
  petBreed: varchar("petBreed", { length: 64 }),
  petAge: int("petAge"),
  referralCode: varchar("referralCode", { length: 16 }).notNull().unique(),
  referredByCode: varchar("referredByCode", { length: 16 }),
  hasLifetimeDiscount: boolean("hasLifetimeDiscount").default(false).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GuestAccount = typeof guestAccounts.$inferSelect;
export type InsertGuestAccount = typeof guestAccounts.$inferInsert;

export const guestSessions = mysqlTable("guest_sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GuestSession = typeof guestSessions.$inferSelect;

/* ---------------- Reviews (owner-approved) ---------------- */

export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  /** Null for Booking.com highlights added manually by the owner. */
  accountId: bigint("accountId", { mode: "number", unsigned: true }),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  /** 1..5 for site reviews · 1..10 for Booking.com highlights */
  rating: int("rating").notNull(),
  text: text("text").notNull(),
  source: mysqlEnum("source", ["site", "booking"]).default("site").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

/* ---------------- Referrals (owner-confirmed) ---------------- */

export const referrals = mysqlTable("referrals", {
  id: serial("id").primaryKey(),
  referrerAccountId: bigint("referrerAccountId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  checkIn: date("checkIn", { mode: "string" }),
  checkOut: date("checkOut", { mode: "string" }),
  status: mysqlEnum("status", ["pending", "confirmed"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;

/* ---------------- Site settings (key-value) ---------------- */

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});

export type Setting = typeof settings.$inferSelect;

/* ---------------- Booking requests ---------------- */

export const bookingRequests = mysqlTable("booking_requests", {
  id: serial("id").primaryKey(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  roomId: varchar("roomId", { length: 32 }).notNull(),
  checkIn: date("checkIn", { mode: "string" }).notNull(),
  checkOut: date("checkOut", { mode: "string" }).notNull(),
  guests: int("guests").notNull(),
  pets: int("pets").default(0).notNull(),
  phone: varchar("phone", { length: 64 }),
  couponCode: varchar("couponCode", { length: 64 }),
  paymentMethod: varchar("paymentMethod", { length: 16 }),
  platformSubtotalCents: int("platformSubtotalCents").default(0).notNull(),
  lodgingSubtotalCents: int("lodgingSubtotalCents").default(0).notNull(),
  petFeeCents: int("petFeeCents").default(0).notNull(),
  couponDiscountCents: int("couponDiscountCents").default(0).notNull(),
  totalCents: int("totalCents").default(0).notNull(),
  depositBaseCents: int("depositBaseCents").default(0).notNull(),
  paymentFeeCents: int("paymentFeeCents").default(0).notNull(),
  depositDueCents: int("depositDueCents").default(0).notNull(),
  pricingSnapshot: text("pricingSnapshot"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingRequest = typeof bookingRequests.$inferSelect;

/* ---------------- Per-date suite prices (owner-managed) ---------------- */

export const suiteDatePrices = mysqlTable("suite_date_prices", {
  id: serial("id").primaryKey(),
  roomId: varchar("roomId", { length: 32 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  price: int("price").notNull(),
});

export type SuiteDatePrice = typeof suiteDatePrices.$inferSelect;

/* ---------------- Per-date minimum nights (owner-managed) ---------------- */

export const suiteDateMinNights = mysqlTable("suite_date_min_nights", {
  id: serial("id").primaryKey(),
  roomId: varchar("roomId", { length: 32 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  minNights: int("minNights"),
  maxNights: int("maxNights"),
});

export type SuiteDateMinNights = typeof suiteDateMinNights.$inferSelect;

/* ---------------- Site photos (admin-managed) ---------------- */

export const sitePhotos = mysqlTable("site_photos", {
  id: serial("id").primaryKey(),
  /** Grupo/posição no site: hero, galeria, quartos, cafe… */
  slot: varchar("slot", { length: 64 }).notNull(),
  /** Caminho público: /images/uploads/arquivo.jpg */
  path: varchar("path", { length: 255 }).notNull(),
  alt: varchar("alt", { length: 255 }).default("").notNull(),
  sort: int("sort").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SitePhoto = typeof sitePhotos.$inferSelect;

/* ---------------- Blocked dates (admin closes manually) ---------------- */

export const blockedDates = mysqlTable(
  "blocked_dates",
  {
    id: serial("id").primaryKey(),
    roomId: varchar("roomId", { length: 32 }).notNull(),
    date: date("date", { mode: "string" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("blocked_dates_room_date_unique").on(table.roomId, table.date),
  ]
);

export type BlockedDate = typeof blockedDates.$inferSelect;

/* ---------------- Admin magic-link tokens ---------------- */

export const adminTokens = mysqlTable("admin_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminToken = typeof adminTokens.$inferSelect;

/* ---------------- Password reset tokens ---------------- */

export const passwordResets = mysqlTable("password_resets", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordReset = typeof passwordResets.$inferSelect;

/* ---------------- Discount coupons (owner-created) ---------------- */

export const coupons = mysqlTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  /** Discount percentage, 1..90 */
  percent: int("percent").notNull(),
  active: boolean("active").default(true).notNull(),
  /** Calendar date. NULL means valid immediately. */
  validFrom: date("validFrom", { mode: "string" }),
  /** Calendar date. NULL means no expiration date. */
  validUntil: date("validUntil", { mode: "string" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
