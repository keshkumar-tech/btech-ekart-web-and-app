import Seo from "@/components/Seo";

type PageKey =
  | "terms"
  | "privacy"
  | "refund"
  | "disclaimer";

const CONTENT: Record<
  PageKey,
  { title: string; body: { h?: string; p?: string[] }[] }
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

export default function StaticPage({ page }: { page: PageKey }) {
  const c = CONTENT[page];

  return (
    <div className="container-app max-w-3xl py-10">
      <Seo title={c.title} />
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
        {c.title}
      </h1>
      <div className="mt-6 space-y-6">
        {c.body.map((block, i) => (
          <div key={i}>
            {block.h && (
              <h2 className="mb-1 font-bold text-gray-900 dark:text-gray-100">
                {block.h}
              </h2>
            )}
            {block.p?.map((para, j) => (
              <p
                key={j}
                className="mb-2 leading-relaxed text-gray-600 dark:text-gray-300"
              >
                {para}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
