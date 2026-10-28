// Static store copy mirrored from the web app so both surfaces stay in sync:
// home FAQ, About page, the four legal pages and the Contact page quick links.

export const HOME_FAQS: { q: string; a: string }[] = [
  {
    q: "What exactly will I get after paying?",
    a: "You get instant access to the PDF you purchased inside My Library, plus a download link on the order confirmation page. Files are high-quality, exam-oriented PDFs you can read on phone, tablet or laptop.",
  },
  {
    q: "How fast is the delivery?",
    a: "Immediately. As soon as the payment is confirmed, the item unlocks in My Library — there is no shipping and nothing to wait for.",
  },
  {
    q: "Which payment methods do you support?",
    a: "Online payments through Razorpay (UPI, credit/debit cards, netbanking and wallets) and a manual UPI/QR option where you scan our QR, pay, and submit the UTR for verification.",
  },
  {
    q: "Are the notes updated for the latest AKTU syllabus?",
    a: "Yes. All material is prepared and revised against the current AKTU syllabus and previous year papers, so you study exactly what is in the exam.",
  },
  {
    q: "Is my payment secure?",
    a: "Absolutely. Card and UPI details are handled entirely by our payment gateway — we never see or store your card number or UPI PIN.",
  },
  {
    q: "Can I download the same file again later?",
    a: "Yes. Every purchase stays in My Library with lifetime access, and each file allows multiple downloads. If a download limit ever blocks you, contact support and we will reset it.",
  },
  {
    q: "Do you cover my branch and semester?",
    a: "We cover CSE, IT, ECE, ME, CE and EE across semesters 1 to 8. Use the branch and semester filters on the Shop page to see exactly what is available for you.",
  },
  {
    q: "Can I buy a single subject instead of a full combo?",
    a: "Yes. Every subject is available individually, and combo packs bundle notes + PYQs + quantums at a lower combined price if you want the full package.",
  },
  {
    q: "What if I need help with an order?",
    a: "Reach us on WhatsApp, Telegram or email from the Contact page. We usually reply within a few hours, and always within 24 hours.",
  },
  {
    q: "Do you offer refunds?",
    a: "Because these are instant digital downloads, refunds are limited to cases of duplicate payment or a corrupted/undelivered file. See our Refund Policy for the full details.",
  },
  {
    q: "Why do I need to log in before adding to cart?",
    a: "Your cart, wishlist and purchases are tied to your account so your files stay accessible across devices and after reinstalling the app. Logging in takes seconds and keeps everything in one place.",
  },
  {
    q: "Can I share the PDF with my friends?",
    a: "No. Every file is licensed for your personal study only. Sharing or reselling copies is not allowed and accounts doing so may be suspended.",
  },
  {
    q: "Will I get notifications about new uploads?",
    a: "Yes — subscribe to our email list or join the Telegram channel and you will hear about new notes, PYQ sets and combo drops first, along with occasional discount codes.",
  },
  {
    q: "Are the reviews on this site from real students?",
    a: "Only verified buyers can review a product. Reviews are moderated, and every review you see on a product page comes from a student who actually purchased that file.",
  },
];

// ---------------------------------------------------------------- About page

export const ABOUT_STATS = [
  { value: "500+", label: "Study resources", icon: "book-outline" as const },
  {
    value: "6",
    label: "Engineering branches",
    icon: "school-outline" as const,
  },
  { value: "8", label: "Semesters covered", icon: "list-outline" as const },
  { value: "10k+", label: "Happy students", icon: "star-outline" as const },
];

export const ABOUT_MISSION = [
  "We started B.Tech eKart after seeing how hard it is for students to find reliable, exam-focused material — scattered PDFs, unclear sources, and expensive coaching notes. Our goal is simple: put everything a B.Tech student needs in one place, at a price that never gets in the way of learning.",
  "Every resource is organised by branch (CSE, IT, ECE, ME, CE, EE) and semester (1–8), so you spend less time searching and more time studying. Buy once, download instantly, and keep lifetime access in your personal library.",
];

export const ABOUT_HIGHLIGHTS = [
  "Exam-focused & concise",
  "Updated for the latest syllabus",
  "Affordable combo packs",
  "Instant, lifetime access",
];

export const ABOUT_OFFERINGS = [
  {
    title: "Handwritten Notes",
    desc: "Complete, exam-focused notes for every subject — clear, concise and easy to revise.",
    icon: "book-outline" as const,
    tone: "#2563eb",
  },
  {
    title: "Previous Year Questions",
    desc: "Solved AKTU question papers from 2018 onwards, grouped topic-wise for smart practice.",
    icon: "document-text-outline" as const,
    tone: "#7c3aed",
  },
  {
    title: "Quantums",
    desc: "The most-repeated important questions that actually appear in exams.",
    icon: "flash-outline" as const,
    tone: "#d97706",
  },
  {
    title: "Latest Syllabus",
    desc: "Up-to-date AKTU syllabus copies so you always know exactly what to study.",
    icon: "clipboard-outline" as const,
    tone: "#059669",
  },
  {
    title: "Combo Packs",
    desc: "Notes + PYQ + Quantum bundled together at a big discount — best value for money.",
    icon: "cube-outline" as const,
    tone: "#e11d48",
  },
  {
    title: "Instant Download",
    desc: "Pay once and download immediately. Lifetime access from your personal library.",
    icon: "cloud-download-outline" as const,
    tone: "#0284c7",
  },
];

