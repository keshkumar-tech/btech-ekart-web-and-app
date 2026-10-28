// Full user-journey test against the LIVE stack.
export default async function run(page, ui) {
  const out = {};
  await page.setViewportSize({ width: 1440, height: 900 });

  // ---------- SHOP ----------
  await page.goto("http://localhost:5173/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  out.shop_heading = (
    await page.evaluate(() => document.body.innerText)
  ).includes("Shop Study Material");
  out.shop_products = await page.evaluate(
    () => document.querySelectorAll('a[href^="/product/"]').length,
  );

  // filter
  await page.goto(
    "http://localhost:5173/shop?branch__short_name=CSE&semester=3",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(1600);
  const shopTxt = await page.evaluate(() => document.body.innerText);
  out.filter_result_text = (shopTxt.match(/\d+ products? found/) || [
    "none",
  ])[0];

  // ---------- PRODUCT DETAIL ----------
  const href = await page.evaluate(() =>
    document.querySelector('a[href^="/product/"]')?.getAttribute("href"),
  );
  await page.goto("http://localhost:5173" + href, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  const pTxt = await page.evaluate(() => document.body.innerText);
  out.detail_add_to_cart = pTxt.includes("Add to Cart");
  out.detail_buy_now = pTxt.includes("Buy Now");
  out.detail_whats_included = pTxt.includes("What's included");
  out.detail_view_preview = pTxt.includes("View Preview");
  out.detail_reviews = pTxt.includes("Reviews");
  out.detail_title =
    (await page.evaluate(() => document.querySelector("h1")?.innerText)) || "";

  // ---------- LOGIN ----------
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.fill('input[type="email"]', "student@btechekart.com");
  await page.fill('input[type="password"]', "Student@123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3200);
  out.after_login_url = page.url();
  out.logged_in = (await page.evaluate(() => document.body.innerText)).includes(
    "Demo",
  );

  // ---------- ADD TO CART ----------
  await page.goto("http://localhost:5173/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  const addBtns = await page.$$('button:has-text("Add to Cart")');
  if (addBtns.length) {
    await addBtns[0].click();
    await page.waitForTimeout(2000);
  }
  await page.goto("http://localhost:5173/cart", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  const cartTxt = await page.evaluate(() => document.body.innerText);
  out.cart_page_loaded = cartTxt.includes("Your Cart");
  out.cart_has_items = /Price Details|Proceed to Checkout/.test(cartTxt);
  out.cart_snippet = cartTxt.slice(0, 200);

  // ---------- MY LIBRARY ----------
  await page.goto("http://localhost:5173/library", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1800);
  const libTxt = await page.evaluate(() => document.body.innerText);
  out.library_loaded = libTxt.includes("My Library");
  out.library_download_buttons = (libTxt.match(/Download PDF/g) || []).length;

  // ---------- MY ORDERS ----------
  await page.goto("http://localhost:5173/orders", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  out.orders_loaded = (
    await page.evaluate(() => document.body.innerText)
  ).includes("My Orders");

  // ---------- ADMIN ----------
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // log out first via profile if needed — just log in as admin
  await page.fill('input[type="email"]', "admin@btechekart.com");
  await page.fill('input[type="password"]', "Admin@123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3500);
  await page.goto("http://localhost:5173/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(2800);
  const admTxt = await page.evaluate(() => document.body.innerText);
  out.admin_loaded = admTxt.includes("Dashboard Overview");
  out.admin_revenue = admTxt.includes("Total Revenue");
  out.admin_nav_ok = [
    "Customers",
    "Orders",
    "Products",
    "Coupons",
    "Banners",
    "Settings",
  ].every((l) => admTxt.includes(l));
  out.admin_charts = await page.evaluate(
    () => document.querySelectorAll("svg.recharts-surface").length,
  );

  return out;
}
