// ProjectContent.jsx
// Conteúdo interno do cristal: modelo 3D do projeto ou fallback visual temático

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Float, Sparkles } from "@react-three/drei";

/* ── Wrapper que carrega GLB de forma segura ── */
function GLBModel({ src, scale }) {
  const { scene } = useGLTF(src);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} scale={scale} />;
}

/* ── Fallback geométrico quando não há GLB ── */
function FallbackShape({ themeColor }) {
  return (
    <Float speed={1.5} rotationIntensity={0.35} floatIntensity={0.3}>
      <mesh>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={themeColor}
          roughness={0.35}
          metalness={0.15}
          emissive={themeColor}
          emissiveIntensity={0.7}
        />
      </mesh>
    </Float>
  );
}

/* ── Componente principal ── */
export default function ProjectContent({
  innerModel = null,
  innerScale = 0.8,
  themeColor = "#a6cced",
}) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.22;
    groupRef.current.position.y = Math.sin(t * 0.85) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* ── Conteúdo: GLB ou fallback geométrico temático ── */}
      {innerModel ? (
        <Suspense fallback={<FallbackShape themeColor={themeColor} />}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <GLBModel src={innerModel} scale={innerScale} />
          </Float>
        </Suspense>
      ) : null}

      {/* ── Partículas temáticas ── */}
      {innerModel && (
        <Sparkles count={16} scale={[2, 2, 2]} size={2.2} speed={0.45} opacity={0.6} color={themeColor} />
      )}

      {/* ── Luz interna temática ── */}
      <pointLight position={[0, 0.2, 0]} intensity={2.5} color={themeColor} distance={4} />
    </group>
  );
}
