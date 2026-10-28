// Brand mark: a graduation cap sitting on an open book ("study" + "eKart"),
// inside a gradient squircle with a subtle gloss. Pure SVG so it stays crisp
// at every size and adapts to both themes.
import clsx from "clsx";

export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="B.Tech eKart"
      className={clsx("shrink-0", className)}
    >
      <defs>
        <linearGradient
          id="ek-grad"
          x1="4"
          y1="2"
          x2="36"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F8EF7" />
          <stop offset="0.55" stopColor="#3B63F0" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient
          id="ek-gloss"
          x1="20"
          y1="0"
          x2="20"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="ek-cap"
          x1="12"
          y1="11"
          x2="28"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DDE6FF" />
        </linearGradient>
      </defs>

      {/* Squircle tile */}
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#ek-grad)" />
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#ek-gloss)" />
      <rect
        x="1.6"
        y="1.6"
        width="36.8"
        height="36.8"
        rx="10.5"
        stroke="#fff"
        strokeOpacity="0.22"
      />

      {/* Graduation cap */}
      <path d="M20 8.5 32 13.3 20 18.1 8 13.3 20 8.5Z" fill="url(#ek-cap)" />
      <path
        d="M13.4 15.9v3.4c0 1.6 2.9 2.9 6.6 2.9s6.6-1.3 6.6-2.9v-3.4"
        stroke="#E7EDFF"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M31.4 14.2v5.1"
        stroke="#FFD233"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="31.4" cy="20.4" r="1.4" fill="#FFD233" />

      {/* Open book */}
      <path
        d="M20 25.1c-2.4-1.7-5.1-2.3-8.2-2v7.1c3.1-.3 5.8.3 8.2 2 2.4-1.7 5.1-2.3 8.2-2v-7.1c-3.1-.3-5.8.3-8.2 2Z"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />
      <path
        d="M20 25.3v6.9"
        stroke="#5B7BF5"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  size = 36,
  showText = true,
  className,
  dark,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
  /** Force the light-on-dark wordmark (used inside the dark footer). */
  dark?: boolean;
}) {
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {showText && (
        <span
          className={clsx(
            "flex flex-col leading-none",
            dark ? "text-white" : "text-slate-900 dark:text-white",
          )}
        >
          <span className="font-display text-[15.5px] font-extrabold tracking-[-0.02em]">
            B.Tech{" "}
            <span className="bg-gradient-to-r from-brand-500 to-violet-600 bg-clip-text text-transparent">
              eKart
            </span>
          </span>
          <span
            className={clsx(
              "mt-1 text-[8.5px] font-bold uppercase tracking-[0.18em]",
              dark ? "text-slate-500" : "text-slate-400 dark:text-slate-500",
            )}
          >
            AKTU Study Store
          </span>
        </span>
      )}
    </span>
  );
}
