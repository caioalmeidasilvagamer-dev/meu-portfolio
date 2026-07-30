// CrystalCarousel.jsx
// Carrossel de Cristais 3D com Voo de Câmera Contínuo (Sem Cortes) para Dentro do Cristal
// e Ambiente 3D Interno Facetado com Espelhamento e Refração

import { Suspense, useState, useCallback, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, OrbitControls, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import CrystalMesh from "./components/CrystalMesh";
import InsideCrystalEnvironment from "./components/InsideCrystalEnvironment";
import { crystalConfig } from "./config/crystalConfig";

/* ------------------------------------------------------------------ */
/* 1. Controlador de Câmera — Voo Fluido para Dentro do Cristal        */
/* ------------------------------------------------------------------ */
function CameraController({ zoomTriggerRef }) {
  const { camera } = useThree();

  zoomTriggerRef.current = {
    zoomIn: (onComplete) => {
      gsap.timeline()
        .to(camera.position, {
          x: 0,
          y: 0,
          z: 0.05,
          duration: 1.8,
          ease: "power2.inOut",
        })
        .to(
          camera,
          {
            near: 0.001,
            fov: 65,
            duration: 1.8,
            ease: "power2.inOut",
            onUpdate: () => camera.updateProjectionMatrix(),
          },
          0
        )
        .call(() => {
          if (onComplete) onComplete();
        });
    },
    zoomOut: (onComplete) => {
      gsap.timeline()
        .to(camera.position, {
          x: 0,
          y: 0,
          z: 5.0,
          duration: 1.4,
          ease: "power2.inOut",
        })
        .to(
          camera,
          {
            near: 0.1,
            fov: 45,
            duration: 1.4,
            ease: "power2.inOut",
            onUpdate: () => camera.updateProjectionMatrix(),
          },
          0
        )
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
  const lensPassRef = useRef(null);

  const defaultItems = [
    {
      id: 1,
      label: "PORTFOLIO_CO_01",
      sublabel: "PUDGY PENGUINS",
      modelPath: "/models/cristal.glb",
      description:
        "Coleção exclusiva e ecossistema digital imersivo em blockchain. Uma experiência visual de alto impacto construída com WebGL e físicas proceduralmente geradas.",
      tags: ["WEBGL", "REACT THREE FIBER", "SHADERS", "BLOCKCHAIN"],
    },
    {
      id: 2,
      label: "PORTFOLIO_CO_02",
      sublabel: "CRYSTAL AUDIO",
      modelPath: "/models/cristal.glb",
      description:
        "Experiência sonora tridimensional interativa com visualizadores reativos em tempo real e sintetizadores modulares espaciais.",
      tags: ["AUDIO SYNTH", "THREE.JS", "WEB AUDIO API"],
    },
    {
      id: 3,
      label: "PORTFOLIO_CO_03",
      sublabel: "QUANTUM LABS",
      modelPath: "/models/cristal.glb",
      description:
        "Plataforma Web3 experimental focada em micro-interações responsivas e estéticas translúcidas de gelo e refração de luz.",
      tags: ["GSAP", "DESIGN SYSTEM", "GLSL SHADERS"],
    },
  ];

  const items = customItems || defaultItems;
  const currentItem = items[index];

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length]);

  // Voo Contínuo de Entrada para o Interior do Cristal (Sem Cortes)
  const handleEnterProject = useCallback(() => {
    if (!zoomTriggerRef.current || activeProject) return;

    // Flash sutil de refração da lente no momento exato do voo através da casca
    gsap.timeline()
      .to(lensPassRef.current, { opacity: 0.8, duration: 0.4, delay: 0.7 })
      .to(lensPassRef.current, { opacity: 0, duration: 0.6 })
      .call(
        () => {
          setActiveProject(currentItem);
          if (customOnEnter) customOnEnter(currentItem);
        },
        null,
        0.9
      );

    zoomTriggerRef.current.zoomIn();
  }, [currentItem, activeProject, customOnEnter]);

  // Retorno da Câmera para Fora do Cristal
  const handleBackToCarousel = useCallback(() => {
    gsap.timeline()
      .to(lensPassRef.current, { opacity: 0.7, duration: 0.3 })
      .call(() => {
        setActiveProject(null);
      })
      .to(lensPassRef.current, { opacity: 0, duration: 0.5 });

    if (zoomTriggerRef.current) zoomTriggerRef.current.zoomOut();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#8f97a1", overflow: "hidden" }}>
      {/* Brilho / Distorção de Refração de Lente na Passagem */}
      <div
        ref={lensPassRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(143,151,161,0.9) 100%)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 999,
          backdropFilter: "blur(20px)",
        }}
      />

      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
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

          {/* Ambiente de Estúdio (Lightformers) */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3} color="#ffffff" scale={[6, 3, 1]} position={[4, 5, 4]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={1} color="#c8d4dc" scale={[5, 4, 1]} position={[-5, -2, -3]} target={[0, 0, 0]} />
            <Lightformer form="ring" intensity={1.5} color="#ffffff" scale={3} position={[0, 2, -6]} target={[0, 0, 0]} />
          </Environment>

          <StudioParticles />

          {/* Quando a câmera entra no cristal, o Ambiente 3D Interno Espelhado ganha vida */}
          {activeProject && <InsideCrystalEnvironment activeProject={activeProject} />}

          <group key={index}>
            <CrystalMesh
              modelPath={currentItem.modelPath || crystalConfig.defaultModel}
              seed={index + 1}
              label={currentItem.label}
              sublabel={currentItem.sublabel}
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

      {/* Painel Interno do Projeto Integrado ao Espaço 3D (Dark Mode / Glassmorphism) */}
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
            background: "rgba(15, 23, 32, 0.45)",
            backdropFilter: "blur(12px)",
            pointerEvents: "auto",
          }}
        >
          {/* Header & Subtitle */}
          <div style={{ opacity: 0.6, fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>
            ////// PROJECT DISCOVERY
          </div>
          <h1 style={{ fontSize: "36px", letterSpacing: "4px", marginBottom: "8px", fontWeight: "bold" }}>
            {activeProject.label}
          </h1>
          <h3 style={{ fontSize: "15px", color: "#a5c4e0", letterSpacing: "2.5px", marginBottom: "24px" }}>
            {activeProject.sublabel}
          </h3>

          {/* Descrição */}
          <p
            style={{
              maxWidth: "560px",
              fontSize: "14px",
              lineHeight: "1.7",
              color: "#d4dfeb",
              marginBottom: "28px",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {activeProject.description}
          </p>

          {/* Tags do Projeto */}
          {activeProject.tags && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "36px" }}>
              {activeProject.tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: "5px 14px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "4px",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    color: "#cbdbe8",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Botão de Fechar / Retorno */}
          <button
            onClick={handleBackToCarousel}
            style={{
              padding: "12px 32px",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              borderRadius: "4px",
              color: "#ffffff",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "12px",
              letterSpacing: "2px",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
              boxShadow: "0 0 15px rgba(255,255,255,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.boxShadow = "0 0 25px rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.1)";
            }}
          >
            [ CLOSE ]
          </button>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(crystalConfig.defaultModel);