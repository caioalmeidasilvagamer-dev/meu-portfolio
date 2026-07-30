// CrystalCarousel.jsx
// Carrossel de Cristais 3D com Viewfinder HUD Fixo + Zoom de Câmera (Dolly-Zoom) e Transição de Seção

import { Suspense, useState, useCallback, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, OrbitControls, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import CrystalMesh from "./components/CrystalMesh";
import ViewfinderFrame from "./components/ViewfinderFrame";
import { crystalConfig } from "./config/crystalConfig";

/* ------------------------------------------------------------------ */
/* 1. Controlador de Câmera (Dolly-Zoom com GSAP)                      */
/* ------------------------------------------------------------------ */
function CameraController({ zoomTriggerRef }) {
  const { camera } = useThree();

  zoomTriggerRef.current = {
    zoomIn: (onComplete) => {
      gsap.timeline()
        .to(camera.position, { z: 0.35, duration: 1.1, ease: "power3.in" })
        .to(camera, { fov: 20, duration: 1.1, onUpdate: () => camera.updateProjectionMatrix() }, 0)
        .call(() => {
          if (onComplete) onComplete();
        });
    },
    zoomOut: (onComplete) => {
      gsap.timeline()
        .to(camera.position, { z: 5, duration: 1.0, ease: "power3.out" })
        .to(camera, { fov: 45, duration: 1.0, onUpdate: () => camera.updateProjectionMatrix() }, 0)
        .call(() => {
          if (onComplete) onComplete();
        });
    },
  };

  return null;
}

/* ------------------------------------------------------------------ */
/* 2. Campo de Partículas Elegantes                                    */
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
/* 3. Componente Carrossel de Cristais Principal                     */
/* ------------------------------------------------------------------ */
export default function CrystalCarousel({ items: customItems, onEnter: customOnEnter }) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const zoomTriggerRef = useRef(null);
  const frostRef = useRef(null);

  const defaultItems = [
    {
      id: 1,
      label: "PORTFOLIO_CO_01",
      sublabel: "PUDGY PENGUINS",
      modelPath: "/models/cristal.glb",
      description: "Coleção exclusiva e ecossistema digital imersivo.",
    },
    {
      id: 2,
      label: "PORTFOLIO_CO_02",
      sublabel: "CRYSTAL AUDIO",
      modelPath: "/models/cristal.glb",
      description: "Experiência sonora tridimensional interativa.",
    },
    {
      id: 3,
      label: "PORTFOLIO_CO_03",
      sublabel: "QUANTUM LABS",
      modelPath: "/models/cristal.glb",
      description: "Plataforma Web3 com estética minimalista e fosca.",
    },
  ];

  const items = customItems || defaultItems;
  const currentItem = items[index];

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length]);

  // Transição de entrada no cristal (Dolly-Zoom + Frost Dissolve)
  const handleEnterProject = useCallback(() => {
    if (!zoomTriggerRef.current || activeProject) return;

    gsap.timeline()
      .to(frostRef.current, { opacity: 1, duration: 0.5, delay: 0.6 })
      .call(() => {
        setActiveProject(currentItem);
        if (customOnEnter) customOnEnter(currentItem);
      })
      .to(frostRef.current, { opacity: 0, duration: 0.6, delay: 0.2 });

    zoomTriggerRef.current.zoomIn();
  }, [currentItem, activeProject, customOnEnter]);

  // Transição de retorno ao carrossel
  const handleBackToCarousel = useCallback(() => {
    gsap.timeline()
      .to(frostRef.current, { opacity: 1, duration: 0.4 })
      .call(() => {
        setActiveProject(null);
        if (zoomTriggerRef.current) zoomTriggerRef.current.zoomOut();
      })
      .to(frostRef.current, { opacity: 0, duration: 0.6 });
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#8f97a1", overflow: "hidden" }}>
      {/* Overlay de Névoa / Frost Dissolve para transição de tela */}
      <div
        ref={frostRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "#8f97a1",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 999,
        }}
      />

      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false, dpr: [1, 2] }}
      >
        <Suspense fallback={null}>
          <CameraController zoomTriggerRef={zoomTriggerRef} />
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

          <group key={index}>
            <CrystalMesh
              modelPath={currentItem.modelPath || crystalConfig.defaultModel}
              seed={index + 1}
              onHoverChange={setIsHovered}
              onClick={handleEnterProject}
            />
          </group>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
            rotateSpeed={0.8}
            makeDefault
            enabled={!activeProject}
          />
        </Suspense>
      </Canvas>

      {/* Viewfinder HUD fixo em screen-space (não gira com o cristal) */}
      {!activeProject && (
        <ViewfinderFrame
          label={currentItem.label}
          sublabel={currentItem.sublabel}
          onExplore={handleEnterProject}
          isHovered={isHovered}
        />
      )}

      {/* Botões de Navegação Glassmorphic do Carrossel */}
      {!activeProject && (
        <>
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
              zIndex: 20,
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
              zIndex: 20,
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Seção Aberta ao Entrar no Cristal */}
      {activeProject && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontFamily: "'Courier New', Courier, monospace",
            textAlign: "center",
            padding: "40px",
            background: "rgba(143, 151, 161, 0.5)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h1 style={{ fontSize: "32px", letterSpacing: "3px", marginBottom: "10px" }}>
            {activeProject.label}
          </h1>
          <h3 style={{ fontSize: "14px", opacity: 0.8, letterSpacing: "2px", marginBottom: "20px" }}>
            {activeProject.sublabel}
          </h3>
          <p style={{ maxWidth: "500px", fontSize: "14px", lineHeight: "1.6", opacity: 0.9, marginBottom: "30px" }}>
            {activeProject.description}
          </p>
          <button
            onClick={handleBackToCarousel}
            style={{
              padding: "12px 28px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              borderRadius: "30px",
              color: "#ffffff",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "12px",
              letterSpacing: "1.5px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.35)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
          >
            ← BACK TO CAROUSEL
          </button>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(crystalConfig.defaultModel);