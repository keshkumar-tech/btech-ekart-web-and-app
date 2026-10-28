const API = "http://127.0.0.1:8000";
const j = (r) => r.json();
async function post(path, body, token) {
  const r = await fetch(API + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}
async function get(path, token) {
  const r = await fetch(API + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}

const a = await post("/api/auth/login/", {
  email: "admin@btechekart.com",
  password: "Admin@123",
});
const t = a.data.access;
const list = await get("/api/orders/admin/coupons/", t);
const arr = list.data.results || list.data;
console.log("coupon keys:", Object.keys(arr[0] || {}).join(","));
console.log(
  "QATEST10 in DB:",
  JSON.stringify(arr.find((c) => c.code === "QATEST10")),
);

const create = await post(
  "/api/orders/admin/coupons/",
  { code: "QATEST11", discount_type: "percent", value: "10" },
  t,
);
console.log("create minimal:", create.status, JSON.stringify(create.data));

// reviews moderation: do approved reviews show approve buttons?
const reviews = await get("/api/reviews/admin/reviews/?page=1", t);
const rv = reviews.data.results || reviews.data;
console.log(
  "reviews count:",
  rv.length,
  "approved:",
  rv.filter((r) => r.is_approved).length,
  "pending:",
  rv.filter((r) => !r.is_approved).length,
);
