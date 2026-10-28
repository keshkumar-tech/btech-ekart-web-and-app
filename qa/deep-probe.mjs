import { chromium } from "playwright";
const BASE = "http://localhost:5173";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

async function login(email, pw) {
  await p.goto(BASE + "/login/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector('input[type="email"]');
  await p.fill('input[type="email"]', email);
  await p.fill('input[type="password"]', pw);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(2500);
}

async function shot(name) {
  await p.screenshot({ path: `qa/shots/${name}.png` });
}

await login("admin@btechekart.com", "Admin@123");
for (const [name, url] of [
  ["admin-coupons", "/admin/coupons"],
  ["admin-banners", "/admin/banners"],
  ["admin-settings", "/admin/settings"],
  ["admin-blog", "/admin/blog"],
  ["admin-customers", "/admin/customers"],
  ["admin-orders", "/admin/orders"],
  ["admin-products", "/admin/products"],
  ["admin-customer-detail", "/admin/customers/9"],
  ["admin-order-detail", "/admin/orders/EK-20261019-413F08"],
]) {
  await p.goto(BASE + url + "/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2200);
  const info = await p.evaluate(() => ({
    text: document
      .querySelector("#root")
      .innerText.replace(/\s+/g, " ")
      .slice(0, 900),
    tables: document.querySelectorAll("table").length,
    rows: document.querySelectorAll("tbody tr").length,
  }));
  console.log(
    `\n===== ${name} (${url}) tables=${info.tables} rows=${info.rows}\n${info.text}`,
  );
  await shot(name);
}

// mobile overflow probe
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.setViewportSize({ width: 360, height: 780 });
await p.waitForTimeout(2000);
const wide = await p.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.right > window.innerWidth + 1 && r.width > 40) {
      out.push({
        tag: el.tagName,
        cls: (el.className || "").toString().slice(0, 90),
        right: Math.round(r.right),
        w: Math.round(r.width),
      });
    }
  }
  return out.slice(0, 25);
});
console.log("\n===== OVERFLOW @360");
wide.forEach((w) => console.log(JSON.stringify(w)));
await shot("home-360");

// student sidebar
await p.setViewportSize({ width: 1440, height: 900 });
await ctx.clearCookies();
await p.evaluate(() => localStorage.clear());
await login("student@btechekart.com", "Student@123");
await p.goto(BASE + "/profile/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
console.log(
  "\n===== PROFILE\n" +
    (await p.evaluate(() =>
      document
        .querySelector("#root")
        .innerText.replace(/\s+/g, " ")
        .slice(0, 1200),
    )),
);
await p.goto(BASE + "/orders/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
console.log(
  "\n===== ORDERS\n" +
    (await p.evaluate(() =>
      document
        .querySelector("#root")
        .innerText.replace(/\s+/g, " ")
        .slice(0, 1200),
    )),
);
await p.goto(BASE + "/library/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
console.log(
  "\n===== LIBRARY\n" +
    (await p.evaluate(() =>
      document
        .querySelector("#root")
        .innerText.replace(/\s+/g, " ")
        .slice(0, 1200),
    )),
);
await p.goto(BASE + "/notifications/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
console.log(
  "\n===== NOTIFICATIONS\n" +
    (await p.evaluate(() =>
      document
        .querySelector("#root")
        .innerText.replace(/\s+/g, " ")
        .slice(0, 1200),
    )),
);

await b.close();
