// InsideCrystalEnvironment.jsx
// Sky esfera 360° com textura procedural de cristal facetado (como um HDRI de geoda)
// Câmera pode orbitar livremente dentro

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Gerador de Textura Procedural de Cristal (canvas 2D → CanvasTexture)
   Gera facetas trianguladas em tons de branco, cinza-gelo e azul-cristal
   com bordas brancas nítidas e brilhos aleatórios.
───────────────────────────────────────────────────────────────── */
function useCrystalSkyTexture(seed = 0) {
  return useMemo(() => {
    const W = 2048;
    const H = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // ─── 1. Fundo gradiente de gelo ───
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0.0, "#b8cad8");
    bg.addColorStop(0.4, "#d4e0ea");
    bg.addColorStop(0.75, "#cad8e4");
    bg.addColorStop(1.0, "#a8bfce");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ─── 2. Facetas Trianguladas Aleatórias ───
    const N = 280;
    const rng = (n) => {
      const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    const pts = Array.from({ length: N }, (_, i) => ({
      x: rng(i * 2) * W,
      y: rng(i * 2 + 1) * H,
    }));

    // Borda: duplica pontos nas extremidades para cobrir toda a esfera
    const border = [-W * 0.1, W * 0.55, W * 1.1];
    const borderPts = [
      ...border.flatMap((bx) => [0, H * 0.25, H * 0.5, H * 0.75, H].map((by) => ({ x: bx, y: by }))),
      ...Array.from({ length: N / 4 }, (_, i) => ({ x: rng(i * 7 + 300) * W, y: 0 })),
      ...Array.from({ length: N / 4 }, (_, i) => ({ x: rng(i * 7 + 400) * W, y: H })),
    ];
    const allPts = [...pts, ...borderPts];

    const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

    for (let i = 0; i < pts.length; i++) {
      const sorted = allPts
        .map((p, j) => ({ p, d: d2(pts[i], p), j }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d);

      for (let k = 0; k < 3; k++) {
        if (!sorted[k + 1]) continue;
        const p2 = sorted[k].p;
        const p3 = sorted[k + 1].p;

        // Paleta de cores: branco-gelo, cinza-azulado, azul-cristal suave
        const hue = 195 + rng(i * 13 + k * 7) * 30;   // 195–225 (azul-gelo)
        const sat = 15 + rng(i * 11 + k * 5) * 35;    // baixa saturação = gelo
        const lig = 68 + rng(i * 9 + k * 3) * 25;     // claro
        const alpha = 0.35 + rng(i * 17 + k) * 0.5;

        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.fillStyle = `hsla(${hue},${sat}%,${lig}%,${alpha.toFixed(2)})`;
        ctx.fill();

        // Bordas das facetas (brancas nítidas = linhas de clivagem do cristal)
        const edgeAlpha = 0.55 + rng(i * 31 + k * 13) * 0.4;
        ctx.strokeStyle = `rgba(255,255,255,${edgeAlpha.toFixed(2)})`;
        ctx.lineWidth = 0.6 + rng(i * 23 + k) * 1.8;
        ctx.stroke();
      }
    }

    // ─── 3. Brilhos Especulares Aleatórios (star reflections) ───
    for (let i = 0; i < 22; i++) {
      const x = rng(i * 41) * W;
      const y = rng(i * 43) * H;
      const r = 18 + rng(i * 47) * 90;
      const a = 0.15 + rng(i * 53) * 0.45;
      const sg = ctx.createRadialGradient(x, y, 0, x, y, r);
      sg.addColorStop(0, `rgba(255,255,255,${a.toFixed(2)})`);
      sg.addColorStop(0.5, `rgba(220,235,245,${(a * 0.3).toFixed(2)})`);
      sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // ─── 4. Vinheta global suave ───
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vignette.addColorStop(0, "rgba(255,255,255,0)");
    vignette.addColorStop(1, "rgba(140,165,185,0.25)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [seed]);
}

/* ─────────────────────────────────────────────────────────────────
   Componente: Esfera de Sky Cristalina 360°
   Uma esfera grande com BackSide + textura procedural de cristal.
   O usuário orbita livremente dentro via OrbitControls no CrystalCarousel.
───────────────────────────────────────────────────────────────── */
export default function InsideCrystalEnvironment({ activeProject }) {
  const skyRef = useRef();

  // Seed baseado no id do projeto para cada cristal ter uma aparência diferente
  const seed = activeProject?.id ?? 0;
  const skyTex = useCrystalSkyTexture(seed);

  // Rotação ultra-lenta para dar sensação de ambiente vivo
  useFrame((state) => {
    if (skyRef.current) {
      skyRef.current.rotation.y = state.clock.elapsedTime * 0.004;
    }
  });

  return (
    <mesh ref={skyRef}>
      <sphereGeometry args={[45, 128, 64]} />
      <meshStandardMaterial
        map={skyTex}
        side={THREE.BackSide}
        roughness={0.7}
        metalness={0.05}
        envMapIntensity={0}
      />
    </mesh>
  );
}
