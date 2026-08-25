import mysql from "mysql2/promise";

export const REQUIRED_SCHEMA = {
  users: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      unionId: "VARCHAR(255) NOT NULL",
      name: "VARCHAR(255) NULL",
      email: "VARCHAR(320) NULL",
      avatar: "TEXT NULL",
      role: "ENUM('user','admin') NOT NULL DEFAULT 'user'",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
      updatedAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
      lastSignInAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`unionId\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(255) NULL,
        \`email\` VARCHAR(320) NULL,
        \`avatar\` TEXT NULL,
        \`role\` ENUM('user','admin') NOT NULL DEFAULT 'user',
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`lastSignInAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`users_unionId_unique\` (\`unionId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [
      { name: "users_unionId_unique", unique: true, columns: ["unionId"] },
    ],
  },
  guest_accounts: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      username: "VARCHAR(64) NOT NULL",
      passwordHash: "VARCHAR(255) NOT NULL",
      fullName: "VARCHAR(255) NOT NULL",
      phone: "VARCHAR(32) NOT NULL",
      email: "VARCHAR(320) NULL",
      age: "INT NOT NULL DEFAULT 0",
      hasPet: "BOOLEAN NOT NULL DEFAULT FALSE",
      gender: "ENUM('male','female','other') NULL",
      petName: "VARCHAR(64) NULL",
      petBreed: "VARCHAR(64) NULL",
      petAge: "INT NULL",
      referralCode: "VARCHAR(16) NOT NULL",
      referredByCode: "VARCHAR(16) NULL",
      hasLifetimeDiscount: "BOOLEAN NOT NULL DEFAULT FALSE",
      role: "ENUM('user','admin') NOT NULL DEFAULT 'user'",
      isActive: "BOOLEAN NOT NULL DEFAULT TRUE",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`guest_accounts\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`username\` VARCHAR(64) NOT NULL,
        \`passwordHash\` VARCHAR(255) NOT NULL,
        \`fullName\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(32) NOT NULL,
        \`email\` VARCHAR(320) NULL,
        \`age\` INT NOT NULL DEFAULT 0,
        \`hasPet\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`gender\` ENUM('male','female','other') NULL,
        \`petName\` VARCHAR(64) NULL,
        \`petBreed\` VARCHAR(64) NULL,
        \`petAge\` INT NULL,
        \`referralCode\` VARCHAR(16) NOT NULL,
        \`referredByCode\` VARCHAR(16) NULL,
        \`hasLifetimeDiscount\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`role\` ENUM('user','admin') NOT NULL DEFAULT 'user',
        \`isActive\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`guest_accounts_username_unique\` (\`username\`),
        UNIQUE KEY \`guest_accounts_referralCode_unique\` (\`referralCode\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [
      {
        name: "guest_accounts_username_unique",
        unique: true,
        columns: ["username"],
      },
      {
        name: "guest_accounts_referralCode_unique",
        unique: true,
        columns: ["referralCode"],
      },
    ],
  },
  guest_sessions: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      token: "VARCHAR(64) NOT NULL",
      accountId: "BIGINT UNSIGNED NOT NULL",
      expiresAt: "TIMESTAMP NOT NULL",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`guest_sessions\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`token\` VARCHAR(64) NOT NULL,
        \`accountId\` BIGINT UNSIGNED NOT NULL,
        \`expiresAt\` TIMESTAMP NOT NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`guest_sessions_token_unique\` (\`token\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [
      { name: "guest_sessions_token_unique", unique: true, columns: ["token"] },
    ],
  },
  reviews: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      accountId: "BIGINT UNSIGNED NULL",
      authorName: "VARCHAR(255) NOT NULL",
      rating: "INT NOT NULL",
      text: "TEXT NOT NULL",
      source: "ENUM('site','booking') NOT NULL DEFAULT 'site'",
      status:
        "ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`accountId\` BIGINT UNSIGNED NULL,
        \`authorName\` VARCHAR(255) NOT NULL,
        \`rating\` INT NOT NULL,
        \`text\` TEXT NOT NULL,
        \`source\` ENUM('site','booking') NOT NULL DEFAULT 'site',
        \`status\` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [],
  },
  referrals: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      referrerAccountId: "BIGINT UNSIGNED NOT NULL",
      guestName: "VARCHAR(255) NOT NULL",
      checkIn: "DATE NULL",
      checkOut: "DATE NULL",
      status: "ENUM('pending','confirmed') NOT NULL DEFAULT 'pending'",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`referrals\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`referrerAccountId\` BIGINT UNSIGNED NOT NULL,
        \`guestName\` VARCHAR(255) NOT NULL,
        \`checkIn\` DATE NULL,
        \`checkOut\` DATE NULL,
        \`status\` ENUM('pending','confirmed') NOT NULL DEFAULT 'pending',
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [],
  },
  settings: {
    columns: {
      key: "VARCHAR(64) NOT NULL",
      value: "TEXT NOT NULL",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`settings\` (
        \`key\` VARCHAR(64) NOT NULL,
        \`value\` TEXT NOT NULL,
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [],
  },
  booking_requests: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      accountId: "BIGINT UNSIGNED NULL",
      guestName: "VARCHAR(255) NOT NULL",
      roomId: "VARCHAR(32) NOT NULL",
      checkIn: "DATE NOT NULL",
      checkOut: "DATE NOT NULL",
      guests: "INT NOT NULL",
      pets: "INT NOT NULL DEFAULT 0",
      phone: "VARCHAR(64) NULL",
      couponCode: "VARCHAR(64) NULL",
      paymentMethod: "VARCHAR(16) NULL",
      platformSubtotalCents: "INT NOT NULL DEFAULT 0",
      lodgingSubtotalCents: "INT NOT NULL DEFAULT 0",
      petFeeCents: "INT NOT NULL DEFAULT 0",
      couponDiscountCents: "INT NOT NULL DEFAULT 0",
      totalCents: "INT NOT NULL DEFAULT 0",
      depositBaseCents: "INT NOT NULL DEFAULT 0",
      paymentFeeCents: "INT NOT NULL DEFAULT 0",
      depositDueCents: "INT NOT NULL DEFAULT 0",
      pricingSnapshot: "TEXT NULL",
      status:
        "ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending'",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`booking_requests\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`accountId\` BIGINT UNSIGNED NULL,
        \`guestName\` VARCHAR(255) NOT NULL,
        \`roomId\` VARCHAR(32) NOT NULL,
        \`checkIn\` DATE NOT NULL,
        \`checkOut\` DATE NOT NULL,
        \`guests\` INT NOT NULL,
        \`pets\` INT NOT NULL DEFAULT 0,
        \`phone\` VARCHAR(64) NULL,
        \`couponCode\` VARCHAR(64) NULL,
        \`paymentMethod\` VARCHAR(16) NULL,
        \`platformSubtotalCents\` INT NOT NULL DEFAULT 0,
        \`lodgingSubtotalCents\` INT NOT NULL DEFAULT 0,
        \`petFeeCents\` INT NOT NULL DEFAULT 0,
        \`couponDiscountCents\` INT NOT NULL DEFAULT 0,
        \`totalCents\` INT NOT NULL DEFAULT 0,
        \`depositBaseCents\` INT NOT NULL DEFAULT 0,
        \`paymentFeeCents\` INT NOT NULL DEFAULT 0,
        \`depositDueCents\` INT NOT NULL DEFAULT 0,
        \`pricingSnapshot\` TEXT NULL,
        \`status\` ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [],
  },
  suite_date_prices: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      roomId: "VARCHAR(32) NOT NULL",
      date: "DATE NOT NULL",
      price: "INT NOT NULL",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`suite_date_prices\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`roomId\` VARCHAR(32) NOT NULL,
        \`date\` DATE NOT NULL,
        \`price\` INT NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [],
  },
  suite_date_min_nights: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      roomId: "VARCHAR(32) NOT NULL",
      date: "DATE NOT NULL",
      minNights: "INT NULL",
      maxNights: "INT NULL",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`suite_date_min_nights\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`roomId\` VARCHAR(32) NOT NULL,
        \`date\` DATE NOT NULL,
        \`minNights\` INT NULL,
        \`maxNights\` INT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [],
  },
  site_photos: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      slot: "VARCHAR(64) NOT NULL DEFAULT ''",
      path: "VARCHAR(255) NOT NULL DEFAULT ''",
      alt: "VARCHAR(255) NOT NULL DEFAULT ''",
      sort: "INT NOT NULL DEFAULT 0",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`site_photos\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`slot\` VARCHAR(64) NOT NULL DEFAULT '',
        \`path\` VARCHAR(255) NOT NULL DEFAULT '',
        \`alt\` VARCHAR(255) NOT NULL DEFAULT '',
        \`sort\` INT NOT NULL DEFAULT 0,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [
      {
        name: "site_photos_slot_idx",
        unique: false,
        columns: ["slot", "sort", "id"],
      },
    ],
  },
  blocked_dates: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      roomId: "VARCHAR(32) NOT NULL DEFAULT 'marrok'",
      date: "DATE NOT NULL DEFAULT '1970-01-01'",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`blocked_dates\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`roomId\` VARCHAR(32) NOT NULL DEFAULT 'marrok',
        \`date\` DATE NOT NULL DEFAULT '1970-01-01',
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [
      {
        name: "blocked_dates_room_date_unique",
        unique: true,
        columns: ["roomId", "date"],
      },
    ],
  },
  admin_tokens: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      token: "VARCHAR(64) NOT NULL",
      expiresAt: "TIMESTAMP NOT NULL",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`admin_tokens\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`token\` VARCHAR(64) NOT NULL,
        \`expiresAt\` TIMESTAMP NOT NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`admin_tokens_token_unique\` (\`token\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [
      { name: "admin_tokens_token_unique", unique: true, columns: ["token"] },
    ],
  },
  password_resets: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      email: "VARCHAR(320) NOT NULL",
      token: "VARCHAR(64) NOT NULL",
      expiresAt: "TIMESTAMP NOT NULL",
      used: "BOOLEAN NOT NULL DEFAULT FALSE",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`password_resets\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`email\` VARCHAR(320) NOT NULL,
        \`token\` VARCHAR(64) NOT NULL,
        \`expiresAt\` TIMESTAMP NOT NULL,
        \`used\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`password_resets_token_unique\` (\`token\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [
      {
        name: "password_resets_token_unique",
        unique: true,
        columns: ["token"],
      },
    ],
  },
  coupons: {
    columns: {
      id: "BIGINT UNSIGNED NOT NULL AUTO_INCREMENT",
      code: "VARCHAR(64) NOT NULL DEFAULT ''",
      percent: "INT NOT NULL DEFAULT 1",
      active: "BOOLEAN NOT NULL DEFAULT TRUE",
      validFrom: "DATE NULL",
      validUntil: "DATE NULL",
      createdAt: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    },
    create: `
      CREATE TABLE IF NOT EXISTS \`coupons\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`code\` VARCHAR(64) NOT NULL DEFAULT '',
        \`percent\` INT NOT NULL DEFAULT 1,
        \`active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`validFrom\` DATE NULL,
        \`validUntil\` DATE NULL,
        \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`coupons_code_unique\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    indexes: [{ name: "coupons_code_unique", unique: true, columns: ["code"] }],
  },
};

