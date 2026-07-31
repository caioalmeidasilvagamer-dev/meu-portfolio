// InsideCrystalEnvironment.jsx
// Textura HDRI de Esfera 360° de Cristal de Rocha / Slate Metálico Escuro (Dark Frosted Crystal Ambient)
// Recria exatamente a estética escura de cristal de rocha azul-cinza metálico com reflexos difusos

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Gerador de Textura de Cristal Metálico Escuro (Dark Slate Frosted Crystal)
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

    // ─── 1. Fundo Gradiente Slate Escuro (Azul-Cinza Metálico Profundo) ───
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0.0, "#2c3e52"); // Slate azul metálico no topo-esquerdo
    bgGrad.addColorStop(0.35, "#1e2c3c"); // Tom médio cristalino escuro
    bgGrad.addColorStop(0.70, "#15202c"); // Azul obsidiana escuro
    bgGrad.addColorStop(1.0, "#0b121a");  // Base quase preta slate

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ─── 2. Nuvens de Reflexo Metálico / Specular Highlights Escuros ───
    for (let i = 0; i < 22; i++) {
      const cx = rng(i * 37 + 5) * W;
      const cy = rng(i * 41 + 10) * H;
      const r = 120 + rng(i * 43) * 380;
      const alpha = 0.08 + rng(i * 47) * 0.22;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(165, 195, 220, ${alpha.toFixed(2)})`);
      g.addColorStop(0.4, `rgba(80, 115, 145, ${(alpha * 0.5).toFixed(2)})`);
      g.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    // ─── 3. Micro-Grânulos de Rocha/Gelo Escuro (Dark Frosted Grain) ───
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;

        // Ruído sutil determinístico de granulação fosca sobre a pedra metálica escura
        const n1 = rng(x * 12.9898 + y * 78.233);
        const n2 = rng(x * 39.421 + y * 11.149);
        const grain = (n1 - 0.5) * 18 + (n2 - 0.5) * 9;

        data[idx]     = Math.min(255, Math.max(0, data[idx] + grain * 0.8));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain * 0.9));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain * 1.1)); // tom azul metálico
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // ─── 4. Passagem de Desfoque Fino (Soft Dark Diffusion) ───
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = W;
    blurCanvas.height = H;
    const bCtx = blurCanvas.getContext("2d");

    // Desfoque leve de 5px para manter a textura fosca aveludada e suave
    bCtx.filter = "blur(5px)";
    bCtx.drawImage(canvas, 0, 0);

    const texture = new THREE.CanvasTexture(blurCanvas);
    texture.needsUpdate = true;
    return texture;
  }, [seed]);
}

/* ─────────────────────────────────────────────────────────────────
   Componente Sky Esfera 360° de Cristal Metálico Escuro
───────────────────────────────────────────────────────────────── */
export default function InsideCrystalEnvironment({ activeProject }) {
  const skyRef = useRef();
  const skyTex = useDarkCrystalSkyTexture(activeProject);

  // Rotação ultra-suave
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
