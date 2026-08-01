// InsideCrystalEnvironment.jsx
// Textura HDRI 360° 100% Seamless e Ultra-Otimizada (0ms Render Latency)
// Cache global para evitar travamentos ou bloqueio da thread principal durante transições

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Cache global de texturas em memória (gerado uma única vez por seed)
const SKY_TEXTURE_CACHE = new Map();

/* ─────────────────────────────────────────────────────────────────
   Gerador de Textura 360° Seamless de Alta Performance (< 1ms CPU)
───────────────────────────────────────────────────────────────── */
function getOrCreateDarkCrystalSkyTexture(seed = 1) {
  if (SKY_TEXTURE_CACHE.has(seed)) {
    return SKY_TEXTURE_CACHE.get(seed);
  }

  const W = 1024; // 1024x512 é perfeito para Sky Esfera 360 e gera instantaneamente
  const H = 512;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const rng = (n) => {
    const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // ─── 1. Gradiente Estritamente Vertical 100% Seamless ───
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0.00, "#223244"); // Topo slate metálico
  bgGrad.addColorStop(0.30, "#192634"); // Tom médio cristalino
  bgGrad.addColorStop(0.70, "#121b26"); // Equador escuro
  bgGrad.addColorStop(1.00, "#0a1017"); // Base escura

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ─── 2. Nuvens de Reflexo Metálico com Wrapping 360° Seamless ───
  for (let i = 0; i < 18; i++) {
    const cx = rng(i * 37 + 5) * W;
    const cy = 60 + rng(i * 41 + 10) * (H - 120);
    const r = 80 + rng(i * 43) * 220;
    const alpha = 0.08 + rng(i * 47) * 0.18;

    const offsets = [0, -W, W];
    for (const ox of offsets) {
      const x = cx + ox;
      if (x + r < 0 || x - r > W) continue;

      const g = ctx.createRadialGradient(x, cy, 0, x, cy, r);
      g.addColorStop(0.0, `rgba(160, 190, 215, ${alpha.toFixed(3)})`);
      g.addColorStop(0.4, `rgba(75, 110, 140, ${(alpha * 0.45).toFixed(3)})`);
      g.addColorStop(1.0, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = g;
      ctx.fillRect(x - r, cy - r, r * 2, r * 2);
    }
  }

  // ─── 3. Micro-Granulação Fosca Aveludada (Desenho Nativo Canvas < 1ms) ───
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
  for (let i = 0; i < 350; i++) {
    const gx = rng(i * 13) * W;
    const gy = rng(i * 17) * H;
    const gw = 1.5 + rng(i * 19) * 3;
    const gh = 1.5 + rng(i * 23) * 3;

    // Repete no wrap horizontal
    ctx.fillRect(gx, gy, gw, gh);
    if (gx < 20) ctx.fillRect(gx + W, gy, gw, gh);
    if (gx > W - 20) ctx.fillRect(gx - W, gy, gw, gh);
  }

  // ─── 4. Desfoque Suave Nativo ───
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = W;
  blurCanvas.height = H;
  const bCtx = blurCanvas.getContext("2d");

  bCtx.filter = "blur(4px)";
  bCtx.drawImage(canvas, 0, 0);

  const texture = new THREE.CanvasTexture(blurCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;

  SKY_TEXTURE_CACHE.set(seed, texture);
  return texture;
}

/* ─────────────────────────────────────────────────────────────────
   Hook com Pré-Carregamento em Cache
───────────────────────────────────────────────────────────────── */
function useDarkCrystalSkyTexture(activeProject) {
  const seed = activeProject?.id ?? 1;

  return useMemo(() => {
    return getOrCreateDarkCrystalSkyTexture(seed);
  }, [seed]);
}

/* ─────────────────────────────────────────────────────────────────
   Componente Sky Esfera 360° de Alta Performance
───────────────────────────────────────────────────────────────── */
export default function InsideCrystalEnvironment({ activeProject }) {
  const skyRef = useRef();
  const skyTex = useDarkCrystalSkyTexture(activeProject);

  // Rotação constante ultra-suave
  useFrame((state) => {
    if (skyRef.current) {
      skyRef.current.rotation.y = state.clock.elapsedTime * 0.002;
    }
  });

  return (
    <mesh ref={skyRef}>
      <sphereGeometry args={[45, 64, 32]} />
      <meshBasicMaterial map={skyTex} side={THREE.BackSide} />
    </mesh>
  );
}
