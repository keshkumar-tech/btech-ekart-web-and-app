// Floating WhatsApp / Telegram support buttons (bottom-right).
import { useState } from "react";
import { FaWhatsapp, FaTelegram, FaCommentDots, FaTimes } from "react-icons/fa";

export default function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const whatsapp =
    import.meta.env.VITE_WHATSAPP_LINK || "https://wa.me/919999999999";
  const telegram =
    import.meta.env.VITE_TELEGRAM_LINK || "https://t.me/btechekart";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex animate-fade-in items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 font-semibold text-white shadow-hover transition hover:bg-emerald-600"
          >
            <FaWhatsapp className="h-5 w-5" /> WhatsApp
          </a>
          <a
            href={telegram}
            target="_blank"
            rel="noreferrer"
            className="flex animate-fade-in items-center gap-2 rounded-full bg-sky-500 px-4 py-3 font-semibold text-white shadow-hover transition hover:bg-sky-600"
          >
            <FaTelegram className="h-5 w-5" /> Telegram
          </a>
        </>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Contact support"
        className="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-white shadow-hover transition hover:bg-brand-600"
      >
        {open ? (
          <FaTimes className="h-6 w-6" />
        ) : (
          <FaCommentDots className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
