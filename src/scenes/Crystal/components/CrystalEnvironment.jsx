// CrystalEnvironment.jsx
// Environment dedicado para o cristal — iluminação cinematográfica independente da cena principal

import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * Environment isolado para o cristal.
 * Fornece HDRI próprio + iluminação 3-point (key/fill/rim).
 * O background prop no MeshTransmissionMaterial usa esta textura
 * para isolar a transmissão do restante da cena.
 */
export default function CrystalEnvironment({ children }) {
  return (
    <>
      {/* ── HDRI Dedicado do Cristal ── */}
      <Environment resolution={512}>
        {/* Fundo escuro — escuro o suficiente para o vidro pop */}
        <mesh scale={50}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#1a1a2e" side={THREE.BackSide} />
        </mesh>

        {/* Key light — retângulo branco quente, superior direito */}
        <Lightformer
          form="rect"
          intensity={4}
          color="#ffffff"
          scale={[8, 4, 1]}
          position={[4, 5, 4]}
          target={[0, 0, 0]}
        />

        {/* Fill light — retângulo frio, inferior esquerdo */}
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#c8d4dc"
          scale={[6, 5, 1]}
          position={[-5, -2, -3]}
          target={[0, 0, 0]}
        />

        {/* Rim light — anel traseiro, destaca bordas */}
        <Lightformer
          form="ring"
          intensity={2}
          color="#ffffff"
          scale={4}
          position={[0, 3, -6]}
          target={[0, 0, 0]}
        />
      </Environment>

      {/* ── Iluminação 3-Point Dedicada ── */}

      {/* Key Light — quente, superior direito */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        color="#fff5e6"
      />

      {/* Fill Light — frio, inferior esquerdo */}
      <directionalLight
        position={[-3, 2, -4]}
        intensity={0.4}
        color="#e6f0ff"
      />

      {/* Rim Light — destaca bordas do cristal */}
      <pointLight
        position={[0, 3, -5]}
        intensity={1.5}
        color="#ffffff"
        distance={15}
      />

      {children}
    </>
  );
}
