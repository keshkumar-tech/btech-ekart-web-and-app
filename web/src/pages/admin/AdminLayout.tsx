import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiShoppingBag,
  FiBox,
  FiLayers,
  FiTag,
  FiImage,
  FiStar,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiExternalLink,
  FiMoon,
  FiSun,
  FiSearch,
  FiBell,
  FiChevronRight,
} from "react-icons/fi";
import NotificationBell from "@/components/store/NotificationBell";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";

// Grouped navigation with ONE shared accent. Hierarchy comes from spacing,
// grouping and weight — not from a rainbow of icon tiles.
const NAV_GROUPS: {
  label: string;
  items: { to: string; label: string; icon: React.ReactNode; end?: boolean }[];
}[] = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: <FiGrid />, end: true }],
  },
  {
    label: "Commerce",
    items: [
      { to: "/admin/orders", label: "Orders", icon: <FiShoppingBag /> },
      { to: "/admin/products", label: "Products", icon: <FiBox /> },
      { to: "/admin/customers", label: "Customers", icon: <FiUsers /> },
      { to: "/admin/coupons", label: "Coupons", icon: <FiTag /> },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/taxonomy", label: "Catalog Setup", icon: <FiLayers /> },
      { to: "/admin/banners", label: "Banners", icon: <FiImage /> },
      { to: "/admin/reviews", label: "Reviews", icon: <FiStar /> },
      { to: "/admin/blog", label: "Blog", icon: <FiFileText /> },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/settings", label: "Site Settings", icon: <FiSettings /> },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  }

  const initials = (user?.name || "Admin")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    // Full-height shell: the sidebar and the main column each own their
    // overflow container so they scroll independently.
    <div className="flex h-screen overflow-hidden bg-[#f6f7fb] dark:bg-[#080d1a]">
      {/* ───────── Sidebar ───────── */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[248px] shrink-0 flex-col overflow-y-auto",
          "border-r border-white/[0.06] bg-[#0b1120] text-slate-400",
          "transition-transform duration-300 ease-premium lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Link to="/admin" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 text-[15px] font-black text-white shadow-[0_6px_16px_-4px_rgba(99,102,241,0.7)] transition-transform duration-300 group-hover:scale-105">
              e
            </span>
            <span className="flex items-center gap-1.5 font-display text-[15px] font-bold tracking-tight text-white">
              eKart
              <span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-300">
                Admin
              </span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        {/* Nav — tight, grouped, one accent */}
        <nav className="flex-1 px-3 pt-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3.5">
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500/80">
                {group.label}
              </p>
              <div className="space-y-[2px]">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-200",
                        isActive
                          ? "bg-white/[0.08] text-white"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={clsx(
                            "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400 transition-opacity",
                            isActive ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span
                          className={clsx(
                            "grid h-5 w-5 shrink-0 place-items-center text-[15px] transition-colors",
                            isActive
                              ? "text-indigo-400"
                              : "text-slate-500 group-hover:text-slate-300",
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.9)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: store link, sign out, account card */}
        <div className="mt-auto border-t border-white/[0.06] p-3">
          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <span className="grid h-5 w-5 place-items-center text-[15px] text-slate-500 group-hover:text-slate-300">
              <FiExternalLink />
            </span>
            View storefront
          </Link>
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <span className="grid h-5 w-5 place-items-center text-[15px] text-slate-500 group-hover:text-rose-400">
              <FiLogOut />
            </span>
            Sign out
          </button>
          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-2.5 py-2 ring-1 ring-white/[0.05]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name}
              </p>
              <p className="truncate text-[10.5px] text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ───────── Main column ───────── */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0b1120]/85 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06] lg:hidden"
            aria-label="Open menu"
          >
            <FiMenu className="text-lg" />
          </button>

          {/* Command-style search */}
          <button
            onClick={() => navigate("/admin/orders")}
            className="hidden h-9 w-full max-w-[340px] items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-left text-[13px] text-slate-400 transition-colors hover:border-slate-300 hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-white/[0.14] sm:flex"
          >
            <FiSearch className="text-[15px]" />
            <span className="flex-1 truncate">Search orders, customers…</span>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-400 dark:border-white/10 dark:bg-white/[0.04]">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <FiSun className="text-[17px]" />
              ) : (
                <FiMoon className="text-[17px]" />
              )}
            </button>
            <Link
              to="/admin/orders?needs_review=true"
              className="hidden rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10 sm:block"
            >
              Review queue
            </Link>
            <NotificationBell
              buttonClass="rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              emptyHint="No notifications yet — new reviews will land here."
            />
            <span className="mx-1.5 hidden h-6 w-px bg-slate-200 dark:bg-white/10 sm:block" />
            <Link
              to="/admin/settings"
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.05]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10.5px] font-bold text-white">
                {initials}
              </span>
              <span className="hidden text-[13px] font-medium text-slate-700 dark:text-slate-200 sm:block">
                {user?.name?.split(" ")[0]}
              </span>
              <FiChevronRight className="hidden text-slate-400 sm:block" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
