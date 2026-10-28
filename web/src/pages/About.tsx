// About page — marketing-style, content-rich landing for the store.
//
// Kept separate from StaticPage (which renders the legal pages) so this can use
// a richer, more visual layout: hero, stats, mission, how-it-works, and FAQs.

import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaFileAlt,
  FaBolt,
  FaClipboardList,
  FaBoxOpen,
  FaGraduationCap,
  FaRupeeSign,
  FaDownload,
  FaShieldAlt,
  FaHeadset,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";
import Seo from "@/components/Seo";
import { Reveal } from "@/hooks/useReveal";
import { SectionHeader } from "@/components/ui";

const STATS = [
  { value: "500+", label: "Study resources", icon: <FaBookOpen /> },
  { value: "6", label: "Engineering branches", icon: <FaGraduationCap /> },
  { value: "8", label: "Semesters covered", icon: <FaClipboardList /> },
  { value: "10k+", label: "Happy students", icon: <FaStar /> },
];

const OFFERINGS = [
  {
    icon: <FaBookOpen />,
    title: "Handwritten Notes",
    desc: "Complete, exam-focused notes for every subject — clear, concise and easy to revise.",
    tone: "blue",
  },
  {
    icon: <FaFileAlt />,
    title: "Previous Year Questions",
    desc: "Solved AKTU question papers from 2018 onwards, grouped topic-wise for smart practice.",
    tone: "purple",
  },
  {
    icon: <FaBolt />,
    title: "Quantums",
    desc: "The most-repeated important questions that actually appear in exams.",
    tone: "amber",
  },
  {
    icon: <FaClipboardList />,
    title: "Latest Syllabus",
    desc: "Up-to-date AKTU syllabus copies so you always know exactly what to study.",
    tone: "emerald",
  },
  {
    icon: <FaBoxOpen />,
    title: "Combo Packs",
    desc: "Notes + PYQ + Quantum bundled together at a big discount — best value for money.",
    tone: "rose",
  },
  {
    icon: <FaDownload />,
    title: "Instant Download",
    desc: "Pay once and download immediately. Lifetime access from your personal library.",
    tone: "sky",
  },
];

const TONE_BG: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
};

const STEPS = [
  {
    n: "01",
    title: "Pick your material",
    desc: "Browse by branch, semester or type and find exactly what you need.",
  },
  {
    n: "02",
    title: "Pay securely",
    desc: "Checkout with Razorpay, UPI or QR — quick, safe and encrypted.",
  },
  {
    n: "03",
    title: "Download instantly",
    desc: "Your PDFs unlock immediately in My Library, ready to study.",
  },
];

const VALUES = [
  {
    icon: <FaRupeeSign />,
    title: "Affordable for everyone",
    desc: "Student-friendly prices with up to 70% off MRP on every pack.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Secure & reliable",
    desc: "Encrypted payments and short-lived download links keep your account safe.",
  },
  {
    icon: <FaHeadset />,
    title: "Support that cares",
    desc: "Real humans on WhatsApp and Telegram, ready to help you out.",
  },
];

const FAQS = [
  {
    q: "Is the material based on the latest AKTU syllabus?",
    a: "Yes. We regularly update our notes, quantums and syllabus copies to match the latest AKTU curriculum and exam pattern.",
  },
  {
    q: "How soon do I get access after paying?",
    a: "Instantly. As soon as your payment is confirmed, the PDFs unlock in My Library for download — no waiting, no shipping.",
  },
  {
    q: "Can I buy for more than one subject?",
    a: "Absolutely. Add as many items to your cart as you like, or grab a combo pack that bundles notes, PYQs and quantums together.",
  },
  {
    q: "What if I need help with an order?",
    a: "Reach us any time through the Contact page — email, WhatsApp or Telegram. We usually reply within 24 hours.",
  },
];

