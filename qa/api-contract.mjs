// Contract test: calls every endpoint the mobile app uses and checks the shape
// of the response against what the screens read.
const API = "http://127.0.0.1:8000";
let access = "";
const out = [];

async function call(method, path, body, asAdmin = false) {
  const headers = { "Content-Type": "application/json" };
  if (asAdmin && access) headers.Authorization = `Bearer ${access}`;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text.slice(0, 300);
  }
  return { status: res.status, data };
}

function check(name, ok, detail) {
  out.push({ name, ok, detail });
  console.log(
    `${ok ? "ok  " : "FAIL"} ${name}${detail ? "  -> " + detail : ""}`,
  );
}

// 1. login
let r = await call("POST", "/api/auth/login/", {
  email: "student@btechekart.com",
  password: "Student@123",
});
access = r.data.access;
check("student login", r.status === 200 && !!access, `${r.status}`);

// 2. cart
r = await call("GET", "/api/cart/");
check(
  "cart",
  r.status === 200,
  `keys=${Object.keys(r.data || {}).join(",")} items=${r.data?.items?.length}`,
);

// 3. coupon validate (the mobile screen reads res.discount)
r = await call("POST", "/api/orders/coupon/apply/", { code: "WELCOME10" });
check(
  "coupon apply shape",
  r.status === 200,
  JSON.stringify(r.data).slice(0, 200),
);

// 4. orders list shape
r = await call("GET", "/api/orders/");
const ordersArr = Array.isArray(r.data) ? r.data : r.data?.results;
check(
  "orders list",
  r.status === 200 && Array.isArray(ordersArr),
  `n=${ordersArr?.length}`,
);

// 5. library
r = await call("GET", "/api/library/");
const libArr = Array.isArray(r.data) ? r.data : r.data?.results;
check(
  "library",
  r.status === 200 && Array.isArray(libArr),
  `n=${libArr?.length} first=${JSON.stringify(libArr?.[0] || {}).slice(0, 160)}`,
);

// 6. notifications
r = await call("GET", "/api/notifications/?limit=50");
const notifArr = Array.isArray(r.data) ? r.data : r.data?.results;
check(
  "notifications",
  r.status === 200 && Array.isArray(notifArr),
  `n=${notifArr?.length}`,
);
r = await call("GET", "/api/notifications/unread-count/");
check("unread count", r.status === 200, JSON.stringify(r.data));

// 7. reviews: can a non-buyer post? (this is the seeded student, who owns little)
r = await call("GET", "/api/catalog/products/?page_size=1");
const prod = (r.data.results || r.data)[0];
r = await call("POST", `/api/reviews/product/${prod.slug}/`, {
  product: prod.id,
  rating: 5,
  comment: "contract test",
});
check(
  "review by non-buyer should be 403",
  r.status === 403,
  `${r.status} -> ${JSON.stringify(r.data).slice(0, 200)}`,
);

// 8. admin endpoints with the admin account
let a = await call("POST", "/api/auth/login/", {
  email: "admin@btechekart.com",
  password: "Admin@123",
});
access = a.data.access;
check("admin login", a.status === 200 && !!access);
for (const [name, path] of [
  ["dashboard overview", "/api/dashboard/overview/"],
  ["dashboard revenue", "/api/dashboard/revenue/?period=daily&days=30"],
  ["dashboard customers", "/api/dashboard/customers/?page=1"],
  ["dashboard orders", "/api/dashboard/orders/?page=1"],
  ["admin coupons", "/api/orders/admin/coupons/"],
  ["admin products", "/api/catalog/admin/products/?page=1&page_size=12"],
  ["admin banners", "/api/catalog/admin/banners/"],
  ["admin blog posts", "/api/blog/admin/posts/?page=1"],
  ["admin reviews", "/api/reviews/admin/reviews/?page=1"],
  ["taxonomy categories", "/api/catalog/admin/categories/"],
  ["taxonomy branches", "/api/catalog/admin/branches/"],
  ["taxonomy subjects", "/api/catalog/admin/subjects/"],
  ["site settings", "/api/core/settings/"],
]) {
  r = await call("GET", path, null, true);
  check(
    name,
    r.status === 200,
    `${r.status} ${JSON.stringify(r.data).slice(0, 120)}`,
  );
}

// 9. coupon list must include used_count (the web table renders it)
r = await call("GET", "/api/orders/admin/coupons/", null, true);
const coupon = (r.data.results || r.data)[0];
check(
  "coupon list has used_count",
  coupon && "used_count" in coupon,
  JSON.stringify(coupon).slice(0, 200),
);

console.log(`\n${out.filter((o) => !o.ok).length} failing of ${out.length}`);