export const ABOUT_STEPS = [
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

export const ABOUT_VALUES = [
  {
    title: "Affordable for everyone",
    desc: "Student-friendly prices with up to 70% off MRP on every pack.",
    icon: "pricetag-outline" as const,
  },
  {
    title: "Secure & reliable",
    desc: "Encrypted payments and short-lived download links keep your account safe.",
    icon: "shield-checkmark-outline" as const,
  },
  {
    title: "Support that cares",
    desc: "Real humans on WhatsApp and Telegram, ready to help you out.",
    icon: "headset-outline" as const,
  },
];

export const ABOUT_FAQS = [
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

// -------------------------------------------------------------- Contact page

export const SUPPORT_HOURS = [
  { day: "Monday – Friday", time: "10:00 AM – 7:00 PM" },
  { day: "Saturday", time: "10:00 AM – 5:00 PM" },
  { day: "Sunday", time: "Closed (email us)" },
];

export const CONTACT_TOPICS = [
  "Order or download issue",
  "Payment / refund",
  "Question about study material",
  "Report a problem",
  "Something else",
];

// ------------------------------------------------------------- Legal pages

export type LegalBlock = { h?: string; p?: string[] };

export type LegalPageKey = "terms" | "privacy" | "refund" | "disclaimer";

export const LEGAL_PAGES: Record<
  LegalPageKey,
  { title: string; body: LegalBlock[] }
> = {
  terms: {
    title: "Terms & Conditions",
    body: [
      {
        h: "1. Acceptance of Terms",
        p: [
          "By using B.Tech eKart, you agree to these terms. If you do not agree, please do not use the platform.",
        ],
      },
      {
        h: "2. Digital Goods",
        p: [
          "All products are digital downloads (PDF). Once purchased and unlocked, they are delivered electronically and cannot be returned.",
        ],
      },
      {
        h: "3. Licence & Usage",
        p: [
          "Purchased material is licensed for your personal, non-commercial study use only. Redistribution, resale, or public sharing is strictly prohibited and may result in account termination without refund.",
        ],
      },
      {
        h: "4. Payments",
        p: [
          "Payments are processed via Razorpay or manual UPI/QR. Access to purchased material is unlocked only after payment verification.",
        ],
      },
      {
        h: "5. Downloads",
        p: [
          "Each purchase has a per-user download limit to prevent misuse. Watermarks may be applied to identify the licensed buyer.",
        ],
      },
      {
        h: "6. Account",
        p: [
          "You are responsible for maintaining the confidentiality of your account credentials.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      {
        h: "Information We Collect",
        p: [
          "We collect your name, email, phone, college/branch details, and order information to deliver your purchases and provide support.",
        ],
      },
      {
        h: "How We Use It",
        p: [
          "Your data is used to process orders, send order confirmations and invoices, verify payments, and improve our service. We never sell your data.",
        ],
      },
      {
        h: "Payments",
        p: [
          "Payment details are handled by our payment gateway (Razorpay). We do not store your card or banking credentials.",
        ],
      },
      {
        h: "Security",
        p: [
          "Passwords are hashed, connections are HTTPS-only, and purchased files are delivered via short-lived signed URLs restricted to your account.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    body: [
      {
        h: "Digital Products",
        p: [
          "Because our products are digital and delivered instantly, they are generally non-refundable once accessed.",
        ],
      },
      {
        h: "When Refunds Apply",
        p: [
          "If you were charged twice, paid but never received access, or the file is corrupted/unusable and we cannot fix it, you are eligible for a full refund.",
        ],
      },
      {
        h: "How to Request",
        p: [
          "Email our support with your order number and the issue within 7 days of purchase. Approved refunds are processed to the original payment method within 5–7 business days.",
        ],
      },
      {
        h: "Manual UPI Payments",
        p: [
          "For QR/UTR payments, contact support with your order ID and transaction reference.",
        ],
      },
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    body: [
      {
        p: [
          "B.Tech eKart is an independent study-material platform and is not affiliated with, endorsed by, or connected to Dr. A.P.J. Abdul Kalam Technical University (AKTU) or any of its affiliated colleges.",
        ],
      },
      {
        p: [
          "All notes and study material are created/compiled by us and independent contributors for reference and study support. They do not replace official university textbooks or the official syllabus.",
        ],
      },
      {
        p: [
          "While we take care to keep content accurate and up to date, we do not guarantee that material is free of errors or that it matches the latest university changes. Students are advised to cross-verify with the official AKTU sources.",
        ],
      },
    ],
  },
};

export const SUPPORT_EMAIL = "support@btechekart.com";
export const SUPPORT_PHONE = "+91 99999 99999";
export const WHATSAPP_LINK = "https://wa.me/919999999999";
export const TELEGRAM_LINK = "https://t.me/btechekart";