export default function About() {
  return (
    <div className="pb-16">
      <Seo
        title="About B.Tech eKart — AKTU Study Material, Made Affordable"
        description="Learn about B.Tech eKart: our mission to make quality AKTU B.Tech notes, PYQs, quantums and syllabus affordable and instantly downloadable for every student."
      />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-[#0b1120] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 animate-float-slow rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 animate-float-x rounded-full bg-violet-500/25 blur-3xl" />
        <div className="container-app relative pb-24 pt-16 sm:pt-20">
          <div className="max-w-3xl animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] text-[11px] font-semibold text-indigo-200 backdrop-blur px-3 py-1">
              <FaGraduationCap className="h-3.5 w-3.5" /> For AKTU B.Tech
              students
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-balance sm:text-5xl">
              Study material that helps you{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                score better
              </span>
              , for less.
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-slate-400 sm:text-base">
              B.Tech eKart is a digital store built for AKTU students. We curate
              high-quality notes, previous year papers, quantums, syllabus and
              combo packs — all available for instant download at
              student-friendly prices.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold shadow-[0_10px_28px_-10px_rgba(99,102,241,0.85)] transition-all duration-300 hover:-translate-y-0.5"
              >
                Browse study material
                <FaArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/contact"
                className="rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.12]"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      {/* Sits half over the hero (negative margin) — the hero has extra bottom
          padding so the card overlaps the gradient cleanly, never the page bg. */}
      <section className="container-app relative z-10 -mt-14 sm:-mt-16">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:grid-cols-4 dark:border-white/[0.07] dark:bg-[#0e1526]">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-100 dark:from-indigo-500/10 dark:to-violet-500/10 dark:text-indigo-300 dark:ring-indigo-400/15">
                  {s.icon}
                </span>
                <p className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                  {s.value}
                </p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Mission ---------------- */}
      <section className="container-app mt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionHeader
              title="Our mission"
              subtitle="Quality study resources, instantly accessible to every student"
            />
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p className="leading-relaxed">
                We started B.Tech eKart after seeing how hard it is for students
                to find reliable, exam-focused material — scattered PDFs,
                unclear sources, and expensive coaching notes. Our goal is
                simple: put everything a B.Tech student needs in one place, at a
                price that never gets in the way of learning.
              </p>
              <p className="leading-relaxed">
                Every resource is organised by branch (CSE, IT, ECE, ME, CE, EE)
                and semester (1–8), so you spend less time searching and more
                time studying. Buy once, download instantly, and keep lifetime
                access in your personal library.
              </p>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Exam-focused & concise",
                "Updated for the latest syllabus",
                "Affordable combo packs",
                "Instant, lifetime access",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm">
                  <FaCheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white shadow-elevated">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <FaGraduationCap className="h-12 w-12 text-white/80" />
              <p className="mt-5 font-display text-xl font-bold leading-snug">
                “No waiting, no shipping, no middlemen — just the material you
                need, the moment you need it.”
              </p>
              <p className="mt-4 text-sm text-brand-100">
                — The B.Tech eKart team
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- What we offer ---------------- */}
      <section className="container-app mt-16">
        <Reveal>
          <SectionHeader
            title="What we offer"
            subtitle="Everything you need to prepare, in one place"
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERINGS.map((o, i) => (
            <Reveal key={o.title} delay={(i % 3) * 80}>
              <div className="card-hover h-full p-5">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${TONE_BG[o.tone]}`}
                >
                  {o.icon}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">
                  {o.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {o.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="container-app mt-16">
        <Reveal>
          <SectionHeader
            title="How it works"
            subtitle="From browsing to studying in three simple steps"
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="card relative h-full overflow-hidden p-6">
                <span className="font-display text-4xl font-black text-brand-100 dark:text-gray-800">
                  {s.n}
                </span>
                <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Values ---------------- */}
      <section className="container-app mt-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <div className="card-hover flex h-full gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  {v.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {v.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- FAQs ---------------- */}
      <section className="container-app mt-16">
        <Reveal>
          <SectionHeader title="Frequently asked questions" />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={(i % 2) * 80}>
              <details className="card group h-full p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold text-gray-900 dark:text-gray-100">
                  {f.q}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition group-open:rotate-45 dark:bg-gray-800">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {f.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="container-app mt-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-brand-sheen bg-animated-gradient px-6 py-12 text-center text-white shadow-elevated sm:px-12">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Ready to study smarter?
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-brand-100">
                Explore notes, PYQs and combo packs for your branch and semester
                — download instantly.
              </p>
              <div className="mt-6 flex-wrap justify-center gap-3">
                <Link to="/shop" className="btn-accent">
                  Start shopping <FaArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/contact"
                  className="btn border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                >
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
