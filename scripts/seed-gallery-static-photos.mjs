import "dotenv/config";
import mysql from "mysql2/promise";

const STATIC_GALLERY_IMAGES = [
  { path: "/images/jardim-1.webp", alt: "Jardim com rede" },
  { path: "/images/jardim-2.webp", alt: "Jardim com rede" },
  { path: "/images/suite-luxo-4.webp", alt: "Suíte" },
  { path: "/images/cafe-1.webp", alt: "Café da manhã" },
  { path: "/images/cafe-5.webp", alt: "Café da manhã" },
  { path: "/images/cafe-3.webp", alt: "Café da manhã" },
  { path: "/images/suite-luxo-2.webp", alt: "Suíte" },
  { path: "/images/jardim-4.webp", alt: "Jardim com rede" },
  { path: "/images/marrok-6.webp", alt: "Quarto casal" },
  { path: "/images/marrok-1.webp", alt: "Quarto casal" },
  { path: "/images/marrok-11.webp", alt: "Quarto casal" },
  { path: "/images/marrok-9.webp", alt: "Quarto casal" },
  { path: "/images/suite-luxo-3.webp", alt: "Suíte" },
  { path: "/images/sonhos-1.webp", alt: "Quarto família" },
  { path: "/images/sonhos-4.webp", alt: "Quarto família" },
  { path: "/images/suite-luxo-1.webp", alt: "Suíte" },
  { path: "/images/cafe-2.webp", alt: "Café da manhã" },
  { path: "/images/marrok-5.webp", alt: "Quarto casal" },
  { path: "/images/marrok-8.webp", alt: "Quarto casal" },
  { path: "/images/sonhos-3.webp", alt: "Quarto família" },
  { path: "/images/cafe-4.webp", alt: "Café da manhã" },
];

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

if (process.env.CONFIRM_SEED_STATIC_GALLERY !== "1") {
  throw new Error("Set CONFIRM_SEED_STATIC_GALLERY=1 to insert static gallery records.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [existing] = await connection.execute("SELECT path FROM site_photos WHERE slot = ?", [
    "galeria",
  ]);
  const existingPaths = new Set(existing.map((row) => row.path));
  const rowsToInsert = STATIC_GALLERY_IMAGES
    .map((image, index) => ({ ...image, sort: index }))
    .filter((image) => !existingPaths.has(image.path));

  for (const image of rowsToInsert) {
    await connection.execute(
      "INSERT INTO site_photos (slot, path, alt, sort) VALUES (?, ?, ?, ?)",
      ["galeria", image.path, image.alt, image.sort],
    );
  }

  console.log(
    JSON.stringify(
      {
        slot: "galeria",
        inserted: rowsToInsert.length,
        skipped: STATIC_GALLERY_IMAGES.length - rowsToInsert.length,
      },
      null,
      2,
    ),
  );
} finally {
  await connection.end();
}
