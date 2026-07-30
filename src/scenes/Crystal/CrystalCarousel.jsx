// CrystalCarousel.jsx
// Requer: three, @react-three/fiber, @react-three/drei

import { Suspense, useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
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

    // gera o ruído numa resolução BEM menor e deixa o browser esticar/suavizar
    const smallSize = 32;
    const small = document.createElement("canvas");
    small.width = small.height = smallSize;
    const sctx = small.getContext("2d");
    const imgData = sctx.createImageData(smallSize, smallSize);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 40;
      imgData.data[i] = imgData.data[i + 1] = v;
      imgData.data[i + 2] = 255;
      imgData.data[i + 3] = 255;
    }
    sctx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, size, size); // upscale = blur natural

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }, []);
}

/* ------------------------------------------------------------------ */
/* 2. Geometria Orgânica do Conteúdo Interno (Blob Nublado)           */
/* ------------------------------------------------------------------ */
function useInnerBlobGeometry(radius = 1) {
  return useMemo(() => {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const n = v.clone().normalize();
      const bump = 1 + Math.sin(v.x * 4 + v.y * 3) * 0.15 + Math.cos(v.z * 3.5) * 0.12;
      v.copy(n.multiplyScalar(bump));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius]);
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
/* 3. Shader de Fresnel / Rim Light para bordas reluzentes            */
/* ------------------------------------------------------------------ */
const FresnelRimShader = {
  uniforms: {
    uColor:     { value: new THREE.Color("#ffffff") },
    uPower:     { value: 2.5 },
    uIntensity: { value: 0.8 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3  uColor;
    uniform float uPower;
    uniform float uIntensity;
    varying vec3  vNormal;
    varying vec3  vViewPosition;

    void main() {
      vec3 normal  = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), uPower);
      float alpha   = clamp(fresnel * uIntensity, 0.0, 1.0);
      if (alpha < 0.01) discard;
      gl_FragColor  = vec4(uColor, alpha);
    }
  `,
};

/* ------------------------------------------------------------------ */
/* 4. Um cristal individual: quartzo fosco e transparente             */
/* ------------------------------------------------------------------ */
function Crystal({ seed = 1, label }) {
  const groupRef      = useRef();
  const mainMeshRef   = useRef();
  const innerGroupRef = useRef(); // Conteúdo interno congelado

  // Posição em espaço LOCAL + fade de ativação
  const targetMouseLocal  = useRef(new THREE.Vector3());
  const currentMouseLocal = useRef(new THREE.Vector3());
  const isHovering        = useRef(false);
  const currentActive     = useRef(0.0);

  const { nodes } = useGLTF("/models/cristal.glb");
  const baseGeometry = useMemo(() => {
    return (
      nodes.Mesh1?.geometry ||
      nodes.geometry_0?.geometry ||
      Object.values(nodes).find((n) => n?.geometry)?.geometry
    );
  }, [nodes]);

  // Clonar a geometria para poder deformar os vértices com a onda em tempo real
  const animatedGeometry = useMemo(() => {
    if (!baseGeometry) return null;
    return baseGeometry.clone();
  }, [baseGeometry]);

  // Posições originais e normais para cálculo da onda
  const basePositions = useMemo(() => {
    if (!baseGeometry) return null;
    return baseGeometry.attributes.position.array.slice();
  }, [baseGeometry]);

  const normals = useMemo(() => {
    if (!baseGeometry) return null;
    return baseGeometry.attributes.normal.array;
  }, [baseGeometry]);

  const { transformRotation, transformScale } = useMemo(() => {
    const rand = (offset) => {
      const x = Math.sin((seed + offset) * 12.9898) * 43758.5453;
      return (x - Math.floor(x)) * 2 - 1;
    };
    return {
      transformRotation: [rand(1) * 0.2, rand(2) * Math.PI, rand(3) * 0.2],
      transformScale: 1.4 + rand(4) * 0.12,
    };
  }, [seed]);

  const innerGeometry = useInnerBlobGeometry();
  const noiseMap = useNoiseTexture();

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y += 0.003;

    // Animação de flutuação suave do conteúdo interno congelado
    if (innerGroupRef.current) {
      innerGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }

    // Suavização da posição local do mouse
    currentMouseLocal.current.lerp(targetMouseLocal.current, 0.12);

    // Fade de entrada/saída
    const targetActive = isHovering.current ? 1.0 : 0.0;
    currentActive.current += (targetActive - currentActive.current) * 0.08;

    const active = currentActive.current;

    // Deformar a geometria do vidro em 3D quando houver interação (ondas na própria pele do cristal)
    if (animatedGeometry && basePositions && normals) {
      const pos = animatedGeometry.attributes.position.array;
      const count = animatedGeometry.attributes.position.count;
      const mouse = currentMouseLocal.current;
      const time = state.clock.elapsedTime;
      const radius = 0.55;

      let isDeformed = false;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const vx = basePositions[idx];
        const vy = basePositions[idx + 1];
        const vz = basePositions[idx + 2];

        const dx = vx - mouse.x;
        const dy = vy - mouse.y;
        const dz = vz - mouse.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < radius && active > 0.001) {
          const envelope = (1.0 - dist / radius) * active;
          const wave = Math.sin(dist * 14.0 - time * 7.0) * 0.025 * envelope;

          const nx = normals[idx];
          const ny = normals[idx + 1];
          const nz = normals[idx + 2];

          pos[idx]     = vx + nx * wave;
          pos[idx + 1] = vy + ny * wave;
          pos[idx + 2] = vz + nz * wave;
          isDeformed   = true;
        } else if (pos[idx] !== vx || pos[idx + 1] !== vy || pos[idx + 2] !== vz) {
          pos[idx]     = vx;
          pos[idx + 1] = vy;
          pos[idx + 2] = vz;
          isDeformed   = true;
        }
      }

      if (isDeformed) {
        animatedGeometry.attributes.position.needsUpdate = true;
        animatedGeometry.computeVertexNormals();
      }
    }
  });

  const displayLabel = label || `PORTFOLIO_CO_0${seed}`;

  return (
    <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.4}>
      <group ref={groupRef}>
        {/* 1. Brilho interno suave — luz que irradia de dentro do gelo */}
        {baseGeometry && (
          <group ref={innerGroupRef} scale={transformScale * 0.12} rotation={transformRotation}>
            <mesh geometry={innerGeometry}>
              <meshStandardMaterial
                color="#e8edf0"
                roughness={0.9}
                metalness={0.0}
                emissive="#dde8ef"
                emissiveIntensity={0.4}
                transparent
                opacity={0.6}
              />
            </mesh>
            <pointLight position={[0, 0, 0]} intensity={4} distance={3.5} color="#ffffff" />
          </group>
        )}

        {/* 2. Cristal principal — casca de gelo/cristal translúcida e fosca */}
        <mesh
          ref={mainMeshRef}
          geometry={animatedGeometry || baseGeometry}
          scale={transformScale}
          rotation={transformRotation}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (mainMeshRef.current && e.point) {
              const local = e.point.clone();
              mainMeshRef.current.worldToLocal(local);
              targetMouseLocal.current.copy(local);
              isHovering.current = true;
            }
          }}
          onPointerLeave={() => {
            isHovering.current = false;
          }}
        >
          <MeshTransmissionMaterial
            transmission={0.98}
            roughness={0.35}
            thickness={1.6}
            ior={1.31}
            chromaticAberration={0.015}
            anisotropy={0.2}
            distortion={0.05}
            distortionScale={0.12}
            temporalDistortion={0.02}
            normalMap={noiseMap}
            normalScale={new THREE.Vector2(0.05, 0.05)}
            clearcoat={0.2}
            clearcoatRoughness={0.35}
            attenuationColor="#9aa3ab"
            attenuationDistance={2.0}
            color="#e6e8ea"
            resolution={512}
            samples={6}
            backside
          />
        </mesh>

        {/* 3. Casca de Fresnel / Rim Light para bordas reluzentes */}
        {baseGeometry && (
          <mesh
            geometry={animatedGeometry || baseGeometry}
            scale={transformScale * 1.01}
            rotation={transformRotation}
            renderOrder={10}
          >
            <shaderMaterial
              vertexShader={FresnelRimShader.vertexShader}
              fragmentShader={FresnelRimShader.fragmentShader}
              uniforms={FresnelRimShader.uniforms}
              transparent={true}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
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

      {/* 4. CANVAS RENDERER 3D DE ALTA DEFINIÇÃO */}
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        style={{ zIndex: 2 }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={["#8f97a1"]} />
          {/* Névoa recuada para não escurecer ou poluir o cristal e os wireframes */}
          <fog attach="fog" args={["#8f97a1", 10, 25]} />

          {/* Luz de Ambiente */}
          <ambientLight intensity={0.5} />

          {/* Holofote Superior-Esquerdo (Key highlight das facetas de gelo) */}
          <spotLight
            position={[-3, 6, 3]}
            angle={Math.PI / 4}
            penumbra={0.6}
            intensity={4}
            distance={14}
            color="#ffffff"
            castShadow={false}
          />
          <directionalLight position={[4, 7, 2]} intensity={1.1} color="#f8fafc" />

          {/* Luzes de preenchimento e profundidade */}
          <pointLight position={[0, -2, 2]} intensity={0.7} color="#A0A5B1" />
          <pointLight position={[0, 0, -2.5]} intensity={0.9} color="#ffffff" />

          {/* Ambiente Iluminado por Painéis de Luz (Lightformers) */}
          <Environment resolution={256}>
            {/* Painel principal (key light) — cria o highlight diagonal grande que a referência tem */}
            <Lightformer
              form="rect"
              intensity={3}
              color="#ffffff"
              scale={[6, 3, 1]}
              position={[4, 5, 4]}
              target={[0, 0, 0]}
            />
            {/* Preenchimento suave do lado oposto, mais fraco e frio */}
            <Lightformer
              form="rect"
              intensity={1}
              color="#c8d4dc"
              scale={[5, 4, 1]}
              position={[-5, -2, -3]}
              target={[0, 0, 0]}
            />
            {/* Luz de trás pra reforçar o rim das bordas */}
            <Lightformer
              form="ring"
              intensity={1.5}
              color="#ffffff"
              scale={3}
              position={[0, 2, -6]}
              target={[0, 0, 0]}
            />
          </Environment>
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