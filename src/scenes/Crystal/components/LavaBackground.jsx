// LavaBackground.jsx
// Fundo dinâmico estilo abajur de lava — sombras escuras sobre cinza

import { useRef, useEffect } from "react";

const SCALE = 0.5;
const BLUR = 40;
const OPACITY = 0.5;
const BG_GRAY = [143, 151, 161]; // #8f97a1

const DEFAULT_BLOBS = [
  // Par 1: canto superior-esquerdo ↔ inferior-direito
  { cx: 0.25, cy: 0.3, radius: 160, phase: 0, speedX: 0.12, speedY: 0.1 },
  { cx: 0.75, cy: 0.7, radius: 160, phase: Math.PI, speedX: 0.12, speedY: 0.1 },
  // Par 2: canto superior-direito ↔ inferior-esquerdo
  { cx: 0.75, cy: 0.25, radius: 150, phase: 1.5, speedX: 0.1, speedY: 0.13 },
  { cx: 0.25, cy: 0.75, radius: 150, phase: 1.5 + Math.PI, speedX: 0.1, speedY: 0.13 },
  // Par 3: lateral esquerda ↔ direita
  { cx: 0.15, cy: 0.5, radius: 170, phase: 3, speedX: 0.09, speedY: 0.11 },
  { cx: 0.85, cy: 0.5, radius: 170, phase: 3 + Math.PI, speedX: 0.09, speedY: 0.11 },
  // Par 4: topo ↔ base
  { cx: 0.5, cy: 0.15, radius: 155, phase: 4.5, speedX: 0.11, speedY: 0.08 },
  { cx: 0.5, cy: 0.85, radius: 155, phase: 4.5 + Math.PI, speedX: 0.11, speedY: 0.08 },
];

export default function LavaBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animId;
    let startTime = performance.now();

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * SCALE);
      canvas.height = Math.floor(window.innerHeight * SCALE);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (now) => {
      const t = (now - startTime) / 1000;
      const { width, height } = canvas;

      // Fill gray background
      ctx.fillStyle = `rgb(${BG_GRAY[0]},${BG_GRAY[1]},${BG_GRAY[2]})`;
      ctx.fillRect(0, 0, width, height);

      // Compute blob positions with organic movement
      const positions = DEFAULT_BLOBS.map((b) => ({
        x: (b.cx + Math.sin(t * b.speedX + b.phase) * 0.15 + Math.cos(t * b.speedX * 0.6 + b.phase * 2) * 0.1) * width,
        y: (b.cy + Math.cos(t * b.speedY + b.phase) * 0.12 + Math.sin(t * b.speedY * 0.7 + b.phase * 3) * 0.08) * height,
        r: b.radius * Math.min(width, height) / 500,
      }));

      // Render dark shadow blobs via metaball field
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          let field = 0;
          for (let i = 0; i < positions.length; i++) {
            const blob = positions[i];
            const dx = px - blob.x;
            const dy = py - blob.y;
            const distSq = dx * dx + dy * dy;
            field += (blob.r * blob.r) / (distSq + 1);
          }

          const idx = (py * width + px) * 4;
          if (field > 1.0) {
            const shadow = Math.min((field - 1.0) * 0.4, 0.7);
            data[idx] = BG_GRAY[0] * (1 - shadow);
            data[idx + 1] = BG_GRAY[1] * (1 - shadow);
            data[idx + 2] = BG_GRAY[2] * (1 - shadow);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="lava-bg">
      <canvas
        ref={canvasRef}
        style={{ filter: `blur(${BLUR}px)`, opacity: OPACITY }}
      />
    </div>
  );
}
