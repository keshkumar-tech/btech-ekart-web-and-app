// Contact page — hero, support channels, message form, hours and quick answers.

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEnvelope,
  FaPhone,
  FaWhatsapp,
  FaTelegram,
  FaPaperPlane,
  FaHeadset,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaQuestionCircle,
  FaBookOpen,
  FaUndoAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { Reveal } from "@/hooks/useReveal";
import { SectionHeader } from "@/components/ui";
import Select from "@/components/store/Select";

const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "support@btechekart.com";
const WHATSAPP = import.meta.env.VITE_WHATSAPP_LINK || "#";
const TELEGRAM = import.meta.env.VITE_TELEGRAM_LINK || "#";

const CHANNELS = [
  {
    icon: <FaWhatsapp />,
    label: "WhatsApp",
    value: "Chat with support",
    href: WHATSAPP,
    tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    note: "Fastest — usually a few minutes",
  },
  {
    icon: <FaTelegram />,
    label: "Telegram",
    value: "Join our channel",
    href: TELEGRAM,
    tone: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
    note: "Updates & new material alerts",
  },
  {
    icon: <FaEnvelope />,
    label: "Email",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    tone: "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
    note: "Best for order & payment issues",
  },
  {
    icon: <FaPhone />,
    label: "Phone",
    value: "+91 99999 99999",
    href: "tel:+919999",
    tone: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    note: "Mon–Sat, 10am – 7pm IST",
  },
];

const HOURS = [
  { day: "Monday – Friday", time: "10:00 AM – 7:00 PM" },
  { day: "Saturday", time: "10:00 AM – 5:00 PM" },
  { day: "Sunday", time: "Closed (email us)" },
];

const QUICK_HELP = [
  {
    icon: <FaBookOpen />,
    title: "Order or download issue?",
    desc: "Have your order ID handy and we will sort it out quickly.",
    to: "/orders",
    cta: "My Orders",
  },
  {
    icon: <FaUndoAlt />,
    title: "Need a refund?",
    desc: "Read our refund policy to see when you are eligible.",
    to: "/refund",
    cta: "Refund Policy",
  },
  {
    icon: <FaQuestionCircle />,
    title: "New here?",
    desc: "Learn how instant download and lifetime access work.",
    to: "/about",
    cta: "About us",
  },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    // Front-end only: confirm receipt. Wire to an API endpoint when available.
    toast.success("Thanks! We will get back to you within 24 hours.");
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <div className="pb-16">
      <Seo
        title="Contact B.Tech eKart — Support for Orders, Payments & Downloads"
        description="Get in touch with B.Tech eKart support via email, WhatsApp or Telegram. We help with orders, payments, downloads and any questions about AKTU study material."
      />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-brand-sheen bg-animated-gradient text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="container-app relative pb-24 pt-16 text-center sm:pt-20">
          <div className="mx-auto max-w-2xl animate-fade-up">
            <span className="badge mx-auto bg-white/15 text-white backdrop-blur">
              <FaHeadset className="h-3.5 w-3.5" /> We&apos;re here to help
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Get in touch
            </h1>
            <p className="mt-4 text-brand-100 sm:text-lg">
              Questions about an order, a payment, or our study material? Reach
              out through any channel below — we usually reply within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Channels ---------------- */}
      {/* Overlaps the hero by half a card — hero padding makes it land cleanly. */}
      <section className="container-app relative z-10 -mt-14 sm:-mt-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.label} delay={i * 70}>
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="card-hover flex h-full flex-col gap-3 p-5"
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl text-lg ${c.tone}`}
                >
                  {c.icon}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {c.label}
                  </p>
                  <p className="truncate text-sm text-brand-600 dark:text-brand-400">
                    {c.value}
                  </p>
                </div>
                <p className="mt-auto text-xs text-gray-500 dark:text-gray-400">
                  {c.note}
                </p>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Form + info ---------------- */}
      <section className="container-app mt-14">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form */}
          <Reveal className="lg:col-span-3">
            <div className="card p-6 sm:p-8">
              <SectionHeader
                title="Send us a message"
                subtitle="Fill in the form and we'll get back to you by email"
              />

              {sent && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Message received. We&apos;ll reply within 24 hours.
                </div>
              )}

              <form onSubmit={submitContact} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="c-name">
                      Your name
                    </label>
                    <input
                      id="c-name"
                      required
                      className="input"
                      placeholder="e.g. Aarav Sharma"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="c-email">
                      Email address
                    </label>
                    <input
                      id="c-email"
                      required
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="c-subject">
                    Subject
                  </label>
                  <Select
                    variant="field"
                    className="w-full"
                    value={form.subject}
                    onChange={(v) => setForm({ ...form, subject: v })}
                    options={[
                      { value: "", label: "Choose a topic…" },
                      { value: "Order or download issue", label: "Order or download issue" },
                      { value: "Payment / refund", label: "Payment / refund" },
                      { value: "Question about study material", label: "Question about study material" },
                      { value: "Report a problem", label: "Report a problem" },
                      { value: "Something else", label: "Something else" },
                    ]}
                    label="Subject"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="c-message">
                    Message
                  </label>
                  <textarea
                    id="c-message"
                    required
                    className="input min-h-32"
                    placeholder="Tell us how we can help — include your order ID if you have one."
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                </div>

                <button type="submit" className="btn-primary w-full sm:w-auto">
                  <FaPaperPlane /> Send Message
                </button>
              </form>
            </div>
          </Reveal>

          {/* Info column */}
          <div className="space-y-4 lg:col-span-2">
            <Reveal delay={100}>
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
                  <FaClock className="text-brand-500" /> Support hours
                </h3>
                <ul className="mt-4 space-y-2 text-sm">
                  {HOURS.map((h) => (
                    <li
                      key={h.day}
                      className="flex items-center justify-between border-b border-dashed pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {h.day}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {h.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
                  <FaMapMarkerAlt className="text-brand-500" /> Where we are
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  B.Tech eKart is an online-only store. We&apos;re based in
                  Lucknow, Uttar Pradesh, and serve students across all
                  AKTU-affiliated colleges in India.
                </p>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Since everything is digital, there&apos;s no pickup or
                  delivery — you get your material instantly online.
                </p>
              </div>
            </Reveal>

            <Reveal delay={220}>
              <div className="card bg-brand-50 p-6 dark:bg-brand-900/20">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  Quick response tips
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex gap-2">
                    <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Include your order ID for order-related queries.
                  </li>
                  <li className="flex gap-2">
                    <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Mention your branch and semester for material questions.
                  </li>
                  <li className="flex gap-2">
                    <FaCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Attach a screenshot for payment issues.
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Quick help ---------------- */}
      <section className="container-app mt-14">
        <Reveal>
          <SectionHeader
            title="Looking for something specific?"
            subtitle="These pages answer the most common questions"
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_HELP.map((q, i) => (
            <Reveal key={q.title} delay={i * 90}>
              <Link to={q.to} className="card-hover block h-full p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  {q.icon}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">
                  {q.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                  {q.desc}
                </p>
                <span className="link mt-3 inline-block text-sm font-semibold">
                  {q.cta} →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
