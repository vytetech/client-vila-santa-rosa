export type RoomId = "luxo" | "marrok" | "sonhos";

/**
 * Reference nightly rate (before the 5% direct-booking discount).
 * Update this single number and the whole site recalculates automatically.
 */
export const BASE_NIGHTLY = 420;

/** Direct-booking discount — 0.05 = 5% */
export const DIRECT_DISCOUNT = 0.05;

export const ROOM_DATA: { id: RoomId; maxGuests: number }[] = [
  { id: "luxo", maxGuests: 2 },
  { id: "marrok", maxGuests: 2 },
  { id: "sonhos", maxGuests: 2 },
];

export const ROOM_IMAGES: Record<RoomId, string> = {
  luxo: "/images/suite-luxo-2.webp",
  marrok: "/images/marrok-6.webp",
  sonhos: "/images/sonhos-1.webp",
};

export const ROOM_FALLBACK_IMAGES: Record<RoomId, string[]> = {
  luxo: [
    "/images/suite-luxo-2.webp",
    "/images/suite-luxo-1.webp",
    "/images/suite-luxo-3.webp",
    "/images/suite-luxo-4.webp",
  ],
  marrok: [
    "/images/marrok-6.webp",
    "/images/marrok-1.webp",
    "/images/marrok-2.webp",
    "/images/marrok-3.webp",
    "/images/marrok-4.webp",
    "/images/marrok-5.webp",
    "/images/marrok-7.webp",
    "/images/marrok-8.webp",
    "/images/marrok-9.webp",
    "/images/marrok-10.webp",
    "/images/marrok-11.webp",
  ],
  sonhos: [
    "/images/sonhos-1.webp",
    "/images/sonhos-2.webp",
    "/images/sonhos-3.webp",
    "/images/sonhos-4.webp",
    "/images/sonhos-5.webp",
    "/images/sonhos-6.webp",
    "/images/sonhos-7.webp",
  ],
};

/** WhatsApp numbers (international format) */
export const WHATSAPP_PRIMARY = "5511986981444";
export const WHATSAPP_SECONDARY = "5512988051401";

/** Instagram profile */
export const INSTAGRAM_URL = "https://www.instagram.com/vilasantarosa14";
