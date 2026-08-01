// CrystalCarousel.jsx
// Carrossel de Cristais 3D com Voo de Câmera Contínuo (60 FPS, Zero-Lag, Shader-Warm)

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import CrystalMesh from "./components/CrystalMesh";
import InsideCrystalEnvironment from "./components/InsideCrystalEnvironment";
import LavaBackground from "./components/LavaBackground";
import { crystalConfig } from "./config/crystalConfig";
import useViewport from "../../hooks/useViewport";

/* ------------------------------------------------------------------ */
/* Loader HUD — mantém visível até download + compilação de shaders    */
/* ------------------------------------------------------------------ */
function LoaderHUD({ text, barWidth, onFadeEnd }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (onFadeEnd) {
      let frame = 0;
      const countFrames = () => {
        frame++;
        if (frame >= 2) {
          setFadingOut(true);
        } else {
          requestAnimationFrame(countFrames);
        }
      };
      requestAnimationFrame(countFrames);
    }
  }, [onFadeEnd]);

  const handleTransitionEnd = useCallback(() => {
    if (fadingOut && onFadeEnd) onFadeEnd();
  }, [fadingOut, onFadeEnd]);

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "'Courier New', Courier, monospace",
        background: "rgba(14, 22, 32, 0.45)",
        backdropFilter: "blur(8px)",
        zIndex: 50,
        pointerEvents: "none",
        opacity: fadingOut ? 0 : 1,
        transition: fadingOut ? "opacity 0.4s ease-out" : undefined,
      }}
    >
      <div style={{ fontSize: "11px", letterSpacing: "3px", opacity: 0.6, marginBottom: "12px" }}>
        {text}
      </div>
      <div
        style={{
          width: "160px",
          height: "3px",
          background: "rgba(255, 255, 255, 0.15)",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            width: barWidth,
            height: "100%",
            background: "#7eb8e0",
            boxShadow: "0 0 10px #7eb8e0",
            transition: barWidth === "100%" ? undefined : "width 0.2s ease",
          }}
        />
      </div>
      <div style={{ fontSize: "12px", letterSpacing: "2px", fontWeight: "bold" }}>
        {barWidth === "100%" ? "100%" : barWidth}
      </div>
    </div>
  );
}

function CanvasLoader({ shadersCompiled, onDismiss }) {
  const { active, progress } = useProgress();

  // Estado: download em progresso
  if (active) {
    return <LoaderHUD text="INITIALIZING 3D ENVIRONMENT" barWidth={`${progress}%`} />;
  }

  // Estado: download completo, aguardando compilação de shaders
  if (!shadersCompiled) {
    return <LoaderHUD text="WARMING UP 3D ENVIRONMENT" barWidth="100%" />;
  }

  // Ambos prontos — fade-out e notifica pai quando terminar
  return <LoaderHUD text="WARMING UP 3D ENVIRONMENT" barWidth="100%" onFadeEnd={onDismiss} />;
}

/* ------------------------------------------------------------------ */
/* Compilador de Shaders Assíncrono — compileAsync via Three.js        */
/* ------------------------------------------------------------------ */
function ShaderCompiler({ onCompiled, onCompileStart, index }) {
  const { gl, scene, camera } = useThree();
  const currentIndexRef = useRef(index);

  useEffect(() => {
    currentIndexRef.current = index;
    onCompileStart();
    let cancelled = false;
    gl.compileAsync(scene, camera).then(() => {
      if (!cancelled && currentIndexRef.current === index) {
        onCompiled();
      }
    });
    return () => { cancelled = true; };
  }, [gl, scene, camera, index, onCompiled, onCompileStart]);

  return null;
}

