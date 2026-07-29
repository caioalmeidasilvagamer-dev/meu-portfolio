// CrystalCarousel.jsx
// Requer: three, @react-three/fiber, @react-three/drei
// npm i three @react-three/fiber @react-three/drei

import { Suspense, useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Environment,
  Image as DreiImage,
  useGLTF,
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
      imgData.data[i + 2] = 255; // canal azul alto = normal "pra frente"
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
/* 2. Um cristal individual: casca de vidro fosco + foto presa dentro   */
/* ------------------------------------------------------------------ */
function Crystal({ imageUrl, seed = 1, label }) {
  const groupRef = useRef();
  const { nodes } = useGLTF("/models/cristal.glb");
  const geometry =
    nodes.Mesh1?.geometry ||
    nodes.geometry_0?.geometry ||
    Object.values(nodes).find((n) => n?.geometry)?.geometry;
  const noiseMap = useNoiseTexture();

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
      transformScale: 1 + rand(4) * 0.15,
    };
  }, [seed]);

  useFrame((state) => {
    // rotação lenta e flutuação sutil, dá vida sem distrair
    groupRef.current.rotation.y += 0.0025;
    groupRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.6 + seed) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* A foto fica DENTRO do volume do cristal, atrás do centro.
          É a luz atravessando o vidro na frente dela que cria a distorção,
          não um efeito aplicado na própria imagem. */}
      <DreiImage
        url={imageUrl}
        position={[0, 0, -0.05]}
        scale={[1.3, 1.6]}
        transparent
      />

      {/* A casca de cristal em si */}
      <mesh geometry={geometry} scale={transformScale} rotation={transformRotation}>
        <MeshTransmissionMaterial
          // --- parâmetros ajustados pra ficar cinza/translúcido, tipo gelo, não preto ---
          roughness={0.35}
          thickness={0.4}
          ior={1.3}
          chromaticAberration={0.03}
          anisotropy={0.2}
          distortion={0.3}
          distortionScale={0.3}
          temporalDistortion={0.08}
          normalMap={noiseMap}
          normalScale={new THREE.Vector2(0.4, 0.4)}
          clearcoat={0.2}
          attenuationColor="#dfe7ea"
          attenuationDistance={1.2}
          color="#f0f4f6"
          resolution={256}
          samples={4}
          backside
        />
      </mesh>

      {label && (
        <group position={[0.9, 0.6, 0]}>
          {/* aqui entram os labels estilo "PORTFOLIO_CO_01" do igloo,
              como <Text> do drei ou HTML sobreposto via <Html> */}
        </group>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Carrossel: vários cristais, desliza no eixo X                    */
/* ------------------------------------------------------------------ */

// Fica DENTRO do Canvas, por isso pode usar useFrame
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
          <Crystal imageUrl={item.image} seed={i + 1} label={item.label} />
        </group>
      ))}
    </group>
  );
}

// Fica FORA do Canvas, controla estado e botões
export default function CrystalCarousel({ items }) {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => Math.min(i + 1, items.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <div style={{ width: "100%", height: "100vh", background: "#1a1d22" }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, 5, 3]} intensity={2.5} />
          <directionalLight position={[-3, -2, -3]} intensity={1} />
          <Environment preset="dawn" />
          <Scene items={items} index={index} />
        </Suspense>
      </Canvas>

      <button onClick={prev} style={{ position: "absolute", left: 20, top: "50%" }}>
        ‹
      </button>
      <button onClick={next} style={{ position: "absolute", right: 20, top: "50%" }}>
        ›
      </button>
    </div>
  );
}

useGLTF.preload("/models/cristal.glb");