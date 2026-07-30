// CrystalCarousel.jsx
// Carrossel de Cristais 3D com Suporte a Múltiplos Modelos (.glb)

import { Suspense, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, OrbitControls, useGLTF } from "@react-three/drei";
import CrystalMesh from "./components/CrystalMesh";
import { crystalConfig } from "./config/crystalConfig";

/* ------------------------------------------------------------------ */
/* 1. Campo de Partículas Elegantes                                    */
/* ------------------------------------------------------------------ */
function StudioParticles() {
  return (
    <group>
      <Sparkles count={80} scale={[14, 8, 10]} size={2.5} speed={0.3} opacity={0.7} color="#ffffff" />
      <Sparkles count={70} scale={[16, 10, 12]} size={4.0} speed={0.2} opacity={0.6} color="#ffffff" />
      <Sparkles count={80} scale={[12, 7, 8]} size={2.8} speed={0.45} opacity={0.9} color="#ffffff" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Cena Principal com Suporte a Múltiplos Modelos de Cristais     */
/* ------------------------------------------------------------------ */
function Scene({ items, index }) {
  const currentItem = items[index];
  return (
    <group key={index}>
      <CrystalMesh
        modelPath={currentItem.modelPath || crystalConfig.defaultModel}
        seed={index + 1}
        label={currentItem.label}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Componente Carrossel de Cristais Principal                     */
/* ------------------------------------------------------------------ */
export default function CrystalCarousel({ items: customItems }) {
  const [index, setIndex] = useState(0);

  // Lista Padrão de Itens (Facilmente expansível adicionando novos arquivos .glb em /public/models/)
  const defaultItems = [
    { id: 1, label: "PORTFOLIO_CO_01", modelPath: "/models/cristal.glb" },
    { id: 2, label: "PORTFOLIO_CO_02", modelPath: "/models/cristal.glb" },
    { id: 3, label: "PORTFOLIO_CO_03", modelPath: "/models/cristal.glb" },
  ];

  const items = customItems || defaultItems;

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#8f97a1" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false, dpr: [1, 2] }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={[crystalConfig.environment.backgroundColor]} />
          <fog
            attach="fog"
            args={[
              crystalConfig.environment.fog.color,
              crystalConfig.environment.fog.near,
              crystalConfig.environment.fog.far,
            ]}
          />

          <ambientLight intensity={crystalConfig.environment.ambientLightIntensity} />

          <pointLight position={[0, -2, 2]} intensity={0.7} color="#A0A5B1" />
          <pointLight position={[0, 0, -2.5]} intensity={0.9} color="#ffffff" />

          {/* Ambiente Iluminado por Painéis de Luz (Lightformers) */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3} color="#ffffff" scale={[6, 3, 1]} position={[4, 5, 4]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={1} color="#c8d4dc" scale={[5, 4, 1]} position={[-5, -2, -3]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={1.5} color="#ffffff" scale={3} position={[0, 2, -6]} target={[0, 0, 0]} />
          </Environment>

          <StudioParticles />
          <Scene items={items} index={index} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
            rotateSpeed={0.8}
            makeDefault
          />
        </Suspense>
      </Canvas>

      {/* Botões de Navegação Glassmorphic */}
      <button
        onClick={prev}
        disabled={index === 0}
        style={{
          position: "absolute",
          left: 30,
          top: "50%",
          transform: "translateY(-50%)",
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          color: index === 0 ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
          fontSize: 22,
          cursor: index === 0 ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          zIndex: 10,
        }}
      >
        ‹
      </button>
      <button
        onClick={next}
        disabled={index === items.length - 1}
        style={{
          position: "absolute",
          right: 30,
          top: "50%",
          transform: "translateY(-50%)",
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          color: index === items.length - 1 ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
          fontSize: 22,
          cursor: index === items.length - 1 ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          zIndex: 10,
        }}
      >
        ›
      </button>
    </div>
  );
}

useGLTF.preload(crystalConfig.defaultModel);