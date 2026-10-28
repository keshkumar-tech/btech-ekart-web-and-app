import { chromium } from "playwright";
const BASE = "http://localhost:5173";
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
});
const p = await ctx.newPage();
const log = [];
const note = (s) => {
  log.push(s);
  console.log(s);
};

async function login(email, pw) {
  await p.goto(BASE + "/login/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector('input[type="email"]');
  await p.fill('input[type="email"]', email);
  await p.fill('input[type="password"]', pw);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(2500);
}

// ---------- GUEST: add to cart, then log in and check the merge ----------
await p.goto(BASE + "/shop/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);
const card = p.locator('a[href^="/product/"]').first();
await card.click();
await p.waitForTimeout(2500);
note(
  "product page: " +
    (await p.evaluate(() =>
      document
        .querySelector("#root")
        .innerText.replace(/\s+/g, " ")
        .slice(0, 200),
    )),
);
const addBtn = p.getByRole("button", { name: /add to cart/i }).first();
if (!(await addBtn.count())) note("FAIL no add-to-cart button on product page");
else {
  await addBtn.click();
  await p.waitForTimeout(1200);
  const guest = await p.evaluate(() =>
    localStorage.getItem("ekart_guest_cart"),
  );
  note("guest cart after add: " + guest);
  const toast = await p.evaluate(() =>
    document.body.innerText.includes("cart") ? "has-toast" : "no-toast",
  );
  note("toast: " + toast);
}

// ---------- login merges guest cart ----------
await login("student@btechekart.com", "Student@123");
const cartResp = await p.evaluate(async () => {
  const t = localStorage.getItem("ekart_access");
  const r = await fetch("/api/cart/", {
    headers: { Authorization: `Bearer ${t}` },
  });
  return (await r.json()).items?.length;
});
note("cart items after merge: " + cartResp);
await p.goto(BASE + "/cart/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
note(
  "cart page: " +
    (await p.evaluate(() =>
      document
        .querySelector("#root")
        .innerText.replace(/\s+/g, " ")
        .slice(0, 260),
    )),
);

// quantity +/-
const plus = p.getByRole("button", { name: /increase quantity/i }).first();
if (await plus.count()) {
  await plus.click();
  await p.waitForTimeout(1500);
  note(
    "after qty+ cart: " +
      (await p.evaluate(() =>
        document
          .querySelector("#root")
          .innerText.replace(/\s+/g, " ")
          .slice(0, 200),
      )),
  );
} else note("FAIL no increase-quantity button");

// ---------- wishlist add ----------
await p.goto(BASE + "/shop/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
const heart = p
  .locator('button[aria-label*="wishlist" i], button[title*="wishlist" i]')
  .first();
if (await heart.count()) {
  await heart.click();
  await p.waitForTimeout(1200);
  note("wishlist toggled");
} else note("(no wishlist button found by aria/title — checking icons)");

// ---------- ADMIN flows ----------
await p.evaluate(() => localStorage.clear());
await login("admin@btechekart.com", "Admin@123");

// CSV exports
for (const [label, path] of [
  ["orders", "/admin/orders/"],
  ["customers", "/admin/customers/"],
]) {
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(2000);
  const btn = p.getByRole("button", { name: /export csv/i }).first();
  if (!(await btn.count())) {
    note(`FAIL no export button on ${label}`);
    continue;
  }
  try {
    const [dl] = await Promise.all([
      p.waitForEvent("download", { timeout: 15000 }),
      btn.click(),
    ]);
    note(`CSV ${label}: ${dl.suggestedFilename()}`);
  } catch (e) {
    note(`FAIL CSV ${label}: ${String(e).slice(0, 120)}`);
  }
}

// approve a pending-verification order
await p.goto(BASE + "/admin/orders/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
const approve = p.getByRole("button", { name: /^approve$/i }).first();
if (await approve.count()) {
  p.once("dialog", (d) => d.accept());
  await approve.click();
  await p.waitForTimeout(2500);
  note(
    "approve clicked -> " +
      (await p.evaluate(
        () =>
          document.body.innerText
            .replace(/\s+/g, " ")
            .match(/Approved[^.]{0,60}|No pending[^.]{0,40}/)?.[0] ||
          "no toast captured",
      )),
  );
} else note("(no pending-verification order to approve right now)");

// coupon create/edit/delete
await p.goto(BASE + "/admin/coupons/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
await p
  .getByRole("button", { name: /add coupon/i })
  .first()
  .click();
await p.waitForTimeout(800);
const codeInput = p.locator("input").first();
await codeInput.fill("QATEST10");
const saveBtn = p.getByRole("button", { name: /^save|create/i }).first();
await saveBtn.click();
await p.waitForTimeout(2000);
note(
  "after create: " +
    (await p.evaluate(() =>
      document.body.innerText.replace(/\s+/g, " ").slice(-300),
    )),
);

// settings save
await p.goto(BASE + "/admin/settings/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
const saveSetting = p.getByRole("button", { name: /save changes/i }).first();
if (await saveSetting.count()) {
  await saveSetting.click();
  await p.waitForTimeout(1500);
  note(
    "settings save: " +
      (await p.evaluate(
        () =>
          document.body.innerText.match(/Saved|error|failed/i)?.[0] ||
          "no toast",
      )),
  );
}

// review moderation buttons
await p.goto(BASE + "/admin/reviews/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2200);
const revBtns = await p.locator("button").allInnerTexts();
note(
  "review buttons: " +
    revBtns
      .filter((t) => t.trim())
      .slice(0, 14)
      .join(" | "),
);

// dark mode toggle persists
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
const darkBtn = p
  .locator(
    'button[aria-label*="dark" i], button[title*="dark" i], button[aria-label*="theme" i]',
  )
  .first();
if (await darkBtn.count()) {
  await darkBtn.click();
  await p.waitForTimeout(600);
  const cls = await p.evaluate(() => document.documentElement.className);
  await p.reload();
  await p.waitForTimeout(1200);
  const cls2 = await p.evaluate(() => document.documentElement.className);
  note(`dark toggle: before-reload="${cls}" after-reload="${cls2}"`);
} else note("(dark toggle not found by label)");

await b.close();
