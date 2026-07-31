// ObjectAnchoredHUD.jsx
// HUD 2D Ancorado ao Cristal 3D — Leader Lines projetadas em 3D→2D + Scan Ticks
// Atualiza style.transform a cada frame via refs (sem re-renders React)

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// Pontos de âncora no espaço LOCAL do cristal (relativo ao centro do mesh)
// Ajustados para pontos que ficam na superfície visível da geometria
const ANCHORS = {
  topLeft:     new THREE.Vector3(-0.5,  1.1, 0.3),  // topo esquerdo — label do projeto
  topRight:    new THREE.Vector3( 0.8,  0.6, 0.3),  // topo direito — telemetria TEMP
  bottomRight: new THREE.Vector3( 0.6, -0.9, 0.3),  // baixo direito — data / CLICK TO EXPLORE
};

const _tmpV = new THREE.Vector3();

// Seeded PRNG para positions determinísticas (purity-safe)
function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function ObjectAnchoredHUD({
  crystalMeshRef,
  label = "PORTFOLIO_CO_01",
  sublabel = "PUDGY PENGUINS",
  onExplore,
}) {
  const { camera, size } = useThree();

  // Refs para os elementos SVG e de texto (atualização sem re-render)
  const svgRef = useRef(null);

  const polyline1Ref = useRef(null);
  const polyline2Ref = useRef(null);
  const polyline3Ref = useRef(null);
  const dot1Ref = useRef(null);
  const dot2Ref = useRef(null);
  const dot3Ref = useRef(null);

  const labelProjectRef = useRef(null);
  const labelTempRef    = useRef(null);
  const labelDateRef    = useRef(null);
  const tickRefs        = useRef([]);

  // Ticks de escaneamento — gerados uma vez, posições relativas ao centro projetado
  const scanTicks = useMemo(() => {
    const t = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + (seededRandom(i * 7 + 1) - 0.5) * 0.5;
      const dist  = 140 + seededRandom(i * 7 + 2) * 100;
      t.push({
        id: i,
        rx: Math.cos(angle) * dist,
        ry: Math.sin(angle) * dist * 0.65,
        len: 6 + seededRandom(i * 7 + 3) * 10,
        rot: seededRandom(i * 7 + 4) * 180,
        baseOpacity: 0.15 + seededRandom(i * 7 + 5) * 0.3,
        speed: 0.8 + seededRandom(i * 7 + 6) * 1.6,
        phase: seededRandom(i * 7 + 7) * Math.PI * 2,
      });
    }
    return t;
  }, []);

  // Converte Vector3 local do mesh → pixels de tela
  const project3DToScreen = (localVec, matrixWorld) => {
    _tmpV.copy(localVec).applyMatrix4(matrixWorld);
    _tmpV.project(camera);
    return {
      x: ( _tmpV.x * 0.5 + 0.5) * size.width,
      y: (-_tmpV.y * 0.5 + 0.5) * size.height,
    };
  };

  useFrame((state) => {
    const mesh = crystalMeshRef?.current;
    if (!mesh) return;

    mesh.updateWorldMatrix(true, false);
    const mw = mesh.matrixWorld;

    const p1 = project3DToScreen(ANCHORS.topLeft,     mw);
    const p2 = project3DToScreen(ANCHORS.topRight,    mw);
    const p3 = project3DToScreen(ANCHORS.bottomRight, mw);
    const cx = project3DToScreen(new THREE.Vector3(0, 0, 0), mw);

    // — Leader Line 1: Topo esquerdo → label projeto —
    // Linha diagonal de ~50px para a esquerda, depois horizontal para o texto
    const e1x = p1.x - 45;
    const e1y = p1.y - 35;
    const end1x = p1.x - 155;
    const end1y = e1y;

    if (polyline1Ref.current) {
      polyline1Ref.current.setAttribute("points",
        `${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${e1x.toFixed(1)},${e1y.toFixed(1)} ${end1x.toFixed(1)},${end1y.toFixed(1)}`);
    }
    if (dot1Ref.current) {
      dot1Ref.current.setAttribute("cx", p1.x.toFixed(1));
      dot1Ref.current.setAttribute("cy", p1.y.toFixed(1));
    }
    if (labelProjectRef.current) {
      // Posiciona o texto no final da linha, alinhado à direita (à esquerda da âncora)
      labelProjectRef.current.style.transform =
        `translate3d(${(end1x - 5).toFixed(0)}px, ${(end1y - 30).toFixed(0)}px, 0)`;
    }

    // — Leader Line 2: Topo direito → telemetria —
    const e2x = p2.x + 40;
    const e2y = p2.y - 25;
    const end2x = p2.x + 130;
    const end2y = e2y;

    if (polyline2Ref.current) {
      polyline2Ref.current.setAttribute("points",
        `${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${e2x.toFixed(1)},${e2y.toFixed(1)} ${end2x.toFixed(1)},${end2y.toFixed(1)}`);
    }
    if (dot2Ref.current) {
      dot2Ref.current.setAttribute("cx", p2.x.toFixed(1));
      dot2Ref.current.setAttribute("cy", p2.y.toFixed(1));
    }
    if (labelTempRef.current) {
      labelTempRef.current.style.transform =
        `translate3d(${e2x.toFixed(0)}px, ${(e2y - 28).toFixed(0)}px, 0)`;
    }

    // — Leader Line 3: Baixo direito → data/CTA —
    const e3x = p3.x + 35;
    const e3y = p3.y + 25;
    const end3x = p3.x + 145;
    const end3y = e3y;

    if (polyline3Ref.current) {
      polyline3Ref.current.setAttribute("points",
        `${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${e3x.toFixed(1)},${e3y.toFixed(1)} ${end3x.toFixed(1)},${end3y.toFixed(1)}`);
    }
    if (dot3Ref.current) {
      dot3Ref.current.setAttribute("cx", p3.x.toFixed(1));
      dot3Ref.current.setAttribute("cy", p3.y.toFixed(1));
    }
    if (labelDateRef.current) {
      labelDateRef.current.style.transform =
        `translate3d(${e3x.toFixed(0)}px, ${(e3y - 22).toFixed(0)}px, 0)`;
    }

    // — Scan Ticks orbitando em volta do cristal —
    const t = state.clock.elapsedTime;
    scanTicks.forEach((tick, i) => {
      const el = tickRefs.current[i];
      if (!el) return;
      const pulse = tick.baseOpacity + Math.sin(t * tick.speed + tick.phase) * 0.15;
      el.style.opacity = Math.max(0.05, pulse);
      const tx = cx.x + tick.rx;
      const ty = cx.y + tick.ry;
      el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${tick.rot}deg)`;
    });
  });

  const hudStyle = {
    fontFamily: "'Courier New', Courier, monospace",
    color: "#ffffff",
    whiteSpace: "nowrap",
    textShadow: "0 0 6px rgba(255,255,255,0.55)",
    fontSize: "11px",
    letterSpacing: "1px",
  };

  return (
    <Html fullscreen style={{ pointerEvents: "none", zIndex: 10 }}>
      {/* Camada SVG: leader lines e dots de âncora */}
      <svg
        ref={svgRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
      >
        {/* Leader lines */}
        <polyline ref={polyline1Ref} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
        <polyline ref={polyline2Ref} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
        <polyline ref={polyline3Ref} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" />
        {/* Pontos de âncora nas superfícies */}
        <circle ref={dot1Ref} r="2" fill="#ffffff" opacity="0.85" />
        <circle ref={dot2Ref} r="2" fill="#ffffff" opacity="0.85" />
        <circle ref={dot3Ref} r="2" fill="#ffffff" opacity="0.85" />
      </svg>

      {/* Label 1: Projeto — topo esquerdo */}
      <div
        ref={labelProjectRef}
        style={{ position: "absolute", top: 0, left: 0, ...hudStyle, textAlign: "right" }}
      >
        <div style={{ fontWeight: "bold", fontSize: "12px", letterSpacing: "2px" }}>{label}</div>
        <div style={{ opacity: 0.75, fontSize: "10px", marginTop: "2px" }}>{sublabel}</div>
      </div>

      {/* Label 2: Telemetria — topo direito */}
      <div
        ref={labelTempRef}
        style={{ position: "absolute", top: 0, left: 0, ...hudStyle }}
      >
        <div style={{ opacity: 0.5, fontSize: "9px", letterSpacing: "2px", marginBottom: "2px" }}>TEMP</div>
        <div>35.49</div>
        <div style={{ opacity: 0.6, fontSize: "10px" }}>+01.94</div>
      </div>

      {/* Label 3: Data + CTA — baixo direito */}
      <div
        ref={labelDateRef}
        style={{ position: "absolute", top: 0, left: 0, ...hudStyle }}
      >
        <div style={{ opacity: 0.6, fontSize: "10px", marginBottom: "3px" }}>D 01.02.2020</div>
        <div
          onClick={onExplore}
          style={{
            cursor: "pointer",
            pointerEvents: "auto",
            borderBottom: "1px solid rgba(255,255,255,0.7)",
            display: "inline-block",
            paddingBottom: "1px",
            fontWeight: "bold",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          CLICK_TO_EXPLORE
        </div>
      </div>

      {/* Scan Ticks */}
      {scanTicks.map((tick, i) => (
        <div
          key={tick.id}
          ref={(el) => (tickRefs.current[i] = el)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${tick.len}px`,
            height: "1px",
            background: "#ffffff",
            pointerEvents: "none",
            transformOrigin: "center center",
          }}
        />
      ))}
    </Html>
  );
}
