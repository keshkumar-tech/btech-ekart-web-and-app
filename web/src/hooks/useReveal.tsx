// Scroll-reveal animations, the idiomatic React way.
//
// Two ways to use it:
//   1. `useReveal()` returns a ref — attach it to any element and it fades/slides
//      in the first time it enters the viewport.
//   2. `<Reveal>` wraps children and does the same, with an optional stagger
//      delay so a row of cards animates in one after another.
//
// The animation is done with the `.reveal` / `.reveal-visible` utility classes
// (see index.css) and is skipped entirely when the user prefers reduced motion.

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Observe an element and report once it has scrolled into view.
 * Stays `true` afterwards so content never flickers back out.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {
    threshold: 0.05,
    rootMargin: "0px 0px 0px 0px",
  },
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No observer support, or motion is reduced: show immediately.
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      setInView(true);
      return;
    }

    // If the element is already on screen at mount, reveal it right away —
    // the observer does not reliably fire for already-visible nodes.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh && rect.bottom > 0) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, options);
    obs.observe(el);

    // Fail-safe: never leave content permanently invisible. If the observer has
    // not fired within a few seconds (odd viewports, headless renderers, …),
    // reveal it anyway.
    const failSafe = window.setTimeout(() => setInView(true), 2500);

    return () => {
      obs.disconnect();
      window.clearTimeout(failSafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, inView };
}

interface RevealProps {
  children: ReactNode;
  /** Extra classes applied to the wrapper. */
  className?: string;
  /** Delay before the animation starts, in ms (used for staggering). */
  delay?: number;
  /** Render as a different element, e.g. "section" or "li". */
  as?: "div" | "section" | "li" | "article";
}

/** Fade + slide an element in when it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref as never}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={clsx("reveal", inView && "reveal-visible", className)}
    >
      {children}
    </Tag>
  );
}
