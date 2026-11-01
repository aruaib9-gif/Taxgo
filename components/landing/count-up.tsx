"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 1100;

// Counts the leading number up from 0 the first time it scrolls into view ("30–50%" → 0…30 + "–50%").
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    const el = ref.current;
    const match = value.match(/^(\d[\d,]*)(.*)$/);
    if (!el || !match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = parseInt(match[1].replace(/,/g, ""), 10);
    const suffix = match[2];
    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      start ||= now;
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setText(`${Math.round(target * eased)}${suffix}`);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          setText(`0${suffix}`);
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [value]);

  return <span ref={ref}>{text}</span>;
}
