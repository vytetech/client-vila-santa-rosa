import { chromium, devices } from "playwright";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const baseUrl = process.env.PUBLIC_PHOTOS_BASE_URL || "http://localhost:3000";
const uploadOrigin = process.env.PUBLIC_PHOTOS_UPLOAD_ORIGIN || baseUrl;
const expectedJardimPath = process.env.EXPECTED_JARDIM_PATH || "";
const slots = ["hero", "galeria", "jardim"];
const fixtureRows = process.env.PUBLIC_PHOTOS_FIXTURE
  ? JSON.parse(process.env.PUBLIC_PHOTOS_FIXTURE)
  : null;

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: `${baseUrl.replace(/\/$/, "")}/api/trpc`,
      transformer: superjson,
    }),
  ],
});

async function fetchSlot(slot) {
  return client.photos.list.query({ slot });
}

async function assertSectionImages(page, slot, rows) {
  const locator = page.locator(`[data-photo-slot="${slot}"]`);
  await locator.first().waitFor({ state: "attached", timeout: 20_000 });

  const count = await locator.count();
  if (count < 1) {
    throw new Error(`No public image found for slot ${slot}`);
  }

  const expectedDynamicRows = rows.filter((row) => row.path.startsWith("/images/uploads/"));
  if (expectedDynamicRows.length > 0) {
    const renderedSources = await locator.evaluateAll((images) =>
      images.map((image) => new URL(image.currentSrc || image.src, window.location.origin).pathname),
    );
    for (const row of expectedDynamicRows) {
      if (!renderedSources.includes(row.path)) {
        throw new Error(`Slot ${slot} did not render dynamic image ${row.path}`);
      }
    }
    if (slot === "galeria") {
      const renderedKinds = await locator.evaluateAll((images) =>
        images.map((image) => ({
          src: new URL(image.currentSrc || image.src, window.location.origin).pathname,
          source: image.getAttribute("data-photo-source"),
        })),
      );
      const invalid = renderedKinds.filter(
        (image) => image.source !== "dynamic" || !image.src.startsWith("/images/uploads/"),
      );
      if (invalid.length > 0) {
        throw new Error(`Gallery mixed dynamic photos with fallback/static images: ${JSON.stringify(invalid)}`);
      }
    }
  }

  for (let index = 0; index < count; index += 1) {
    const image = locator.nth(index);
    await image.evaluate((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("image load timeout")), 15_000);
        img.addEventListener(
          "load",
          () => {
            window.clearTimeout(timeout);
            resolve(undefined);
          },
          { once: true },
        );
        img.addEventListener(
          "error",
          () => {
            window.clearTimeout(timeout);
            reject(new Error("image load error"));
          },
          { once: true },
        );
      });
    });
    const dimensions = await image.evaluate((img) => ({
      src: img.currentSrc || img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));
    if (dimensions.naturalWidth <= 0 || dimensions.naturalHeight <= 0) {
      throw new Error(`Image for slot ${slot} did not load: ${dimensions.src}`);
    }

    const imageUrl = new URL(dimensions.src);
    const requestUrl =
      fixtureRows && imageUrl.pathname.startsWith("/images/uploads/")
        ? new URL(imageUrl.pathname, uploadOrigin).toString()
        : dimensions.src;
    const response = await page.request.get(requestUrl);
    if (response.status() !== 200) {
      throw new Error(`Image request failed for slot ${slot}: ${response.status()} ${dimensions.src}`);
    }
  }
}

const apiRows =
  fixtureRows ??
  Object.fromEntries(await Promise.all(slots.map(async (slot) => [slot, await fetchSlot(slot)])));

if (expectedJardimPath && !apiRows.jardim.some((row) => row.path === expectedJardimPath)) {
  throw new Error(`photos.list({ slot: "jardim" }) did not return ${expectedJardimPath}`);
}

for (const [name, options] of [
  ["desktop", { viewport: { width: 1365, height: 768 } }],
  ["mobile", devices["iPhone 12"]],
]) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const consoleErrors = [];
  const http500 = [];
  const asset404 = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();
    if (status >= 500) http500.push(`${status} ${url}`);
    if (status === 404 && /\.(?:js|css|png|webp|jpg|jpeg|svg|ico|webmanifest)(?:\?|$)/i.test(url)) {
      asset404.push(url);
    }
  });

  if (fixtureRows) {
    await page.route("**/images/uploads/**", async (route) => {
      const sourceUrl = new URL(new URL(route.request().url()).pathname, uploadOrigin).toString();
      const response = await page.request.get(sourceUrl);
      return route.fulfill({
        status: response.status(),
        contentType: response.headers()["content-type"] ?? "image/jpeg",
        body: await response.body(),
      });
    });

    await page.route("**/api/trpc/**", async (route) => {
      const url = new URL(route.request().url());
      if (!url.pathname.includes("photos.list")) {
        return route.fallback();
      }

      const procedures = url.pathname
        .split("/")
        .pop()
        .split(",")
        .filter(Boolean);
      const input = JSON.parse(url.searchParams.get("input") ?? "{}");
      const response = procedures.map((procedure, index) => {
        if (procedure !== "photos.list") {
          return { result: { data: { json: null } } };
        }
        const slot = input[String(index)]?.json?.slot;
        return {
          result: {
            data: {
              json: fixtureRows[slot] ?? [],
            },
          },
        };
      });

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });
  }

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.locator("#jardim").scrollIntoViewIfNeeded();

  for (const slot of slots) {
    await assertSectionImages(page, slot, apiRows[slot]);
  }

  await browser.close();

  if (consoleErrors.length || http500.length || asset404.length) {
    throw new Error(
      `${name} public photo check failed:\n${JSON.stringify({ consoleErrors, http500, asset404 }, null, 2)}`,
    );
  }

  console.log(`${name}: public photo integration OK`);
}

console.log(JSON.stringify(apiRows, null, 2));
