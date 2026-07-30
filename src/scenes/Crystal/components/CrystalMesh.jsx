// CrystalMesh.jsx
// Componente 3D modular reutilizável para qualquer modelo de cristal (.glb)

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { crystalConfig as defaultConfig } from "../config/crystalConfig";
import ObjectAnchoredHUD from "./ObjectAnchoredHUD";

/* ------------------------------------------------------------------ */
/* 1. Textura de Ruído Suave para Aspecto Fosco (Frosted Surface)     */
/* ------------------------------------------------------------------ */
export function useNoiseTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

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
    ctx.drawImage(small, 0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }, []);
}

/* ------------------------------------------------------------------ */
/* 2. Geometria Orgânica do Conteúdo Interno                          */
/* ------------------------------------------------------------------ */
export function useInnerBlobGeometry(radius = 1) {
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
/* 3. Shader de Fresnel / Rim Light para Bordas Reluzentes            */
/* ------------------------------------------------------------------ */
export const FresnelRimShader = {
  uniforms: {
    uColor: { value: new THREE.Color("#ffffff") },
    uPower: { value: 2.5 },
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
/* 4. Componente de Cristal Modular 3D                                 */
/* ------------------------------------------------------------------ */
export default function CrystalMesh({
  modelPath = defaultConfig.defaultModel,
  seed = 1,
  label,
  sublabel,
  config = defaultConfig,
  onHoverChange,
  onClick,
}) {
  const groupRef = useRef();
  const mainMeshRef = useRef();
  const innerGroupRef = useRef();

  const targetMouseLocal = useRef(new THREE.Vector3());
  const currentMouseLocal = useRef(new THREE.Vector3());
  const isHovering = useRef(false);
  const currentActive = useRef(0.0);

  // Carrega qualquer modelo .glb dinamicamente
  const { nodes } = useGLTF(modelPath);

  // Extrai a geometria base de forma robusta
  const baseGeometry = useMemo(() => {
    if (!nodes) return null;
    return (
      nodes.Mesh1?.geometry ||
      nodes.geometry_0?.geometry ||
      Object.values(nodes).find((n) => n?.geometry)?.geometry
    );
  }, [nodes]);

  // Clonar a geometria para deformar vértices em tempo real
  const animatedGeometry = useMemo(() => {
    if (!baseGeometry) return null;
    return baseGeometry.clone();
  }, [baseGeometry]);

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

  const hoverCfg = config.hoverEffect || defaultConfig.hoverEffect;
  const matCfg = config.material || defaultConfig.material;
  const innerCfg = config.innerBlob || defaultConfig.innerBlob;

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y += 0.003;

    if (innerGroupRef.current) {
      innerGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }

    currentMouseLocal.current.lerp(targetMouseLocal.current, hoverCfg.lerpSpeed);

    const targetActive = isHovering.current ? 1.0 : 0.0;
    currentActive.current += (targetActive - currentActive.current) * hoverCfg.fadeSpeed;
    const active = currentActive.current;

    // Deformação 3D por onda de mouse compartilhada para qualquer cristal
    if (animatedGeometry && basePositions && normals) {
      const pos = animatedGeometry.attributes.position.array;
      const count = animatedGeometry.attributes.position.count;
      const mouse = currentMouseLocal.current;
      const time = state.clock.elapsedTime;
      const radius = hoverCfg.radius;

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
          const wave =
            Math.sin(dist * hoverCfg.frequency - time * hoverCfg.speed) *
            hoverCfg.amplitude *
            envelope;

          const nx = normals[idx];
          const ny = normals[idx + 1];
          const nz = normals[idx + 2];

          pos[idx] = vx + nx * wave;
          pos[idx + 1] = vy + ny * wave;
          pos[idx + 2] = vz + nz * wave;
          isDeformed = true;
        } else if (pos[idx] !== vx || pos[idx + 1] !== vy || pos[idx + 2] !== vz) {
          pos[idx] = vx;
          pos[idx + 1] = vy;
          pos[idx + 2] = vz;
          isDeformed = true;
        }
      }

      if (isDeformed) {
        animatedGeometry.attributes.position.needsUpdate = true;
        animatedGeometry.computeVertexNormals();
      }
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.4}>
      <group ref={groupRef}>
        {/* 1. Conteúdo Interno Congelado (Inner Blob) */}
        {baseGeometry && (
          <group
            ref={innerGroupRef}
            scale={transformScale * innerCfg.scaleFactor}
            rotation={transformRotation}
            renderOrder={-1}
          >
            <mesh geometry={innerGeometry} renderOrder={-1}>
              <meshStandardMaterial {...innerCfg.material} />
            </mesh>
            <pointLight position={[0, 0, 0]} {...innerCfg.pointLight} />
          </group>
        )}

        {/* 2. Cristal Principal — Casca de Gelo/Quartzo Translúcida e Fosca */}
        <mesh
          ref={mainMeshRef}
          geometry={animatedGeometry || baseGeometry}
          scale={transformScale}
          rotation={transformRotation}
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (mainMeshRef.current && e.point) {
              const local = e.point.clone();
              mainMeshRef.current.worldToLocal(local);
              targetMouseLocal.current.copy(local);
              if (!isHovering.current) {
                isHovering.current = true;
                if (onHoverChange) onHoverChange(true);
              }
            }
          }}
          onPointerLeave={() => {
            if (isHovering.current) {
              isHovering.current = false;
              if (onHoverChange) onHoverChange(false);
            }
          }}
        >
          <MeshTransmissionMaterial {...matCfg} normalMap={noiseMap} />
        </mesh>

        {/* 3. Gaiola de Constelação Wireframe 3D Orbitante em Volta do Cristal */}
        {baseGeometry && (
          <mesh
            geometry={animatedGeometry || baseGeometry}
            scale={transformScale * 1.12}
            rotation={transformRotation}
          >
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.16} />
          </mesh>
        )}

        {/* 4. Fresnel / Rim Light */}
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

        {/* 5. HUD 2D Ancorado aos Pontos da Superfície do Cristal com Linhas Guia */}
        <ObjectAnchoredHUD
          crystalMeshRef={mainMeshRef}
          label={label}
          sublabel={sublabel}
          onExplore={onClick}
          isHovered={isHovering.current}
        />
      </group>
    </Float>
  );
}
