// InsideCrystalEnvironment.jsx
// Textura HDRI de Esfera 360° de Vidro Fosco Prateado / Frosted Glass Ambient
// Recria exatamente a estética de vidro jateado fosco prateado com iluminação difusa suave

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Gerador de Textura de Vidro Fosco Prateado (Sandblasted Frosted Glass)
───────────────────────────────────────────────────────────────── */
function useFrostedGlassSkyTexture(activeProject) {
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

    // ─── 1. Fundo Gradiente Prateado / Cinza-Gelo Fosco ───
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0.0, "#dce5ed"); // Prata gelo claro topo-esquerdo
    bgGrad.addColorStop(0.35, "#eef4fa"); // Prata branco luminoso centro-esquerda
    bgGrad.addColorStop(0.65, "#d5e0ea"); // Cinza-prata fosco centro-direita
    bgGrad.addColorStop(1.0, "#b8c6d4"); // Slate prata nas bordas

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ─── 2. Nuvens de Iluminação Difusa Suave (Softbox Glow Pass) ───
    for (let i = 0; i < 18; i++) {
      const cx = rng(i * 37 + 5) * W;
      const cy = rng(i * 41 + 10) * H;
      const r = 180 + rng(i * 43) * 450;
      const alpha = 0.15 + rng(i * 47) * 0.35;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(2)})`);
      g.addColorStop(0.5, `rgba(240, 246, 252, ${(alpha * 0.5).toFixed(2)})`);
      g.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    // ─── 3. Micro-Grânulos de Vidro Jateado (Sandblasted Frosted Grain) ───
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;

        // Ruído de alta frequência determinístico tipo vidro jateado
        const n1 = rng(x * 12.9898 + y * 78.233);
        const n2 = rng(x * 39.421 + y * 11.149);
        const grain = (n1 - 0.5) * 24 + (n2 - 0.5) * 12;

        data[idx]     = Math.min(255, Math.max(0, data[idx] + grain));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain + 2)); // sutil toque frio
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // ─── 4. Passagem de Desfoque Fino (Soft Frosted Diffusion) ───
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = W;
    blurCanvas.height = H;
    const bCtx = blurCanvas.getContext("2d");

    // Desfoque leve de 4px para manter o grão de vidro fosco visível e sutil
    bCtx.filter = "blur(4px)";
    bCtx.drawImage(canvas, 0, 0);

    const texture = new THREE.CanvasTexture(blurCanvas);
    texture.needsUpdate = true;
    return texture;
  }, [seed]);
}

/* ─────────────────────────────────────────────────────────────────
   Componente Sky Esfera 360° de Vidro Fosco Prateado
───────────────────────────────────────────────────────────────── */
export default function InsideCrystalEnvironment({ activeProject }) {
  const skyRef = useRef();
  const skyTex = useFrostedGlassSkyTexture(activeProject);

  // Rotação sutil do ambiente
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