export async function createConnectionFromEnv() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for database migration");
  return mysql.createConnection(url);
}

export async function tableExists(connection, table) {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", [table]);
  return Array.isArray(rows) && rows.length > 0;
}

export async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
    [column]
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function columnMeta(connection, table, column) {
  const [rows] = await connection.query(
    `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
    [column]
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function indexExists(connection, table, indexName) {
  const [rows] = await connection.query(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = ?`,
    [indexName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function ensureColumn(connection, table, column, definition) {
  if (await columnExists(connection, table, column)) return false;
  await connection.query(
    `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`
  );
  return true;
}

export async function ensureIndex(connection, table, index) {
  if (await indexExists(connection, table, index.name)) return false;
  const unique = index.unique ? "UNIQUE " : "";
  const columns = index.columns.map(column => `\`${column}\``).join(", ");
  await connection.query(
    `CREATE ${unique}INDEX \`${index.name}\` ON \`${table}\` (${columns})`
  );
  return true;
}

export async function normalizeSettingsValue(connection) {
  const meta = await columnMeta(connection, "settings", "value");
  if (!meta) return false;
  const type = String(meta.Type).toLowerCase();
  const nullable = String(meta.Null).toUpperCase() === "YES";
  if (type === "text" && !nullable) return false;
  await connection.query(
    "UPDATE `settings` SET `value` = '' WHERE `value` IS NULL"
  );
  await connection.query(
    "ALTER TABLE `settings` MODIFY COLUMN `value` TEXT NOT NULL"
  );
  return true;
}

export async function dedupeBlockedDates(connection) {
  const [duplicates] = await connection.query(`
    SELECT roomId, date, COUNT(*) AS count, MIN(id) AS keepId
    FROM blocked_dates
    GROUP BY roomId, date
    HAVING COUNT(*) > 1
  `);
  if (!Array.isArray(duplicates) || duplicates.length === 0) return 0;
  for (const row of duplicates) {
    await connection.execute(
      "DELETE FROM blocked_dates WHERE roomId = ? AND date = ? AND id <> ?",
      [row.roomId, row.date, row.keepId]
    );
  }
  return duplicates.length;
}
