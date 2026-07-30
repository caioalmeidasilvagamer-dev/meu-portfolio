// CrystalCarousel.jsx
// Requer: three, @react-three/fiber, @react-three/drei

import { Suspense, useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Environment,
  useGLTF,
  Sparkles,
  Float,
  OrbitControls,
  Html,
} from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* 1. Textura de ruído pra dar o aspecto "fosco" (não-liso) à superfície */
/* ------------------------------------------------------------------ */
function useNoiseTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 60;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = 255;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }, []);
}

/* ------------------------------------------------------------------ */
/* 2. Campo de Partículas Elegantes e Névoa                              */
/* ------------------------------------------------------------------ */
function StudioParticles() {
  return (
    <group>
      {/* Camada 1: Partículas cinza-chumbo suaves */}
      <Sparkles
        count={90}
        scale={[14, 8, 10]}
        size={3.0}
        speed={0.3}
        opacity={0.6}
        color="#475569"
      />
      {/* Camada 2: Partículas prateadas intermediárias */}
      <Sparkles
        count={75}
        scale={[16, 10, 12]}
        size={4.5}
        speed={0.2}
        opacity={0.5}
        color="#94a3b8"
      />
      {/* Camada 3: Partículas brancas reluzentes */}
      <Sparkles
        count={80}
        scale={[12, 7, 8]}
        size={2.5}
        speed={0.45}
        opacity={0.85}
        color="#ffffff"
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Shader de Esteira de Barco (Boat Wake)                          */
/* ------------------------------------------------------------------ */
const WAKE_TRAIL_N = 20;    // Tamanho do ring buffer de histórico
const WAKE_SPREAD = 0.3;   // Velocidade de propagação da onda (unidades locais/segundo)
const TRAIL_DECAY = 1.4;   // Segundos até cada entrada sumir
const WAKE_ANGLE = 0.65;  // Meio-ângulo do cone do V (~37°) — uniform ajustável

const ScanWireframeShader = {
  uniforms: {
    uColor: { value: new THREE.Color("#e8f4f8") },
    uHoverActive: { value: 0.0 },
    uWakeAngle: { value: WAKE_ANGLE },
    uWakeSpread: { value: WAKE_SPREAD },
    uTrailDecay: { value: TRAIL_DECAY },
    uTrailPositions: { value: Array.from({ length: WAKE_TRAIL_N }, () => new THREE.Vector3()) },
    uTrailVelocities: { value: Array.from({ length: WAKE_TRAIL_N }, () => new THREE.Vector3()) },
    uTrailAges: { value: new Float32Array(WAKE_TRAIL_N).fill(TRAIL_DECAY + 1) },
  },
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3  uColor;
    uniform float uHoverActive;
    uniform float uWakeAngle;
    uniform float uWakeSpread;
    uniform float uTrailDecay;
    uniform vec3  uTrailPositions[20];
    uniform vec3  uTrailVelocities[20];
    uniform float uTrailAges[20];

    varying vec3 vPosition;

    void main() {
      float totalAlpha = 0.0;

      for (int i = 0; i < 20; i++) {
        float age = uTrailAges[i];
        if (age <= 0.0 || age >= uTrailDecay) continue;

        vec3  pos  = uTrailPositions[i];
        vec3  vel  = uTrailVelocities[i];
        float fade = 1.0 - (age / uTrailDecay);

        // Direção de movimento normalizada
        vec3 velNorm = length(vel) > 0.0001 ? normalize(vel) : vec3(0.0, 0.0, -1.0);

        // Vetor do ponto de rastro até este fragmento
        vec3  toFrag     = vPosition - pos;
        float dist       = length(toFrag);
        if (dist < 0.001) continue;
        vec3  toFragNorm = toFrag / dist;

        // ---- Filtro do cone em V ----
        // A onda só é visível ATRÁS do ponto de origem (direção oposta à velocidade)
        float cosToBack = dot(toFragNorm, -velNorm);
        if (cosToBack < cos(uWakeAngle)) continue; // fora do cone

        // ---- Anel de onda se expandindo ----
        // O raio cresce com o tempo (velocidade = uWakeSpread unidades/segundo)
        float expectedRadius = age * uWakeSpread;
        float ringDist       = abs(dist - expectedRadius);

        // Espessura fina da frente de onda
        float intensity = smoothstep(0.045, 0.0, ringDist);

        // Fade suave na borda do cone (evita corte abrupto) e ao longo do tempo
        float coneFade = smoothstep(cos(uWakeAngle), cos(uWakeAngle * 0.5), cosToBack);
        intensity *= fade * coneFade;

        totalAlpha = max(totalAlpha, intensity);
      }

      // Multiplicador global de entrada/saída do mouse
      totalAlpha *= uHoverActive;

      if (totalAlpha <= 0.001) discard;
      gl_FragColor = vec4(uColor, clamp(totalAlpha, 0.0, 0.95));
    }
  `,
};

/* ------------------------------------------------------------------ */
/* 4. Um cristal individual: quartzo cinza com interface Igloo HUD    */
/* ------------------------------------------------------------------ */
const FADE_EASE = 0.05; // Fator de desvanecimento ao sair do cristal (menor = delay mais longo)

function Crystal({ seed = 1, label }) {
  const groupRef = useRef();
  const mainMeshRef = useRef();
  const wireframeMatRef = useRef();

  // Fade de entrada/saída do hover
  const isHovering = useRef(false);
  const currentActive = useRef(0.0);

  // Ring buffer do rastro de barco (20 entradas, espaço local do mesh)
  const trailBuf = useRef(
    Array.from({ length: WAKE_TRAIL_N }, () => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      age: TRAIL_DECAY + 1, // começa "morto" (acima do decay)
    }))
  );
  const lastLocalPos = useRef(new THREE.Vector3(999, 999, 999));
  const lastEventTs = useRef(0);

  const { nodes } = useGLTF("/models/cristal.glb");
  const geometry =
    nodes.Mesh1?.geometry ||
    nodes.geometry_0?.geometry ||
    Object.values(nodes).find((n) => n?.geometry)?.geometry;
  const noiseMap = useNoiseTexture();

  const wireframeGeo = useMemo(() => {
    if (!geometry) return null;
    return new THREE.WireframeGeometry(geometry);
  }, [geometry]);

  const uniforms = useMemo(
    () => THREE.UniformsUtils.clone(ScanWireframeShader.uniforms),
    []
  );

  const { transformRotation, transformScale } = useMemo(() => {
    const rand = (offset) => {
      const x = Math.sin((seed + offset) * 12.9898) * 43758.5453;
      return (x - Math.floor(x)) * 2 - 1;
    };
    return {
      transformRotation: [
        rand(1) * 0.2,
        rand(2) * Math.PI,
        rand(3) * 0.2,
      ],
      transformScale: 1.4 + rand(4) * 0.12,
    };
  }, [seed]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }

    // Envelhecer cada entrada do trail
    const buf = trailBuf.current;
    for (let i = 0; i < WAKE_TRAIL_N; i++) {
      buf[i].age += delta;
    }

    // Fade de entrada/saída do hover
    const targetActive = isHovering.current ? 1.0 : 0.0;
    currentActive.current += (targetActive - currentActive.current) * FADE_EASE;

    if (wireframeMatRef.current) {
      const u = wireframeMatRef.current.uniforms;
      u.uHoverActive.value = currentActive.current;
      for (let i = 0; i < WAKE_TRAIL_N; i++) {
        u.uTrailPositions.value[i].copy(buf[i].position);
        u.uTrailVelocities.value[i].copy(buf[i].velocity);
        u.uTrailAges.value[i] = buf[i].age;
      }
      u.uTrailPositions.needsUpdate = true;
      u.uTrailVelocities.needsUpdate = true;
      u.uTrailAges.needsUpdate = true;
    }
  });

  const displayLabel = label || `PORTFOLIO_CO_0${seed}`;

  return (
    <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.4}>
      <group ref={groupRef}>
        {/* A casca de cristal principal */}
        <mesh
          ref={mainMeshRef}
          geometry={geometry}
          scale={transformScale}
          rotation={transformRotation}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (mainMeshRef.current && e.point) {
              const localPoint = e.point.clone();
              mainMeshRef.current.worldToLocal(localPoint);
              isHovering.current = true;

              // Velocidade instantânea (espaço local / segundos)
              const now = performance.now() / 1000;
              const dtEv = Math.max(now - lastEventTs.current, 0.001);
              const vel = localPoint.clone().sub(lastLocalPos.current).divideScalar(dtEv);

              lastLocalPos.current.copy(localPoint);
              lastEventTs.current = now;

              // Shift manual do ring buffer: índice 0 = ponta mais nova
              for (let i = WAKE_TRAIL_N - 1; i > 0; i--) {
                trailBuf.current[i].position.copy(trailBuf.current[i - 1].position);
                trailBuf.current[i].velocity.copy(trailBuf.current[i - 1].velocity);
                trailBuf.current[i].age = trailBuf.current[i - 1].age;
              }
              trailBuf.current[0].position.copy(localPoint);
              trailBuf.current[0].velocity.copy(vel);
              trailBuf.current[0].age = 0;
            }
          }}
          onPointerLeave={() => {
            isHovering.current = false;
          }}
        >
          <MeshTransmissionMaterial
            transmission={1.0}
            roughness={0.1}
            thickness={0.2}
            ior={1.5}
            chromaticAberration={0.06}
            anisotropy={0.3}
            distortion={0.15}
            distortionScale={0.3}
            temporalDistortion={0.05}
            normalMap={noiseMap}
            normalScale={new THREE.Vector2(0.2, 0.2)}
            clearcoat={0.6}
            clearcoatRoughness={0.05}
            attenuationColor="#ffffff"
            attenuationDistance={5.0}
            color="#f8fafc"
            resolution={256}
            samples={4}
            backside
          />
        </mesh>

        {/* Malha de Wireframe de Escaneamento Sobreposta */}
        {wireframeGeo && (
          <lineSegments
            geometry={wireframeGeo}
            scale={transformScale}
            rotation={transformRotation}
          >
            <shaderMaterial
              ref={wireframeMatRef}
              vertexShader={ScanWireframeShader.vertexShader}
              fragmentShader={ScanWireframeShader.fragmentShader}
              uniforms={uniforms}
              transparent
              blending={THREE.AdditiveBlending}
              depthTest={true}
              depthWrite={false}
            />
          </lineSegments>
        )}

        {/* Anotações HUD estilo igloo.inc posicionadas ao redor do cristal */}
        <Html
          position={[0, 0, 0]}
          center
          style={{
            pointerEvents: "none",
            width: "440px",
            height: "320px",
            userSelect: "none",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              fontFamily: "'Courier New', Courier, monospace",
              color: "#ffffff",
              fontSize: "11px",
              letterSpacing: "1px",
              textShadow: "0 0 8px rgba(255,255,255,0.6)",
            }}
          >
            {/* Top-Left: Rótulo do Projeto + Linha Conectora */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "12px", letterSpacing: "1.5px" }}>
                {displayLabel}
              </div>
              <div style={{ opacity: 0.8, fontSize: "10px", marginTop: "2px" }}>
                PUDGY PENGUINS
              </div>
              {/* Linha técnica conectora */}
              <svg
                width="80"
                height="40"
                style={{
                  position: "absolute",
                  top: "28px",
                  left: "0",
                  overflow: "visible",
                }}
              >
                <polyline
                  points="0,0 50,0 75,25"
                  fill="none"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* Top-Right: Dados de Temperatura / Estatísticas */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "10px",
                textAlign: "right",
              }}
            >
              <div style={{ opacity: 0.85 }}>TEMP 35.36</div>
              <div style={{ opacity: 0.65, fontSize: "10px", marginTop: "2px" }}>
                +01.87
              </div>
            </div>

            {/* Bottom-Right: Data + Botão de Exploração */}
            <div
              style={{
                position: "absolute",
                bottom: "15px",
                right: "10px",
                textAlign: "right",
              }}
            >
              <div style={{ opacity: 0.75, fontSize: "10px" }}>D 01.02.2020</div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  borderBottom: "1px solid rgba(255,255,255,0.85)",
                  display: "inline-block",
                  marginTop: "4px",
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
              >
                CLICK TO EXPLORE
              </div>
            </div>
          </div>
        </Html>
      </group>
    </Float>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Carrossel: vários cristais, desliza no eixo X                    */
/* ------------------------------------------------------------------ */

function Scene({ items, index }) {
  const groupRef = useRef();
  const spacing = 3.2;

  useFrame(() => {
    if (!groupRef.current) return;
    const targetX = -index * spacing;
    groupRef.current.position.x +=
      (targetX - groupRef.current.position.x) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <group key={i} position={[i * spacing, 0, 0]}>
          <Crystal seed={i + 1} label={item.label} />
        </group>
      ))}
    </group>
  );
}

// Componente Principal
export default function CrystalCarousel({ items }) {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => Math.min(i + 1, items.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background:
          "radial-gradient(ellipse at 50% 30%, #c8cbd6 0%, #A0A5B1 45%, #6e7380 80%, #464a54 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* 1. MALHA DE PONTINHOS BRANCOS DA INTERFACE (DOT MATRIX GRID) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.35) 1.2px, transparent 1.2px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* 2. TEXTOS GRANDE DESFOCADOS NO FUNDO (BLURRED BACKGROUND TYPOGRAPHY) */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "8%",
          fontSize: "48px",
          fontWeight: "900",
          color: "rgba(255, 255, 255, 0.22)",
          filter: "blur(7px)",
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "4px",
          zIndex: 0,
        }}
      >
        1992 NON-FUNGIBLE TOKEN
      </div>

      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "5%",
          fontSize: "36px",
          fontWeight: "700",
          color: "rgba(255, 255, 255, 0.18)",
          filter: "blur(9px)",
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "3px",
          zIndex: 0,
        }}
      >
        PRE_LOAD_OFF // 2
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "18%",
          fontSize: "72px",
          fontWeight: "900",
          color: "rgba(255, 255, 255, 0.15)",
          filter: "blur(12px)",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      >
        22°
      </div>

      {/* 3. NAVEGAÇÃO E LOGO IGLOO CABEÇALHO */}
      <div
        style={{
          position: "absolute",
          top: "30px",
          left: "40px",
          fontSize: "24px",
          fontWeight: "900",
          color: "#ffffff",
          letterSpacing: "3px",
          zIndex: 10,
          textShadow: "0 0 12px rgba(255,255,255,0.6)",
        }}
      >
        IGLOO
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "25px",
          left: "40px",
          fontSize: "12px",
          color: "rgba(255, 255, 255, 0.75)",
          letterSpacing: "1px",
          zIndex: 10,
        }}
      >
        🔊 Sound: On
      </div>

      {/* 4. CANVAS RENDERER 3D */}
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} style={{ zIndex: 2 }}>
        <Suspense fallback={null}>
          {/* Névoa de profundidade */}
          <fog attach="fog" args={["#A0A5B1", 3.5, 12]} />

          {/* Luz de Ambiente */}
          <ambientLight intensity={1.0} />

          {/* HOLOFOTE DE TEATRO */}
          <spotLight
            position={[0, 7, 1]}
            angle={Math.PI / 5}
            penumbra={0.7}
            intensity={16}
            distance={14}
            color="#ffffff"
            castShadow={false}
          />
          <directionalLight position={[0, 8, 2]} intensity={3.5} color="#f8fafc" />

          {/* Luzes de preenchimento e profundidade */}
          <pointLight position={[0, -2, 2]} intensity={2.0} color="#A0A5B1" />
          <pointLight position={[0, 0, -2.5]} intensity={4.0} color="#ffffff" />

          <Environment preset="city" />
          <StudioParticles />
          <Scene items={items} index={index} />

          {/* Controles de rotação restritos EXCLUSIVAMENTE ao eixo horizontal (Y) */}
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

      {/* 5. BOTÕES DE NAVEGAÇÃO GLASSMORPHIC */}
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

useGLTF.preload("/models/cristal.glb");