/* ------------------------------------------------------------------ */
/* 1. Controlador de Câmera & Controls — Transição GSAP Fluida         */
/* ------------------------------------------------------------------ */
function CameraController({ activeProject, isTransitioning, controlsRef }) {
  // Configura os limites do OrbitControls de acordo com o estado
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (isTransitioning) {
      controls.enabled = false;
    } else if (activeProject) {
      controls.enabled = true;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;
      controls.rotateSpeed = 0.5;
    } else {
      controls.enabled = true;
      controls.minPolarAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 2;
      controls.rotateSpeed = 0.8;
      controls.target.set(0, 0, 0);
    }
  }, [activeProject, isTransitioning, controlsRef]);

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
const defaultItems = [
  {
    id: 1,
    label: "PORTFOLIO_CO_01",
    sublabel: "PUDGY PENGUINS",
    modelPath: "/models/cristal.glb",
    description:
      "Coleção exclusiva e ecossistema digital imersivo em blockchain. Uma experiência visual de alto impacto construída com WebGL e físicas proceduralmente geradas.",
    tags: ["WEBGL", "REACT THREE FIBER", "SHADERS", "BLOCKCHAIN"],
    themeColor: "#7eb8e0",
    innerModel: null,
    innerScale: 0.6,
    images: [],
    projectUrl: "https://pudgypenguins.com",
  },
  {
    id: 2,
    label: "PORTFOLIO_CO_02",
    sublabel: "ENERGIA SOLAR",
    modelPath: "/models/cristal.glb",
    description:
      "Site institucional completo para empresa de energia solar fotovoltaica. Sistema de simulação de economia, integração com Google Maps para mapeamento de telhados e painel administrativo em tempo real.",
    tags: ["REACT", "NODE.JS", "GOOGLE MAPS API", "THREE.JS"],
    themeColor: "#f59e0b",
    innerModel: null,
    innerScale: 0.7,
    images: [],
    projectUrl: "https://seu-cliente-solar.com.br",
  },
  {
    id: 3,
    label: "PORTFOLIO_CO_03",
    sublabel: "QUANTUM LABS",
    modelPath: "/models/cristal.glb",
    description:
      "Plataforma Web3 experimental focada em micro-interações responsivas e estéticas translucidas de gelo e refração de luz.",
    tags: ["GSAP", "DESIGN SYSTEM", "GLSL SHADERS"],
    themeColor: "#a78bfa",
    innerModel: null,
    innerScale: 0.6,
    images: [],
    projectUrl: "#",
  },
];

