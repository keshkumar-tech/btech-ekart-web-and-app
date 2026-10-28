// The "please log in first" dialog. Mounted ONCE in the public layout; every
// cart / wishlist action opens it through `useAuthGate`.
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiHeart,
  FiZap,
  FiArrowRight,
  FiShield,
} from "react-icons/fi";
import StoreModal from "@/components/store/StoreModal";
import { GATE_COPY, useAuthGate } from "@/store/authGate";

export default function LoginGate() {
  const { intent, close } = useAuthGate();
  const navigate = useNavigate();
  const location = useLocation();

  const copy = intent ? GATE_COPY[intent] : GATE_COPY.cart;
  const Icon =
    copy.icon === "heart"
      ? FiHeart
      : copy.icon === "buy"
        ? FiZap
        : FiShoppingCart;

  function go(path: "/login" | "/signup") {
    close();
    navigate(path, { state: { from: location.pathname + location.search } });
  }

  return (
    <StoreModal open={!!intent} onClose={close}>
      {/* Header band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-7 pb-9 pt-8 text-white">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-fuchsia-400/30 blur-2xl" />
        <div className="relative flex flex-col items-center text-center">
          <span className="relative mb-4 grid place-items-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-white/30" />
            <span className="gate-icon bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Icon />
            </span>
          </span>
          <h2 className="font-display text-[22px] font-bold tracking-tight">
            {copy.title}
          </h2>
          <p className="mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-indigo-100">
            {copy.body}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 pt-5">
        <div className="mb-5 space-y-2.5 text-[12.5px] text-slate-600 dark:text-slate-300">
          <p className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <FiShield className="h-3 w-3" />
            </span>
            Your cart &amp; wishlist stay synced to your account
          </p>
          <p className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <FiZap className="h-3 w-3" />
            </span>
            Instant access to every product you buy
          </p>
        </div>

        <button
          onClick={() => go("/login")}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:from-indigo-600 hover:to-indigo-700"
          autoFocus
        >
          Log in to continue
          <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
        <button
          onClick={() => go("/signup")}
          className="mt-2.5 w-full rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.05]"
        >
          Create a new account
        </button>
        <button
          onClick={close}
          className="mt-3 w-full text-center text-[12px] font-medium text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          Maybe later
        </button>
      </div>
    </StoreModal>
  );
}
