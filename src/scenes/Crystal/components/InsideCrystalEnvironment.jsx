// InsideCrystalEnvironment.jsx
// Textura HDRI de Esfera 360° de Vidro Catedral / Gelo Orgânico (Soft Blur Ambient)
// Inspirado na textura de vidro texturizado com gradiente ciano-azul-roxo e desfoque suave

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Gerador da Textura de Vidro Catedral / Gelo Orgânico Desfocado
───────────────────────────────────────────────────────────────── */
function useCathedralGlassSkyTexture(activeProject) {
  const seed = activeProject?.id ?? 1;
  const themeColor = activeProject?.themeColor || "#7eb8e0";

  return useMemo(() => {
    const W = 2048;
    const H = 1024;

    // Canvas principal
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // PRNG determinístico por seed
    const rng = (n) => {
      const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    // ─── 1. Gradiente Base de Vidro Catedral (Ciano → Azul → Violeta) ───
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0.0, "#d8f0ff");  // Ciano claro luminoso no topo
    bgGrad.addColorStop(0.25, "#8ebcf5"); // Azul gelo vibrante
    bgGrad.addColorStop(0.55, "#4873c5"); // Azul royal profundo
    bgGrad.addColorStop(0.82, "#4a3b7d"); // Violeta catedral
    bgGrad.addColorStop(1.0, "#2d204a");  // Indigo escuro na base

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ─── 2. Ondulações Orgânicas e Textura de Vidro Texturizado ───
    const numRipples = 180;
    for (let i = 0; i < numRipples; i++) {
      const y = (i / numRipples) * H + (rng(i * 3) - 0.5) * 40;
      const amplitude = 12 + rng(i * 7) * 35;
      const frequency = 0.005 + rng(i * 11) * 0.015;
      const phase = rng(i * 17) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(0, y);

      for (let x = 0; x <= W; x += 15) {
        const waveY =
          y +
          Math.sin(x * frequency + phase) * amplitude +
          Math.sin(x * frequency * 2.3 + phase * 1.5) * (amplitude * 0.4);
        ctx.lineTo(x, waveY);
      }

      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();

      // Alterna entre relevos claros de reflexo e sombras profundas de refração
      const isHighlight = rng(i * 23) > 0.45;
      if (isHighlight) {
        const alpha = 0.06 + rng(i * 31) * 0.14;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      } else {
        const alpha = 0.05 + rng(i * 37) * 0.12;
        ctx.fillStyle = `rgba(20, 45, 90, ${alpha.toFixed(3)})`;
      }
      ctx.fill();
    }

    // ─── 3. Micro-rugosidade de Gelo (Ruído de Superfície) ───
    for (let i = 0; i < 400; i++) {
      const rx = rng(i * 41) * W;
      const ry = rng(i * 43) * H;
      const rw = 15 + rng(i * 47) * 80;
      const rh = 8 + rng(i * 53) * 40;
      const alpha = 0.03 + rng(i * 59) * 0.09;

      ctx.fillStyle = rng(i * 61) > 0.5
        ? `rgba(255, 255, 255, ${alpha.toFixed(3)})`
        : `rgba(40, 70, 130, ${alpha.toFixed(3)})`;

      ctx.beginPath();
      ctx.ellipse(rx, ry, rw, rh, rng(i * 67) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // ─── 4. Brilho do Tema do Projeto (Overlay Suave) ───
    const themeGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    themeGlow.addColorStop(0, `${themeColor}33`);
    themeGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = themeGlow;
    ctx.fillRect(0, 0, W, H);

    // ─── 5. Desfoque Suave (Soft Ambient Blur) para ser sutil e não roubar atenção ───
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = W;
    blurCanvas.height = H;
    const bCtx = blurCanvas.getContext("2d");

    // Aplica desfoque de 24px para criar atmosfera sonhadora/ambiente
    bCtx.filter = "blur(24px)";
    bCtx.drawImage(canvas, 0, 0);

    const texture = new THREE.CanvasTexture(blurCanvas);
    texture.needsUpdate = true;
    return texture;
  }, [seed, themeColor]);
}

/* ─────────────────────────────────────────────────────────────────
   Componente Sky Esfera 360° de Vidro Catedral Desfocado
───────────────────────────────────────────────────────────────── */
export default function InsideCrystalEnvironment({ activeProject }) {
  const skyRef = useRef();
  const skyTex = useCathedralGlassSkyTexture(activeProject);

  // Rotação suave do teto/paredes cristalinas
  useFrame((state) => {
    if (skyRef.current) {
      skyRef.current.rotation.y = state.clock.elapsedTime * 0.003;
    }
  });

  return (
    <mesh ref={skyRef}>
      <sphereGeometry args={[45, 128, 64]} />
      <meshBasicMaterial map={skyTex} side={THREE.BackSide} />
    </mesh>
  );
}