export default function CrystalCarousel({ items: customItems, onEnter: customOnEnter }) {
  const [index, setIndex] = useState(0);
  const [activeProject, setActiveProject] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shadersCompiled, setShadersCompiled] = useState(false);

  const controlsRef = useRef(null);
  const lensPassRef = useRef(null);
  const cameraRef = useRef(null);

  const { isMobile, mobileScale } = useViewport();

  const items = customItems || defaultItems;
  const currentItem = items[index];

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length]);
  const handleCompileStart = useCallback(() => setShadersCompiled(false), []);
  const handleModelCompiled = useCallback(() => setShadersCompiled(true), []);
  const handleLoaderDismiss = useCallback(() => setShadersCompiled(false), []);

  // Voo Contínuo de Entrada para o Interior do Cristal (GSAP Timeline Perfeita)
  const handleEnterProject = useCallback(() => {
    if (activeProject || isTransitioning || !cameraRef.current) return;

    setIsTransitioning(true);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (controls) controls.enabled = false;

    const tl = gsap.timeline({
      onComplete: () => {
        setIsTransitioning(false);
      },
    });

    // 1. Animação de voo da câmera para o centro do cristal
    tl.to(camera.position, {
      x: 0,
      y: 0,
      z: 0.05,
      duration: 1.6,
      ease: "power2.inOut",
    }, 0);

    tl.to(camera, {
      near: 0.001,
      fov: 65,
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    }, 0);

    // 2. Transição suave do lens pass exatamente na travessia da casca
    tl.to(lensPassRef.current, {
      opacity: 0.85,
      duration: 0.45,
      ease: "power2.in",
    }, 0.5);

    tl.call(() => {
      setActiveProject(currentItem);
      if (customOnEnter) customOnEnter(currentItem);
    }, null, 0.95);

    tl.to(lensPassRef.current, {
      opacity: 0,
      duration: 0.55,
      ease: "power2.out",
    }, 0.95);
  }, [currentItem, activeProject, isTransitioning, customOnEnter]);

  // Retorno Suave da Câmera para Fora do Cristal
  const handleBackToCarousel = useCallback(() => {
    if (!activeProject || isTransitioning || !cameraRef.current) return;

    setIsTransitioning(true);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (controls) controls.enabled = false;

    const tl = gsap.timeline({
      onComplete: () => {
        setIsTransitioning(false);
      },
    });

    // 1. Cobertura suave de transição
    tl.to(lensPassRef.current, {
      opacity: 0.9,
      duration: 0.4,
      ease: "power2.in",
    }, 0);

    // 2. Troca de estado visual de 3D e reseta posição da câmera
    tl.call(() => {
      setActiveProject(null);
    }, null, 0.35);

    // 3. Voo da câmera para fora
    tl.to(camera.position, {
      x: 0,
      y: 0,
      z: 5,
      duration: 1.4,
      ease: "power2.inOut",
    }, 0.35);

    tl.to(camera, {
      near: 0.1,
      fov: 45,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    }, 0.35);

    tl.to(lensPassRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    }, 0.75);
  }, [activeProject, isTransitioning]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#8f97a1", overflow: "hidden" }}>
      {/* Fundo dinâmico estilo abajur de lava */}
      <LavaBackground />

      {/* Overlay de Passagem de Refração de Lente (Transição Fluida) */}
      <div
        ref={lensPassRef}
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at center, #1b2836 0%, #101923 100%)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 999,
        }}
      />

      {/* Loader HUD — mantido até download + compilação de shaders */}
      <CanvasLoader shadersCompiled={shadersCompiled} onDismiss={handleLoaderDismiss} />

      {/* Canvas 3D
          frameloop: mantido "always" (default). O cristal tem rotação idle contínua
          (groupRef.rotation.y += 0.003 por frame) e MeshTransmissionMaterial exige
          um render pass dedicado a cada frame. frameloop="demand" adicionaria
          complexidade (chamar invalidate() em toda interação) sem benefício mensurável.
          Se o portfólio crescer para múltiplas rotas, considerar React.lazy() + Suspense. */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, dpr: [1, 2] }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
        {/* Renderiza instantaneamente no frame 1 (0ms de atraso) */}
        <CameraController
          activeProject={activeProject}
          isTransitioning={isTransitioning}
          controlsRef={controlsRef}
        />
        <ambientLight intensity={crystalConfig.environment.ambientLightIntensity} />
        <pointLight position={[0, -2, 2]} intensity={0.7} color="#A0A5B1" />
        <pointLight position={[0, 0, -2.5]} intensity={0.9} color="#ffffff" />

        {/* Partículas e névoa da cena externa */}
        <group visible={!activeProject}>
          <fog
            attach="fog"
            args={[
              crystalConfig.environment.fog.color,
              crystalConfig.environment.fog.near,
              crystalConfig.environment.fog.far,
            ]}
          />
          <StudioParticles />
        </group>

        {/* Instância única de OrbitControls — pronta no frame 1 */}
        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          makeDefault
        />

        {/* Apenas os assets pesados de 3D/Ambiente ficam dentro do Suspense */}
        <Suspense fallback={null}>
          {/* Ambiente de Estúdio de Alta Precisão (Fotografia de Produto: Softboxes + Dark Flags) */}
          <Environment resolution={256}>
            <mesh scale={50}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial color="#141a22" side={THREE.BackSide} />
            </mesh>
            {/* Key Softbox — painel emissivo superior brilhante */}
            <Lightformer form="rect" intensity={3.5} color="#ffffff" scale={[10, 5, 1]} position={[4, 5, 3]} target={[0, 0, 0]} />
            {/* Fill Softbox — iluminação suave lateral */}
            <Lightformer form="rect" intensity={2.0} color="#e8f0ff" scale={[8, 6, 1]} position={[-5, 2, 2]} target={[0, 0, 0]} />
            {/* Dark Flag Esquerda — cria linha de sombra nítida nas arestas */}
            <Lightformer form="rect" intensity={0} color="#000000" scale={[6, 8, 1]} position={[-4, 0, -2]} target={[0, 0, 0]} />
            {/* Dark Flag Direita — contraste geométrico de facetas */}
            <Lightformer form="rect" intensity={0} color="#000000" scale={[6, 8, 1]} position={[4, 0, -2]} target={[0, 0, 0]} />
            {/* Rim Ring — silhueta traseira reluzente */}
            <Lightformer form="ring" intensity={2.5} color="#ffffff" scale={4} position={[0, 3, -6]} target={[0, 0, 0]} />
          </Environment>

          {/* Sky 360° interno — visível apenas quando dentro */}
          <group visible={!!activeProject}>
            <InsideCrystalEnvironment activeProject={activeProject || currentItem} />
          </group>

          {/* Modelo 3D do cristal — mantido montado no Canvas para manter os shaders quentes no WebGL */}
          <group key={index} visible={!activeProject} scale={[mobileScale, mobileScale, mobileScale]}>
            <CrystalMesh
              modelPath={currentItem.modelPath || crystalConfig.defaultModel}
              projectData={currentItem}
              seed={index + 1}
              label={currentItem.label}
              sublabel={currentItem.sublabel}
              onClick={handleEnterProject}
            />
          </group>

          {/* Compilador de shaders assíncrono — compileAsync previne stall no first frame */}
          <ShaderCompiler onCompiled={handleModelCompiled} onCompileStart={handleCompileStart} index={index} />
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
              left: isMobile ? 12 : 30,
              top: "50%",
              transform: "translateY(-50%)",
              width: isMobile ? 44 : 50,
              height: isMobile ? 44 : 50,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: index === 0 ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
              fontSize: isMobile ? 18 : 22,
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
              right: isMobile ? 12 : 30,
              top: "50%",
              transform: "translateY(-50%)",
              width: isMobile ? 44 : 50,
              height: isMobile ? 44 : 50,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: index === items.length - 1 ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
              fontSize: isMobile ? 18 : 22,
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

      {/* ── Painel Compacto do Projeto — flutua no canto, sky cristalino sempre visível ── */}
      {activeProject && (
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? 16 : 40,
            left: isMobile ? 16 : 40,
            zIndex: 100,
            maxWidth: isMobile ? "calc(100% - 32px)" : 380,
            width: isMobile ? "calc(100% - 32px)" : "calc(100% - 80px)",
            color: "#ffffff",
            fontFamily: "'Courier New', Courier, monospace",
            background: "rgba(8, 14, 22, 0.65)",
            backdropFilter: "blur(18px)",
            border: `1px solid ${activeProject.themeColor || "#7eb8e0"}55`,
            borderRadius: "10px",
            padding: isMobile ? "16px 18px" : "24px 28px",
            pointerEvents: "auto",
            boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 24px ${activeProject.themeColor || "#7eb8e0"}30`,
            overflowY: "auto",
            maxHeight: "70vh",
          }}
        >
          {/* Barra de cor temática */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "2px",
              borderRadius: "10px 10px 0 0",
              background: activeProject.themeColor || "#7eb8e0",
              boxShadow: `0 0 14px ${activeProject.themeColor || "#7eb8e0"}`,
            }}
          />

          {/* Label */}
          <div style={{ fontSize: isMobile ? "8px" : "9px", letterSpacing: "3.5px", opacity: 0.5, marginBottom: "6px" }}>
            ////// PROJECT DISCOVERY
          </div>
          <div
            style={{
              fontSize: isMobile ? "17px" : "22px",
              fontWeight: "bold",
              letterSpacing: "2.5px",
              color: activeProject.themeColor || "#ffffff",
              marginBottom: "3px",
            }}
          >
            {activeProject.sublabel}
          </div>
          <div style={{ fontSize: isMobile ? "9px" : "10px", letterSpacing: "2px", opacity: 0.45, marginBottom: isMobile ? "10px" : "16px" }}>
            {activeProject.label}
          </div>

          {/* Descrição */}
          <p style={{ fontSize: isMobile ? "11px" : "12.5px", lineHeight: 1.75, color: "#c8d8e5", marginBottom: isMobile ? "12px" : "18px" }}>
            {activeProject.description}
          </p>

          {/* Tags */}
          {activeProject.tags && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: isMobile ? "14px" : "22px" }}>
              {activeProject.tags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: "3px 10px",
                    background: `${activeProject.themeColor || "#7eb8e0"}18`,
                    border: `1px solid ${activeProject.themeColor || "#7eb8e0"}50`,
                    borderRadius: "3px",
                    fontSize: isMobile ? "8px" : "9px",
                    letterSpacing: "1px",
                    color: activeProject.themeColor || "#c0d6e8",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Dica de orbit */}
          <div style={{ fontSize: isMobile ? "8px" : "9px", letterSpacing: "1.5px", opacity: 0.35, marginBottom: isMobile ? "12px" : "18px", textAlign: "center" }}>
            ↺ DRAG TO EXPLORE THE CRYSTAL
          </div>

          {/* Ações */}
          <div style={{ display: "flex", gap: isMobile ? "8px" : "10px", flexWrap: "wrap" }}>
            {activeProject.projectUrl && activeProject.projectUrl !== "#" && (
              <a
                href={activeProject.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: isMobile ? "8px 0" : "10px 0",
                  textAlign: "center",
                  background: `${activeProject.themeColor || "#7eb8e0"}22`,
                  border: `1px solid ${activeProject.themeColor || "#7eb8e0"}`,
                  borderRadius: "4px",
                  color: activeProject.themeColor || "#ffffff",
                  fontSize: isMobile ? "9px" : "10px",
                  letterSpacing: "1.8px",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = `${activeProject.themeColor || "#7eb8e0"}40`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = `${activeProject.themeColor || "#7eb8e0"}22`)}
              >
                [ VISIT ↗ ]
              </a>
            )}
            <button
              onClick={handleBackToCarousel}
              style={{
                flex: 1,
                padding: isMobile ? "8px 0" : "10px 0",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "4px",
                color: "rgba(255,255,255,0.7)",
                fontSize: isMobile ? "9px" : "10px",
                letterSpacing: "1.8px",
                cursor: "pointer",
                fontFamily: "'Courier New', Courier, monospace",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              [ EXIT ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(crystalConfig.defaultModel);