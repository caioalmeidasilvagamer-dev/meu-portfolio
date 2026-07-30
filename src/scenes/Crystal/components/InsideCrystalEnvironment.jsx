// InsideCrystalEnvironment.jsx
// Ambiente 3D que envolve a câmera quando ela entra no interior do cristal

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNoiseTexture } from "./CrystalMesh";

export default function InsideCrystalEnvironment({ activeProject }) {
  const caveMeshRef = useRef();
  const crystalReflectionsRef = useRef();
  const noiseMap = useNoiseTexture();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotação sutil e contínua das facetas de espelho da caverna interna
    if (caveMeshRef.current) {
      caveMeshRef.current.rotation.y = t * 0.03;
      caveMeshRef.current.rotation.z = Math.sin(t * 0.02) * 0.05;
    }

    if (crystalReflectionsRef.current) {
      crystalReflectionsRef.current.rotation.y = -t * 0.05;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Caverna de Cristal Facetada Envolvente (Inverted Shell) */}
      <mesh ref={caveMeshRef}>
        <icosahedronGeometry args={[5, 2]} />
        <meshStandardMaterial
          side={THREE.BackSide}
          color="#1e2732"
          roughness={0.2}
          metalness={0.7}
          bumpMap={noiseMap}
          bumpScale={0.06}
          envMapIntensity={2.0}
        />
      </mesh>

      {/* 2. Facetas Internas de Espelho e Distorção de Cristal */}
      <mesh ref={crystalReflectionsRef}>
        <octahedronGeometry args={[3.8, 1]} />
        <meshPhysicalMaterial
          side={THREE.BackSide}
          color="#3a4856"
          roughness={0.15}
          metalness={0.9}
          transmission={0.4}
          ior={1.4}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* 3. Luzes Cáusticas Internas que Projetam Brilhos de Cristal */}
      <pointLight position={[0, 1.5, 0]} intensity={4} color="#a6cced" distance={8} />
      <pointLight position={[-2.5, -1, -1]} intensity={2.5} color="#ffffff" distance={7} />
      <pointLight position={[2.5, 0, 1.5]} intensity={3} color="#6e8fae" distance={7} />
    </group>
  );
}
