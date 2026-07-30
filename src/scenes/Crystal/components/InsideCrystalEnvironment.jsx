// InsideCrystalEnvironment.jsx
// Domo esférico de cristal facetado — ambiente imersivo visto de dentro do cristal

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function InsideCrystalEnvironment({ activeProject }) {
  const domeRef    = useRef();
  const facetsRef  = useRef();
  const floorRef   = useRef();

  const themeColor = activeProject?.themeColor || "#a6cced";

  // Partículas de "poeira de cristal" geradas uma única vez
  const dustPositions = useMemo(() => {
    const arr = new Float32Array(600);
    for (let i = 0; i < 600; i++) {
      arr[i] = (Math.random() - 0.5) * 7;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (domeRef.current)   domeRef.current.rotation.y   =  t * 0.008;
    if (facetsRef.current) facetsRef.current.rotation.y = -t * 0.018;
    if (floorRef.current)  floorRef.current.rotation.z  =  t * 0.005;
  });

  return (
    <group>
      {/* ── 1. DOMO EXTERNO — esfera grande com normais invertidas, facetas cristalinas ── */}
      <mesh ref={domeRef} scale={4.5}>
        <icosahedronGeometry args={[1, 2]} />
        <meshPhysicalMaterial
          side={THREE.BackSide}
          color="#cdd6df"
          roughness={0.06}
          metalness={0.12}
          transmission={0.55}
          thickness={2.5}
          ior={1.6}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transparent
          opacity={0.55}
          envMapIntensity={2.5}
        />
      </mesh>

      {/* ── 2. CAMADA INTERMEDIÁRIA — facetas coloridas com a cor do projeto ── */}
      <mesh ref={facetsRef} scale={3.2}>
        <icosahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial
          side={THREE.BackSide}
          color={themeColor}
          roughness={0.08}
          metalness={0.25}
          transmission={0.45}
          thickness={1.5}
          ior={1.75}
          transparent
          opacity={0.2}
          envMapIntensity={1.8}
        />
      </mesh>

      {/* ── 3. CHÃO REFLETIVO — disco cristalino no "assoalho" ── */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <circleGeometry args={[3, 64]} />
        <meshPhysicalMaterial
          color={themeColor}
          roughness={0.15}
          metalness={0.7}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* ── 4. LUZES CÁUSTICAS INTERNAS ── */}
      <pointLight position={[0,  2.5,  0  ]} intensity={4.0} color={themeColor} distance={12} />
      <pointLight position={[-2, -1,  -1.5]} intensity={2.0} color="#ffffff"    distance={8}  />
      <pointLight position={[ 2,  0,   2  ]} intensity={2.5} color={themeColor} distance={8}  />
      <pointLight position={[0,  -2,   0  ]} intensity={1.5} color="#a0c8e0"    distance={7}  />

      {/* ── 5. POEIRA DE CRISTAL FLUTUANTE ── */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={200} array={dustPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.018} transparent opacity={0.45} sizeAttenuation />
      </points>
    </group>
  );
}
