import { useEffect, useRef, useState } from 'react';

// IntersectionObserver-based reveal-on-scroll. Adds `.is-visible` when in view.
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px', ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return { ref, visible };
}

// Animated number counter, eases from the previous value to `value` when `active`.
// Never returns 0 while idle — always shows the real value immediately.
export function useCountUp(value: number, active: boolean, duration = 1400) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = display;
    const to = value;
    if (from === to) return;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, active, duration]);

  return display;
}
