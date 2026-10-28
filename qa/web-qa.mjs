// Full click-through QA of the B.Tech eKart web app (student + admin).
// Usage: node qa/web-qa.mjs [baseUrl] [--shots]
// Prints a JSON report of every step: page, expected/actual, console errors,
// failed requests and whether the page actually rendered content.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = (
  process.argv.find((a) => a.startsWith("http")) || "http://localhost:5173"
).replace(/\/$/, "");
const SHOTS = process.argv.includes("--shots");
const SHOT_DIR = path.resolve("qa/shots");
if (SHOTS) fs.mkdirSync(SHOT_DIR, { recursive: true });

const STUDENT = { email: "student@btechekart.com", password: "Student@123" };
const ADMIN = { email: "admin@btechekart.com", password: "Admin@123" };

const IGNORE_CONSOLE = [
  /Download the React DevTools/i,
  /third-party cookie/i,
  /favicon/i,
  /\[vite\] connect/i,
  /ERRSOCKET/i,
  /React Router Future Flag/i,
];

const results = [];
let shotIndex = 0;

function attach(page, bucket) {
  page.on("console", (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warning") return;
    const t = msg.text();
    if (IGNORE_CONSOLE.some((r) => r.test(t))) return;
    bucket.console.push(`[${msg.type()}] ${t.slice(0, 400)}`);
  });
  page.on("pageerror", (err) =>
    bucket.console.push(`[pageerror] ${String(err).slice(0, 400)}`),
  );
  page.on("response", (res) => {
    const url = res.url();
    if (!url.includes("/api/") && !url.startsWith(BASE)) return;
    if (res.status() >= 400)
      bucket.failed.push(
        `${res.status()} ${res.request().method()} ${url.replace(BASE, "")}`,
      );
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!url.includes("/api/")) return;
    bucket.failed.push(
      `NETFAIL ${req.method()} ${url.replace(BASE, "")} ${req.failure()?.errorText || ""}`,
    );
  });
}

