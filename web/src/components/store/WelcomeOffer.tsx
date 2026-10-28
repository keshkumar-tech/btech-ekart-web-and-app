// First-visit lead-capture popup.
//
// Opens once after a short delay on the first visit and offers either a
// WhatsApp/Telegram "get in touch" channel or an email subscribe form.
// Dismissal is remembered in localStorage so returning visitors are not nagged.
import { useEffect, useState } from "react";
import {
  FiMail,
  FiCheckCircle,
  FiMessageCircle,
  FiX,
  FiSend,
} from "react-icons/fi";
import { FaWhatsapp, FaTelegram } from "react-icons/fa";
import toast from "react-hot-toast";
import StoreModal from "@/components/store/StoreModal";
import { BrandMark } from "@/components/store/Logo";

const SEEN_KEY = "ekart_welcome_seen";
const MAIL_KEY = "ekart_welcome_email";

export default function WelcomeOffer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"subscribe" | "contact">("subscribe");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const whatsapp = import.meta.env.VITE_WHATSAPP_LINK || "";
  const telegram = import.meta.env.VITE_TELEGRAM_LINK || "";

  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(SEEN_KEY);
    } catch {
      seen = false;
    }
    if (seen) return;

    // Never pile a second overlay on top of one the visitor already opened
    // (e.g. the login gate or the notification panel).
    const t = setTimeout(() => {
      const busy = document.querySelector(
        "[role=dialog], [role=listbox], [aria-expanded='true']",
      );
      if (busy) return;
      setOpen(true);
    }, 5500);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      /* storage blocked — the popup simply shows again next visit */
    }
  }

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      localStorage.setItem(MAIL_KEY, value);
    } catch {
      /* ignore */
    }
    setDone(true);
    toast.success("You're on the list! 🎉");
  }

  return (
    <StoreModal open={open} onClose={close} className="max-w-[440px]">
      <button
        onClick={close}
        aria-label="Close"
        className="absolute right-3.5 top-3.5 z-20 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white/80 backdrop-blur transition-colors hover:bg-white/25 hover:text-white"
      >
        <FiX />
      </button>

      {/* Header */}
      <div className="relative overflow-hidden bg-[#0b1120] px-7 pb-8 pt-7 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:38px_38px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 animate-float-slow rounded-full bg-indigo-500/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-36 w-36 animate-float-x rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <BrandMark size={40} />
          <div>
            <p className="font-display text-[17px] font-bold tracking-tight">
              {done ? "Welcome aboard!" : "Get 10% off your first order"}
            </p>
            <p className="text-[11.5px] text-slate-400">
              {done
                ? "Check your inbox for study tips & offers."
                : "Join 10,000+ AKTU students on B.Tech eKart."}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 px-5 pt-4 dark:border-white/[0.06]">
        {(
          [
            ["subscribe", "Subscribe"],
            ["contact", "Get in touch"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative rounded-t-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
              tab === key
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {label}
            {tab === key && (
              <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            )}
          </button>
        ))}
      </div>

      <div className="p-5">
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="grid h-14 w-14 animate-pop place-items-center rounded-2xl bg-emerald-50 text-3xl text-emerald-500 dark:bg-emerald-500/10">
              <FiCheckCircle />
            </span>
            <p className="mt-3 text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">
              Subscribed as
            </p>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
              {email}
            </p>
            <button
              onClick={close}
              className="mt-5 w-full rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-10px_rgba(79,70,229,0.85)] transition-all hover:-translate-y-0.5"
            >
              Start shopping
            </button>
          </div>
        ) : tab === "subscribe" ? (
          <form onSubmit={subscribe} className="space-y-3">
            <p className="text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              New notes, PYQs and combo drops — plus an exclusive discount code
              for your first purchase.
            </p>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input h-11 pl-10"
                aria-label="Email address"
              />
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="input h-11"
              aria-label="Name"
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 py-3 text-[13px] font-semibold text-white shadow-[0_10px_28px_-12px_rgba(79,70,229,0.9)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <FiSend /> Subscribe &amp; get the code
            </button>
            <button
              type="button"
              onClick={close}
              className="w-full text-center text-[11.5px] font-medium text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
            >
              No thanks, I&apos;ll pay full price
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Questions about an order, a subject, or a custom bundle? Message
              us directly — we usually reply within a few hours.
            </p>
            <a
              href={whatsapp || "#"}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-xl border-emerald-200 bg-emerald-50/70 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 dark:border-emerald-400/20 dark:bg-emerald-500/[0.08]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-lg text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.9)]">
                <FaWhatsapp />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  Chat on WhatsApp
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Fastest reply · order help
                </span>
              </span>
            </a>
            <a
              href={telegram || "#"}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-xl border-sky-200 bg-sky-50/70 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 dark:border-sky-400/20 dark:bg-sky-500/[0.08]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500 text-lg text-white shadow-[0_8px_20px_-8px_rgba(14,165,233,0.9)]">
                <FaTelegram />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  Telegram channel
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  New uploads &amp; exam alerts
                </span>
              </span>
            </a>
            <button
              onClick={() => setTab("subscribe")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-slate-200 py-2.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.05]"
            >
              <FiMessageCircle /> Or subscribe by email
            </button>
          </div>
        )}
      </div>
    </StoreModal>
  );
}
