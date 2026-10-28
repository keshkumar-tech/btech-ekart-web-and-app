import { chromium } from "playwright";
const BASE = "http://localhost:5173";
const b = await chromium.launch();
const p = await (
  await b.newContext({ viewport: { width: 1440, height: 900 } })
).newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 200)));
await p.goto(BASE + "/login/", { waitUntil: "domcontentloaded" });
await p.waitForSelector('input[type="email"]');
await p.fill('input[type="email"]', "student@btechekart.com");
await p.fill('input[type="password"]', "Student@123");
await p.click('button[type="submit"]');
await p.waitForTimeout(2500);
console.log("after login:", p.url());
await p.goto(BASE + "/cart/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
console.log(
  "cart text:",
  (await p.evaluate(() => document.querySelector("#root").innerText))
    .replace(/\s+/g, " ")
    .slice(0, 500),
);
await p.goto(BASE + "/checkout/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
// count renders / hooks error details
const errs = [];
p.on("console", (m) => {
  if (m.type() === "error") errs.push(m.text().slice(0, 1200));
});
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
console.log(
  "checkout url:",
  p.url(),
  "html chars:",
  await p.evaluate(() => document.getElementById("root").innerHTML.length),
);
console.log("errors:", errs.join("\n---\n").slice(0, 3000));
await b.close();