async function visit(page, name, url, opts = {}) {
  const bucket = { console: [], failed: [] };
  const detach = [];
  const onConsole = (msg) => {
    if (msg.type() !== "error" && msg.type() !== "warning") return;
    const t = msg.text();
    if (IGNORE_CONSOLE.some((r) => r.test(t))) return;
    bucket.console.push(`[${msg.type()}] ${t.slice(0, 400)}`);
  };
  const onPageError = (err) =>
    bucket.console.push(`[pageerror] ${String(err).slice(0, 400)}`);
  const onResponse = (res) => {
    const u = res.url();
    if (!u.includes("/api/")) return;
    if (res.status() >= 400)
      bucket.failed.push(
        `${res.status()} ${res.request().method()} ${u.replace(BASE, "")}`,
      );
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  detach.push(() => page.off("console", onConsole));
  detach.push(() => page.off("pageerror", onPageError));
  detach.push(() => page.off("response", onResponse));

  const start = Date.now();
  let httpStatus = null;
  try {
    const resp = await page.goto(BASE + url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    httpStatus = resp?.status() ?? null;
    await page.waitForFunction(
      () =>
        (document.querySelector("#root")?.textContent || "").trim().length > 40,
      null,
      {
        timeout: opts.timeout || 25000,
      },
    );
    if (opts.waitFor)
      await page.waitForSelector(opts.waitFor, {
        timeout: opts.timeout || 25000,
      });
    await page.waitForTimeout(opts.settle ?? 900);
  } catch (e) {
    bucket.console.push(`[nav] ${String(e).slice(0, 300)}`);
  }
  const info = await page.evaluate(() => ({
    path: location.pathname,
    title: document.title,
    bodyChars: (document.querySelector("#root")?.innerText || "").length,
    text: (document.querySelector("#root")?.innerText || "")
      .replace(/\s+/g, " ")
      .slice(0, 700),
    hasLocalhostError:
      /Uncaught|Something went wrong|Cannot read|is not a function|Minified React error/i.test(
        document.querySelector("#root")?.innerText || "",
      ),
  }));
  detach.forEach((d) => d());
  let shot = null;
  if (SHOTS) {
    shotIndex += 1;
    const file = path.join(
      SHOT_DIR,
      `${String(shotIndex).padStart(2, "0")}-${name.replace(/[^a-z0-9]+/gi, "-")}.png`,
    );
    try {
      await page.screenshot({ path: file, fullPage: false });
      shot = file;
    } catch {
      /* ignore */
    }
  }
  const okText = !opts.expectText || opts.expectText.test(info.text);
  const allowed = opts.allowedErrors || [];
  const consoleLeft = bucket.console.filter(
    (c) => !allowed.some((r) => r.test(c)),
  );
  const failedLeft = bucket.failed.filter(
    (c) => !allowed.some((r) => r.test(c)),
  );
  const record = {
    step: name,
    url,
    landedOn: info.path,
    http: httpStatus,
    ms: Date.now() - start,
    title: info.title,
    bodyChars: info.bodyChars,
    okText,
    text: info.text.slice(0, 300),
    console: consoleLeft.slice(0, 8),
    failed: failedLeft.slice(0, 8),
    shot,
  };
  results.push(record);
  const flag =
    !okText || consoleLeft.length || failedLeft.length || info.bodyChars < 60
      ? "FAIL"
      : "ok  ";
  console.log(
    `${flag} ${name.padEnd(38)} ${String(record.ms).padStart(6)}ms  chars=${info.bodyChars}  ${info.path}`,
  );
  if (consoleLeft.length)
    console.log("      console:", consoleLeft.slice(0, 4).join(" | "));
  if (failedLeft.length)
    console.log("      failed :", failedLeft.slice(0, 4).join(" | "));
  if (!okText) console.log("      text   :", info.text.slice(0, 220));
  return record;
}

async function login(page, creds) {
  await page.goto(BASE + "/login/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="email"]', { timeout: 20000 });
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await Promise.all([
    page.waitForFunction(() => !location.pathname.startsWith("/login"), null, {
      timeout: 25000,
    }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1200);
  return page.evaluate(() => ({
    path: location.pathname,
    access: !!localStorage.getItem("ekart_access"),
  }));
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  // ---------------- Public store ----------------
  await visit(page, "home", "/");
  await visit(page, "shop", "/shop");
  await visit(
    page,
    "shop-filtered",
    "/shop?branch=CSE&semester=3&sort=price_asc",
  );
  await visit(page, "blog-list", "/blog");
  await visit(page, "about", "/about");
  await visit(page, "contact", "/contact");
  await visit(page, "terms", "/terms");
  await visit(page, "privacy", "/privacy");
  await visit(page, "refund-policy", "/refund-policy");
  await visit(page, "disclaimer", "/disclaimer");
  await visit(page, "404", "/definitely-not-a-page");

  // product detail: find a real slug from the shop page
  await visit(page, "shop-for-slug", "/shop");
  const slug = await page.evaluate(() => {
    const a = Array.from(
      document.querySelectorAll('a[href^="/product/"]'),
    ).find((el) => /\/product\/[^/]+$/.test(el.getAttribute("href")));
    return a ? a.getAttribute("href") : null;
  });
  if (slug) {
    await visit(page, "product-detail", slug);
  } else {
    results.push({
      step: "product-detail",
      error: "no product link found on /shop",
    });
    console.log("FAIL product-detail: no product link on /shop");
  }

  // blog detail
  await visit(page, "blog-for-slug", "/blog");
  const blogSlug = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll('a[href^="/blog/"]')).find(
      (el) => /\/blog\/[^/]+$/.test(el.getAttribute("href")),
    );
    return a ? a.getAttribute("href") : null;
  });
  if (blogSlug) await visit(page, "blog-detail", blogSlug);

  // ---------------- Guest shopping ----------------
  if (slug) {
    await visit(page, "guest-add-to-cart", slug);
    const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
    if (await addBtn.count()) {
      await addBtn.click();
      await page.waitForTimeout(900);
      const guestCart = await page.evaluate(() =>
        localStorage.getItem("ekart_guest_cart"),
      );
      console.log(`     guest cart -> ${guestCart}`);
    } else {
      console.log("FAIL guest-add-to-cart: Add to Cart button not found");
    }
  }
  await visit(page, "cart-guest", "/cart");
  await visit(page, "wishlist-guest", "/wishlist");
  await visit(page, "checkout-guard-guest", "/checkout");
  await visit(page, "library-guard-guest", "/library");
  await visit(page, "admin-guard-guest", "/admin");

  // ---------------- Student ----------------
  const studentLogin = await login(page, STUDENT);
  console.log(`     student login -> ${JSON.stringify(studentLogin)}`);
  results.push({ step: "student-login", ...studentLogin });

  await visit(page, "home-signedin", "/");
  await visit(page, "cart", "/cart");
  await visit(page, "wishlist", "/wishlist");
  await visit(page, "checkout", "/checkout");
  await visit(page, "orders", "/orders");
  await visit(page, "library", "/library");
  await visit(page, "profile", "/profile");
  await visit(page, "notifications", "/notifications");
  await visit(page, "student-in-admin", "/admin");

  // order detail (first order)
  await visit(page, "orders-for-detail", "/orders");
  const orderHref = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll('a[href*="/orders/"]'))[0];
    return a ? a.getAttribute("href") : null;
  });
  if (orderHref) await visit(page, "order-detail", orderHref);
  else console.log("FAIL order-detail: no /orders/<id> link found");

  // ---------------- Admin ----------------
  await page.evaluate(() => localStorage.clear());
  const adminLogin = await login(page, ADMIN);
  console.log(`     admin login -> ${JSON.stringify(adminLogin)}`);
  results.push({ step: "admin-login", ...adminLogin });

  const adminPages = [
    ["admin-overview", "/admin"],
    ["admin-customers", "/admin/customers"],
    ["admin-orders", "/admin/orders"],
    ["admin-products", "/admin/products"],
    ["admin-taxonomy", "/admin/taxonomy"],
    ["admin-coupons", "/admin/coupons"],
    ["admin-banners", "/admin/banners"],
    ["admin-reviews", "/admin/reviews"],
    ["admin-blog", "/admin/blog"],
    ["admin-settings", "/admin/settings"],
  ];
  for (const [name, url] of adminPages) await visit(page, name, url);

  // admin customer detail
  await visit(page, "admin-customers-for-detail", "/admin/customers");
  const custHref = await page.evaluate(() => {
    const a = Array.from(
      document.querySelectorAll('a[href^="/admin/customers/"]'),
    )[0];
    return a ? a.getAttribute("href") : null;
  });
  if (custHref) await visit(page, "admin-customer-detail", custHref);

  // admin order detail
  await visit(page, "admin-orders-for-detail", "/admin/orders");
  const aoHref = await page.evaluate(() => {
    const a = Array.from(
      document.querySelectorAll('a[href^="/admin/orders/"]'),
    )[0];
    return a ? a.getAttribute("href") : null;
  });
  if (aoHref) await visit(page, "admin-order-detail", aoHref);

  // ---------------- Responsive smoke ----------------
  for (const [w, h, label] of [
    [360, 780, "mobile-360"],
    [768, 900, "tablet-768"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    const rec = await visit(page, `home-${label}`, "/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    rec.horizontalOverflow = overflow;
    console.log(`     ${label} horizontal overflow = ${overflow}px`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // logout
  await visit(page, "logout-check", "/");
  const logoutOk = await page.evaluate(async () => {
    localStorage.removeItem("ekart_access");
    localStorage.removeItem("ekart_refresh");
    return true;
  });

  fs.writeFileSync(
    path.resolve("qa/web-qa-report.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();

  const fails = results.filter(
    (r) =>
      r.error ||
      r.okText === false ||
      (r.console && r.console.length) ||
      (r.failed && r.failed.length) ||
      (r.bodyChars !== undefined && r.bodyChars < 60),
  );
  console.log(
    `\n==== ${results.length} steps, ${fails.length} with issues ====`,
  );
  fails.forEach((f) =>
    console.log(
      `- ${f.step}: ${f.error || ""} ${f.okText === false ? "TEXT-MISMATCH " : ""}${(f.console || []).join(" | ")} ${(f.failed || []).join(" | ")}`,
    ),
  );
  process.exit(0);
})();
