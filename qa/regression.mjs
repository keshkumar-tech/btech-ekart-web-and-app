// Regression for the fixes: checkout renders, Go-to-Cart swap, token refresh,
// payment settings, coupon columns, buyer-only reviews.
import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const API = "http://127.0.0.1:8000";
const out = [];
const note = (name, ok, detail = "") => {
  out.push({ name, ok, detail });
  console.log(
    `${ok ? "ok  " : "FAIL"} ${name}${detail ? "  -> " + detail : ""}`,
  );
};

// ---------- API level ----------
async function api(path, opts = {}) {
  const r = await fetch(API + path, opts);
  return { status: r.status, data: await r.json().catch(() => null) };
}
const login = await api("/api/auth/login/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "student@btechekart.com",
    password: "Student@123",
  }),
});
const tok = login.data.access;

const refresh = await api("/api/auth/token/refresh/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refresh: login.data.refresh }),
});
note(
  "token refresh endpoint",
  refresh.status === 200 && !!refresh.data?.access,
  String(refresh.status),
);

const paySettings = await api("/api/payments/settings/");
note(
  "payment settings endpoint",
  paySettings.status === 200,
  `qr=${!!paySettings.data?.upi_qr_image} manual=${paySettings.data?.manual_qr_enabled}`,
);

const nonBuyer = await api("/api/reviews/product/whatever/", {});
// use a real product slug the student has not bought
const prods = await api("/api/catalog/products/?page_size=20");
const mine = await api("/api/library/", {
  headers: { Authorization: `Bearer ${tok}` },
});
const owned = new Set((mine.data?.results || []).map((i) => i.title));
const fresh = (prods.data?.results || []).find((p) => !owned.has(p.title));
const rev = await api(`/api/reviews/product/${fresh.slug}/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${tok}`,
  },
  body: JSON.stringify({
    product: fresh.id,
    rating: 5,
    comment: "should be blocked",
  }),
});
note(
  "non-buyer review blocked",
  rev.status === 403,
  `${rev.status} ${rev.data?.detail || ""}`,
);

// ---------- UI level ----------
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const consoleErrors = [];
p.on("console", (m) => {
  if (m.type() === "error" && !/Future Flag|DevTools|favicon/i.test(m.text()))
    consoleErrors.push(m.text().slice(0, 220));
});
p.on("pageerror", (e) =>
  consoleErrors.push("PAGEERROR " + String(e).slice(0, 220)),
);

// login through the UI so localStorage holds real tokens
await p.goto(BASE + "/login/", { waitUntil: "domcontentloaded" });
await p.fill('input[type="email"]', "student@btechekart.com");
await p.fill('input[type="password"]', "Student@123");
await p.click('button[type="submit"]');
await p.waitForTimeout(2500);

// clear the cart first so the Go-to-Cart test is deterministic
await p.evaluate(async () => {
  const t = localStorage.getItem("ekart_access");
  await fetch("/api/cart/clear/", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${t}` },
  }).catch(() => {});
});

// product page: Add to cart -> Go to cart
const slug = await (async () => {
  await p.goto(BASE + "/shop/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2200);
  return p.evaluate(() =>
    document.querySelector('a[href^="/product/"]')?.getAttribute("href"),
  );
})();
await p.goto(BASE + slug, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
const beforeLabel = await p
  .getByRole("button", { name: /add to cart|go to cart/i })
  .first()
  .innerText()
  .catch(() => "none");
await p
  .getByRole("button", { name: /add to cart/i })
  .first()
  .click();
await p.waitForTimeout(2000);
const afterLabel = await p
  .getByRole("button", { name: /add to cart|go to cart/i })
  .first()
  .innerText()
  .catch(() => "none");
note(
  "product CTA swaps to Go to cart",
  /go to cart/i.test(afterLabel),
  `"${beforeLabel.trim()}" -> "${afterLabel.trim()}"`,
);
await p
  .getByRole("button", { name: /go to cart/i })
  .first()
  .click();
await p.waitForTimeout(1800);
note("Go to cart navigates to /cart", p.url().includes("/cart"), p.url());

// card CTA on shop also swaps
await p.goto(BASE + "/shop/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
const cardGo = await p.getByRole("button", { name: /go to cart/i }).count();
note(
  "shop card shows Go to Cart for carted product",
  cardGo > 0,
  `${cardGo} card(s)`,
);

// checkout renders (was blank)
await p.goto(BASE + "/checkout/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
const co = await p.evaluate(() => ({
  chars: (document.querySelector("#root")?.innerText || "").length,
  text: (document.querySelector("#root")?.innerText || "")
    .replace(/\s+/g, " ")
    .slice(0, 160),
}));
note("checkout renders", co.chars > 200, `${co.chars} chars: ${co.text}`);

// coupon apply on checkout
const couponInput = p.locator('input[placeholder="WELCOME10"]').first();
if (await couponInput.count()) {
  await couponInput.fill("WELCOME10");
  await p
    .getByRole("button", { name: /^apply$/i })
    .first()
    .click();
  await p.waitForTimeout(1800);
  const t = await p.evaluate(() => document.body.innerText);
  note(
    "coupon applies on checkout",
    /applied/i.test(t) && !/NaN/i.test(t),
    t.match(/applied[^\n]{0,40}/i)?.[0] || "",
  );
} else note("coupon input found", false);

// admin: coupons Used column now shows numbers
await p.evaluate(() => localStorage.clear());
await p.goto(BASE + "/login/", { waitUntil: "domcontentloaded" });
await p.fill('input[type="email"]', "admin@btechekart.com");
await p.fill('input[type="password"]', "Admin@123");
await p.click('button[type="submit"]');
await p.waitForTimeout(2500);
await p.goto(BASE + "/admin/coupons/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
const usedCells = await p.evaluate(() =>
  Array.from(document.querySelectorAll("tbody tr")).map((tr) =>
    tr.children[4]?.innerText?.trim(),
  ),
);
note(
  "admin coupons Used column populated",
  usedCells.length > 0 && usedCells.every((v) => v && /^\d+/.test(v)),
  JSON.stringify(usedCells.slice(0, 4)),
);

note(
  "no console errors on tested flows",
  consoleErrors.length === 0,
  consoleErrors.slice(0, 3).join(" | "),
);
await b.close();

const fails = out.filter((o) => !o.ok);
console.log(`\n==== ${out.length} checks, ${fails.length} failing ====`);
process.exit(0);
