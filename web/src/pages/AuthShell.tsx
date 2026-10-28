// Shared centered shell for the Login / Signup / Forgot-password pages.
import { Link } from "react-router-dom";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — dark immersive surface */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0b1120] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-float-slow rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-10 h-80 w-80 animate-float-x rounded-full bg-violet-500/25 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 text-xl font-black shadow-[0_8px_24px_-8px_rgba(99,102,241,0.9)]">
            e
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            B.Tech eKart
          </span>
        </Link>

        <div className="relative max-w-md animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            For AKTU students
          </span>
          <h2 className="mt-4 font-display text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em]">
            All your study material,
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              one download away.
            </span>
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-slate-400">
            Notes, PYQs, Quantums, Syllabus and Combo packs for CSE, IT, ECE,
            ME, CE &amp; EE — Semesters 1 to 8.
          </p>
          <ul className="mt-7 space-y-3 text-[12.5px] text-slate-300">
            {[
              "Instant access after payment",
              "Secure PDF downloads",
              "Trusted by hundreds of students",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-[10px] text-emerald-300 ring-1 ring-emerald-400/25">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11.5px] text-slate-500">
          © {new Date().getFullYear()} B.Tech eKart
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-store-body p-6 dark:bg-[#070b16]">
        <div className="w-full max-w-[400px] animate-fade-up py-8">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-lg font-black text-white">
              e
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              B.Tech eKart
            </span>
          </Link>
          <h1 className="font-display text-[26px] font-bold tracking-[-0.025em] text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
          <div className="mt-7 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] dark:border-white/[0.07] dark:bg-[#0e1526]">
            {children}
          </div>
          <Link
            to="/"
            className="mt-6 block text-center text-[11.5px] font-medium text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
