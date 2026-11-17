import { useEffect, useRef } from "react";

/** Couleurs de l'app : verts de l'UASZ, citron, or, et deux touches vives. */
const COLORS = ["#1b9a76", "#9bc227", "#18453c", "#e0a526", "#e4577f", "#4a7fe0"];

/**
 * Pluie de confettis (≈1,8 s) dessinée sur un canevas, sans bibliothèque.
 * Une seule fois par `id` et par téléphone ; jamais si le téléphone demande moins d'animations.
 */
export function Confetti({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const key = "mem:confetti";
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const done: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (done.includes(id)) return;
      localStorage.setItem(key, JSON.stringify([...done, id].slice(-100)));
    } catch {
      return;
    }

    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Deux jets partis des coins bas, vers le centre de l'écran.
    const parts = Array.from({ length: 110 }, (_, i) => {
      const left = i % 2 === 0;
      const angle = (left ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7;
      const speed = 9 + Math.random() * 7;
      return {
        x: left ? 0 : w,
        y: h * 0.75,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length] as string,
        round: Math.random() < 0.3,
      };
    });

    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 1200) / 600);
      for (const p of parts) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (elapsed < 1800) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [id]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-dvh w-screen"
    />
  );
}
