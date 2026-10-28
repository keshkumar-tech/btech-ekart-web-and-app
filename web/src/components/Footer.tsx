// Site footer with links, contact info and legal pages.
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/store/Logo";
import {
  FaWhatsapp,
  FaTelegram,
  FaEnvelope,
  FaPhone,
  FaHeart,
} from "react-icons/fa";

export default function Footer() {
  const year = new Date().getFullYear();
  const supportEmail =
    import.meta.env.VITE_SUPPORT_EMAIL || "support@btechekart.com";
  const whatsapp = import.meta.env.VITE_WHATSAPP_LINK || "#";
  const telegram = import.meta.env.VITE_TELEGRAM_LINK || "#";

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/[0.06] bg-[#080d1a] text-slate-400">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="container-app relative grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <BrandMark size={40} />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[16px] font-extrabold tracking-[-0.02em] text-white">
                B.Tech{" "}
                <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
                  eKart
                </span>
              </span>
              <span className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-500">
                AKTU Study Store
              </span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-slate-400">
            Instant digital study material for AKTU B.Tech students — Notes,
            PYQs, Quantums, Syllabus and Combos.
          </p>
          <div className="mt-5 flex gap-2.5">
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-slate-300 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-500 hover:text-white hover:ring-emerald-400/40"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="h-4 w-4" />
            </a>
            <a
              href={telegram}
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-slate-300 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-500 hover:text-white hover:ring-sky-400/40"
              aria-label="Telegram"
            >
              <FaTelegram className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${supportEmail}`}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-slate-300 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500 hover:text-white hover:ring-indigo-400/40"
              aria-label="Email support"
            >
              <FaEnvelope className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            Shop
          </h4>
          <ul className="space-y-2.5 text-[13px] text-slate-400">
            <li>
              <Link to="/shop?type=notes" className="inline-block transition-colors hover:text-white">
                Notes
              </Link>
            </li>
            <li>
              <Link to="/shop?type=pyq" className="inline-block transition-colors hover:text-white">
                Previous Year Papers
              </Link>
            </li>
            <li>
              <Link to="/shop?type=quantum" className="inline-block transition-colors hover:text-white">
                Quantums
              </Link>
            </li>
            <li>
              <Link to="/shop?type=syllabus" className="inline-block transition-colors hover:text-white">
                Syllabus
              </Link>
            </li>
            <li>
              <Link to="/shop?type=combo" className="inline-block transition-colors hover:text-white">
                Combo Packs
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            Company
          </h4>
          <ul className="space-y-2.5 text-[13px] text-slate-400">
            <li>
              <Link to="/about" className="inline-block transition-colors hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="inline-block transition-colors hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/blog" className="inline-block transition-colors hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/orders" className="inline-block transition-colors hover:text-white">
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/library" className="inline-block transition-colors hover:text-white">
                My Library
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            Policies
          </h4>
          <ul className="space-y-2.5 text-[13px] text-slate-400">
            <li>
              <Link to="/terms" className="inline-block transition-colors hover:text-white">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="inline-block transition-colors hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/refund-policy" className="inline-block transition-colors hover:text-white">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link to="/disclaimer" className="inline-block transition-colors hover:text-white">
                Disclaimer
              </Link>
            </li>
          </ul>
          <div className="mt-4 space-y-2.5 text-[13px] text-slate-400">
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <FaEnvelope className="h-3.5 w-3.5" /> {supportEmail}
            </a>
            <span className="flex items-center gap-2">
              <FaPhone className="h-3.5 w-3.5" /> +91 99999 99999
            </span>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/[0.06]">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-[11.5px] text-slate-500 sm:flex-row">
          <p>© {year} B.Tech eKart. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <FaHeart className="h-3 w-3 text-rose-500" /> for AKTU
            students
          </p>
        </div>
      </div>
    </footer>
  );
}

