// InsideCrystalEnvironment.jsx
// Textura HDRI 360° 100% Seamless (Sem Costuras / Sem Linha de Junção / Fundo Infinito)
// Cristal Metálico Escuro Fosco (Dark Slate Metallic Frosted Glass)

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Gerador de Textura 360° 100% Seamless (Equiretangular Perfeito)
───────────────────────────────────────────────────────────────── */
function useDarkCrystalSkyTexture(activeProject) {
  const seed = activeProject?.id ?? 1;

  return useMemo(() => {
    const W = 2048;
    const H = 1024;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // PRNG determinístico por seed
    const rng = (n) => {
      const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    // ─── 1. Gradiente Estritamente Vertical (x=0 e x=W são 100% idênticos) ───
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0.00, "#223244"); // Zenith / Topo slate azul metálico
    bgGrad.addColorStop(0.30, "#192634"); // Tom médio cristalino escuro
    bgGrad.addColorStop(0.70, "#121b26"); // Equador obsidiana escuro
    bgGrad.addColorStop(1.00, "#0a1017"); // Nadir / Base escura

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ─── 2. Nuvens de Reflexo Metálico com Wrapping Horizontal 360° ───
    for (let i = 0; i < 20; i++) {
      const cx = rng(i * 37 + 5) * W;
      const cy = 100 + rng(i * 41 + 10) * (H - 200); // evita pólos extremados
      const r = 140 + rng(i * 43) * 360;
      const alpha = 0.08 + rng(i * 47) * 0.20;

      // Desenha a nuvem luminosa com repetição para x < 0 e x > W (Seamless Wrap)
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

    // ─── 3. Micro-Grânulos Foscos Periodicamentes Perfeitos (Seamless Noise) ───
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;

        // Ruído periódico horizontal usando sin/cos de 2*PI*x/W
        const uAngle = (x / W) * Math.PI * 2;
        const vAngle = (y / H) * Math.PI;

        const nx = Math.cos(uAngle) * 15.0;
        const ny = Math.sin(uAngle) * 15.0;
        const nz = Math.sin(vAngle) * 15.0;

        const n1 = rng(nx * 12.9898 + ny * 78.233 + nz * 45.164);
        const n2 = rng(nx * 39.421 + ny * 11.149 + nz * 93.712);
        const grain = (n1 - 0.5) * 16 + (n2 - 0.5) * 8;

        data[idx]     = Math.min(255, Math.max(0, data[idx] + grain * 0.8));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain * 0.9));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain * 1.1));
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // ─── 4. Passagem de Desfoque Fino (Soft Diffusion) ───
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = W;
    blurCanvas.height = H;
    const bCtx = blurCanvas.getContext("2d");

    bCtx.filter = "blur(6px)";
    bCtx.drawImage(canvas, 0, 0);

    const texture = new THREE.CanvasTexture(blurCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }, [seed]);
}

/* ─────────────────────────────────────────────────────────────────
   Componente Sky Esfera 360° Sem Costuras (Seamless Infinite Sky)
───────────────────────────────────────────────────────────────── */
export default function InsideCrystalEnvironment({ activeProject }) {
  const skyRef = useRef();
  const skyTex = useDarkCrystalSkyTexture(activeProject);

  // Rotação suave sem solavancos
  useFrame((state) => {
    if (skyRef.current) {
      skyRef.current.rotation.y = state.clock.elapsedTime * 0.002;
    }
  });

  return (
    <mesh ref={skyRef}>
      <sphereGeometry args={[45, 128, 64]} />
      <meshBasicMaterial map={skyTex} side={THREE.BackSide} />
    </mesh>
  );
}
