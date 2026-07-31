// InsideCrystalEnvironment.jsx
// Textura Procedural HDRI de Esfera Sky 360° para o interior do Cristal
// O usuário entra no cristal e vê apenas este ambiente 360° cristalino com rotação/orbit livre

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────
   Gerador de Textura Sky 360° de Cristal Facetado High-Definition
───────────────────────────────────────────────────────────────── */
function useCrystalSkyTexture(activeProject) {
  const seed = activeProject?.id ?? 1;
  const themeColor = activeProject?.themeColor || "#7eb8e0";

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

    // ─── 1. Fundo base cristalino com tom do projeto ───
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0.0, "#121d28");
    bg.addColorStop(0.3, "#1e2e3e");
    bg.addColorStop(0.7, "#1a2736");
    bg.addColorStop(1.0, "#0d1620");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ─── 2. Facetas Cristalinas Trianguladas (Delaunay/Voronoi Facets) ───
    const N = 320;
    const pts = Array.from({ length: N }, (_, i) => ({
      x: rng(i * 2 + 1) * W,
      y: rng(i * 2 + 2) * H,
    }));

    // Pontos nas bordas para evitar frestas na colagem da esfera 360
    const edgePts = [
      ...[0, W * 0.25, W * 0.5, W * 0.75, W].flatMap((x) => [
        { x, y: 0 },
        { x, y: H },
      ]),
      ...[0, H * 0.33, H * 0.66, H].flatMap((y) => [
        { x: 0, y },
        { x: W, y },
      ]),
    ];
    const allPts = [...pts, ...edgePts];
    const distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

    for (let i = 0; i < pts.length; i++) {
      const neighbors = allPts
        .map((p, j) => ({ p, d: distSq(pts[i], p), j }))
        .filter((item) => item.j !== i)
        .sort((a, b) => a.d - b.d);

      for (let k = 0; k < 4; k++) {
        if (!neighbors[k + 1]) continue;
        const p2 = neighbors[k].p;
        const p3 = neighbors[k + 1].p;

        // Variação cromática das facetas (azul-cristal + toques da cor do projeto)
        const isThemeFacet = rng(i * 19 + k) > 0.65;
        let fillStyle;

        if (isThemeFacet) {
          // Faceta com brilho da cor temática do projeto
          const alpha = 0.25 + rng(i * 13 + k) * 0.45;
          ctx.fillStyle = themeColor;
          ctx.globalAlpha = alpha;
        } else {
          // Faceta de quartzo/gelo (tons de ciano, azul e branco)
          const hue = 190 + rng(i * 7 + k * 11) * 35;
          const sat = 20 + rng(i * 9 + k * 3) * 50;
          const lig = 35 + rng(i * 5 + k * 7) * 50;
          const alpha = 0.2 + rng(i * 17 + k) * 0.6;
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lig}%, ${alpha.toFixed(2)})`;
          ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Linhas de clivagem/aresta do cristal (nítidas e brilhantes)
        const edgeAlpha = 0.4 + rng(i * 23 + k * 13) * 0.55;
        ctx.strokeStyle = `rgba(255, 255, 255, ${edgeAlpha.toFixed(2)})`;
        ctx.lineWidth = 0.7 + rng(i * 29 + k) * 1.6;
        ctx.stroke();
      }
    }

    // ─── 3. Nós Luminosos e Brilhos de Refração Interna (Caustics) ───
    for (let i = 0; i < 35; i++) {
      const cx = rng(i * 41 + 10) * W;
      const cy = rng(i * 43 + 20) * H;
      const radius = 25 + rng(i * 47) * 120;
      const intensity = 0.2 + rng(i * 53) * 0.6;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, `rgba(255, 255, 255, ${intensity.toFixed(2)})`);
      g.addColorStop(0.3, `rgba(200, 230, 255, ${(intensity * 0.5).toFixed(2)})`);
      g.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = g;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }

    // ─── 4. Feixes prismáticos sutis ───
    for (let i = 0; i < 8; i++) {
      const x1 = rng(i * 61) * W;
      const y1 = rng(i * 67) * H;
      const x2 = x1 + (rng(i * 71) - 0.5) * 600;
      const y2 = y1 + (rng(i * 73) - 0.5) * 600;

      const beam = ctx.createLinearGradient(x1, y1, x2, y2);
      beam.addColorStop(0, "rgba(255, 255, 255, 0)");
      beam.addColorStop(0.5, `rgba(220, 240, 255, ${(0.15 + rng(i * 79) * 0.25).toFixed(2)})`);
      beam.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.strokeStyle = beam;
      ctx.lineWidth = 15 + rng(i * 83) * 45;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [seed, themeColor]);
}

/* ─────────────────────────────────────────────────────────────────
   Componente Sky Esfera 360°
───────────────────────────────────────────────────────────────── */
export default function InsideCrystalEnvironment({ activeProject }) {
  const skyRef = useRef();
  const skyTex = useCrystalSkyTexture(activeProject);

  // Rotação suave do ambiente interno
  useFrame((state) => {
    if (skyRef.current) {
      skyRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    <mesh ref={skyRef}>
      <sphereGeometry args={[45, 128, 64]} />
      <meshBasicMaterial map={skyTex} side={THREE.BackSide} />
    </mesh>
  );
}
