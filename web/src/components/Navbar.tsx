// Top navigation: logo, search with live suggestions, cart/wishlist badges,
// dark-mode toggle, and the account menu.

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaBars, FaBell, FaMoon,
  FaSun,
  FaShoppingCart,
  FaHeart,
  FaUser,
  FaSignOutAlt,
  FaSearch,
  FaBookOpen,
  FaTimes,
  FaUserShield,
  FaChevronDown,
  FaHome,
  FaThLarge,
  FaBook,
  FaFileAlt,
  FaBolt,
  FaClipboardList,
  FaBoxOpen,
  FaGraduationCap,
  FaCalendarAlt,
  FaBlog,
  FaInfoCircle,
  FaHeadset,
} from "react-icons/fa";
import clsx from "clsx";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { catalogService } from "@/services/catalog";
import { formatINR, mediaUrl } from "@/lib/utils";
import Logo, { BrandMark } from "@/components/store/Logo";
import toast from "react-hot-toast";
import NotificationBell from "@/components/store/NotificationBell";

// Branches shown in the "Shop by Branch" dropdown menu.
const BRANCHES = [
  { short: "CSE", name: "Computer Science" },
  { short: "IT", name: "Information Tech" },
  { short: "ECE", name: "Electronics" },
  { short: "ME", name: "Mechanical" },
  { short: "CE", name: "Civil" },
  { short: "EE", name: "Electrical" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { itemCount } = useCart();
  const { itemCount: wishCount } = useWishlist();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [q, setQ] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Live search suggestions (debounced).
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: suggestions } = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: () => catalogService.products({ q: debounced, page: 1 }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setShowSuggest(false);
      if (!(e.target as HTMLElement).closest(".account-menu"))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setShowSuggest(false);
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  }

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    navigate("/");
  }

  return (
    <header className="glass-nav sticky top-0 z-40 transition-shadow duration-300 hover:shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
      {/* Thin gradient accent line across the very top. */}
      <div className="h-[2px] w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-accent-500" />
      <div className="container-app flex h-[60px] items-center gap-2.5 sm:gap-3.5">
        {/* Mobile nav toggle */}
        <button
          className="btn-ghost -ml-2 p-2 lg:hidden"
          onClick={() => setMobileNav((v) => !v)}
          aria-label="Menu"
        >
          {mobileNav ? (
            <FaTimes className="h-5 w-5" />
          ) : (
            <FaBars className="h-5 w-5" />
          )}
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="group flex shrink-0 items-center transition-transform duration-500 ease-premium hover:scale-[1.02]"
          aria-label="B.Tech eKart home"
        >
          <Logo size={34} className="hidden sm:flex" />
          <BrandMark size={34} className="sm:hidden" />
        </Link>

        {/* Search with live suggestions */}
        <div ref={boxRef} className="relative flex-1">
          <form onSubmit={submitSearch} className="relative">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              placeholder="Search notes, PYQs, subjects, codes…"
              className="h-10 rounded-full border-slate-200/90 bg-slate-100/70 pl-10 pr-3 text-[13.5px] focus:bg-white dark:border-white/[0.08] dark:bg-white/[0.05] dark:focus:bg-white/[0.07]"
              aria-label="Search products"
            />
          </form>

          {showSuggest && suggestions?.results?.length ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-96 animate-pop overflow-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#0e1526]">
              {suggestions.results.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug}`}
                  onClick={() => setShowSuggest(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                >
                  <img
                    src={mediaUrl(p.cover_image)}
                    alt=""
                    className="h-10 w-8 rounded object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium">
                      {p.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {p.subject_code}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatINR(p.price)}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right actions */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.07] dark:hover:text-white"
            aria-label="Toggle theme"
            title="Toggle dark mode"
          >
            {theme === "dark" ? (
              <FaSun className="h-[18px] w-[18px]" />
            ) : (
              <FaMoon className="h-[18px] w-[18px]" />
            )}
          </button>

          {isAuthenticated && (
            <NotificationBell
              emptyHint="New study material will show up here."
            />
          )}

          <Link
            to="/wishlist"
            className="relative grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            aria-label="Wishlist"
          >
            <FaHeart className="h-[18px] w-[18px]" />
            {wishCount > 0 && <Badge count={wishCount} />}
          </Link>

          <Link
            to="/cart"
            className="relative grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            aria-label="Cart"
          >
            <FaShoppingCart className="h-[18px] w-[18px]" />
            {itemCount > 0 && <Badge count={itemCount} />}
          </Link>

          {isAuthenticated ? (
            <div className="account-menu relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.07]"
                aria-label="Account menu"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
                <span className="hidden max-w-24 truncate text-sm md:block">
                  {user?.name?.split(" ")[0]}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 animate-pop rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#0e1526]">
                  <div className="mb-1 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]">
                    <p className="truncate text-sm font-semibold">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                  <MenuLink
                    to="/profile"
                    icon={<FaUser />}
                    label="My Profile"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    to="/orders"
                    icon={<FaShoppingCart />}
                    label="My Orders"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    to="/library"
                    icon={<FaBookOpen />}
                    label="My Library"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    to="/notifications"
                    icon={<FaBell />}
                    label="Notifications"
                    onClick={() => setMenuOpen(false)}
                  />
                  {isAdmin && (
                    <MenuLink
                      to="/admin"
                      icon={<FaUserShield />}
                      label="Admin Dashboard"
                      onClick={() => setMenuOpen(false)}
                    />
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary ml-1 px-3 py-2 text-sm sm:px-4"
            >
              Login
            </Link>
          )}
        </nav>
      </div>

      {/* Desktop navigation bar with dropdown mega-menus */}
      <div className="hidden border-t border-slate-200/60 bg-white/45 backdrop-blur-xl lg:block dark:border-white/[0.05] dark:bg-white/[0.015]">
        <div className="container-app flex h-11 items-center gap-0.5 text-[13px] font-medium">
          <NavItem
            to="/"
            label="Home"
            icon={<FaHome className="h-3.5 w-3.5" />}
            end
          />
          <NavItem
            to="/shop"
            label="All Products"
            icon={<FaThLarge className="h-3.5 w-3.5" />}
            end
          />

          <NavDropdown
            label="Shop by Type"
            icon={<FaBookOpen className="h-3.5 w-3.5" />}
            footer={{ label: "Browse everything", to: "/shop" }}
          >
            <DropdownLink
              to="/shop?type=notes"
              label="Notes"
              desc="Complete handwritten notes"
              icon={<FaBook />}
              tone="blue"
            />
            <DropdownLink
              to="/shop?type=pyq"
              label="Previous Year Questions"
              desc="Solved PYQs 2018–2024"
              icon={<FaFileAlt />}
              tone="purple"
            />
            <DropdownLink
              to="/shop?type=quantum"
              label="Quantums"
              desc="Most-repeated important questions"
              icon={<FaBolt />}
              tone="amber"
            />
            <DropdownLink
              to="/shop?type=syllabus"
              label="Syllabus"
              desc="Latest AKTU syllabus PDFs"
              icon={<FaClipboardList />}
              tone="emerald"
            />
            <DropdownLink
              to="/shop?type=combo"
              label="Combo Packs"
              desc="Notes + PYQ + Quantum bundled"
              icon={<FaBoxOpen />}
              tone="rose"
            />
          </NavDropdown>

          <NavDropdown
            label="Shop by Branch"
            icon={<FaGraduationCap className="h-3.5 w-3.5" />}
            wide
          >
            <div className="grid grid-cols-2 gap-1">
              {BRANCHES.map((b) => (
                <Link
                  key={b.short}
                  to={`/shop?branch__short_name=${b.short}`}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-indigo-50/70 dark:hover:bg-white/[0.05]"
                >
                  <span className="grid h-7 w-9 shrink-0 place-items-center rounded-md bg-indigo-50 text-[10.5px] font-bold text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300">
                    {b.short}
                  </span>
                  <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                    {b.name}
                  </span>
                </Link>
              ))}
            </div>
          </NavDropdown>

          <NavDropdown
            label="Semesters"
            icon={<FaCalendarAlt className="h-3.5 w-3.5" />}
          >
            <div className="grid grid-cols-4 gap-1.5 p-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <Link
                  key={s}
                  to={`/shop?semester=${s}`}
                  className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                >
                  {s}
                </Link>
              ))}
            </div>
          </NavDropdown>

          <NavItem
            to="/blog"
            label="Blog"
            icon={<FaBlog className="h-3.5 w-3.5" />}
          />
          <NavItem
            to="/about"
            label="About"
            icon={<FaInfoCircle className="h-3.5 w-3.5" />}
          />
          <NavItem
            to="/contact"
            label="Contact"
            icon={<FaHeadset className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileNav && (
        <div className="border-t bg-white lg:hidden dark:bg-gray-900">
          <div className="container-app grid grid-cols-2 gap-1 py-3 text-sm font-medium">
            <MobLink
              to="/"
              label="Home"
              icon={<FaHome />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/shop"
              label="All Products"
              icon={<FaThLarge />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/shop?type=notes"
              label="Notes"
              icon={<FaBook />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/shop?type=pyq"
              label="PYQs"
              icon={<FaFileAlt />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/shop?type=quantum"
              label="Quantums"
              icon={<FaBolt />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/shop?type=syllabus"
              label="Syllabus"
              icon={<FaClipboardList />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/shop?type=combo"
              label="Combos"
              icon={<FaBoxOpen />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/blog"
              label="Blog"
              icon={<FaBlog />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/about"
              label="About"
              icon={<FaInfoCircle />}
              onClick={() => setMobileNav(false)}
            />
            <MobLink
              to="/contact"
              label="Contact"
              icon={<FaHeadset />}
              onClick={() => setMobileNav(false)}
            />
          </div>

          {/* Branches + semesters quick filters */}
          <div className="container-app border-t py-3">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Shop by branch
            </p>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map((b) => (
                <Link
                  key={b.short}
                  to={`/shop?branch__short_name=${b.short}`}
                  onClick={() => setMobileNav(false)}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {b.short}
                </Link>
              ))}
            </div>
            <p className="mb-2 mt-3 text-xs font-semibold uppercase text-gray-400">
              Shop by semester
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <Link
                  key={s}
                  to={`/shop?semester=${s}`}
                  onClick={() => setMobileNav(false)}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  Sem {s}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-brand-600 px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_-1px_rgba(79,70,229,0.6)] ring-2 ring-white dark:ring-[#070b16]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function MenuLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="group/item flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-white/[0.05] dark:hover:text-indigo-300"
    >
      <span className="text-slate-400 transition-colors group-hover/item:text-indigo-500">
        {icon}
      </span>{" "}
      {label}
    </Link>
  );
}

function NavItem({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          "group relative flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors",
          isActive
            ? "text-brand-600 dark:text-brand-400"
            : "text-gray-700 hover:bg-gray-50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-brand-400",
        )
      }
    >
      {({ isActive }) => (
        <>
          {icon && (
            <span
              className={clsx(
                "transition-colors",
                isActive
                  ? "text-brand-500"
                  : "text-gray-400 group-hover:text-brand-500",
              )}
            >
              {icon}
            </span>
          )}
          {label}
          {/* Active underline */}
          {isActive && (
            <span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
          )}
        </>
      )}
    </NavLink>
  );
}

// A top-level nav item that reveals a premium dropdown panel.
//
// Hover handling note: the panel is wrapped together with the trigger inside
// ONE element that owns the mouseenter/mouseleave, and the visual gap between
// them is created with padding (not margin) so the pointer never crosses a
// dead zone — that gap was why the menu used to vanish the moment you moved
// towards it. A short close delay adds extra tolerance.
function NavDropdown({
  label,
  icon,
  children,
  wide,
  footer,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
  footer?: { label: string; to: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => {
          // Open (never toggle): a mouse user has already triggered the hover
          // handler by the time this fires, so a toggle would immediately close
          // the freshly-opened panel. Clicking again while open just keeps it
          // open for touch devices.
          openNow();
        }}
        onFocus={openNow}
        className={clsx(
          "group flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium transition-colors",
          open
            ? "text-brand-600 dark:text-brand-400"
            : "text-gray-700 hover:bg-gray-50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-brand-400",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {icon && (
          <span
            className={clsx(
              "transition-colors",
              open
                ? "text-brand-500"
                : "text-gray-400 group-hover:text-brand-500",
            )}
          >
            {icon}
          </span>
        )}
        {label}
        <FaChevronDown
          className={clsx(
            "h-2.5 w-2.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
        {open && (
          <span className="absolute inset-x-2.5 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-brand-400 via-indigo-500 to-violet-500" />
        )}
      </button>

      {/* Panel + an invisible hover bridge (the pt-3) so the pointer never
          leaves the wrapper while travelling from trigger to panel. */}
      {open && (
        <div className="absolute left-0 top-full z-50 pt-3">
          <div
            role="menu"
            className={clsx(
              "animate-pop overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-[#0e1526]",
              wide ? "w-80" : "w-72",
            )}
          >
            <div className="p-2">{children}</div>
            {footer && (
              <Link
                to={footer.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-indigo-400 dark:hover:bg-white/[0.06]"
              >
                {footer.label}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TONE_CLASSES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  purple:
    "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
};

// A row inside a NavDropdown: colored icon tile + label + short description.
function DropdownLink({
  to,
  label,
  desc,
  icon,
  tone = "blue",
}: {
  to: string;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.05]"
    >
      {icon && (
        <span
          className={clsx(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm transition-transform group-hover:scale-105",
            TONE_CLASSES[tone],
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300">
          {label}
        </span>
        {desc && (
          <span className="block text-[11.5px] text-slate-500 dark:text-slate-400">
            {desc}
          </span>
        )}
      </span>
    </Link>
  );
}

function MobLink({
  to,
  label,
  icon,
  onClick,
}: {
  to: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-white/[0.06] dark:hover:text-indigo-300"
    >
      {icon && <span className="text-gray-400">{icon}</span>}
      {label}
    </Link>
  );
}
